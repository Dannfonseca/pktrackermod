// TODOLISTPOKEMON/js/history.js
/**
 * Gerencia a lógica do modal de Histórico de Empréstimos.
 * Responsável por abrir/fechar o modal, buscar os dados do histórico completo
 * via API, filtrar e renderizar as entradas agrupadas por treinador/data,
 * permitir a busca e filtragem (todos, ativos, devolvidos), e lidar com
 * a exclusão de grupos de histórico (devolvendo Pokémons pendentes antes)
 * ou a exclusão total do histórico (com confirmação e senha).
 *
 * Funções Principais:
 * - openHistoryModal: Abre o modal e carrega os dados.
 * - closeHistoryModal: Fecha o modal.
 * - loadAndRenderHistory: Busca dados da API e chama a renderização.
 * - filterAndRenderHistory: Filtra o cache local (fullHistoryCache) baseado nos inputs de busca/filtro e renderiza a lista.
 * - handleDeleteHistoryGroup: Devolve Pokémons pendentes de um grupo e depois deleta as entradas do histórico associadas.
 * - handleDeleteAllHistory: Deleta todo o histórico (sem devolver Pokémons).
 * - clearHistoryCache: Limpa o cache local do histórico.
 */
import { dom } from './domElements.js';

import { fetchAllHistory, deleteHistoryEntryAPI, deleteAllHistoryAPI, returnPokemonAPI } from './api.js';
import { displayError, displaySuccess, formatBrazilianDate, showSpinner, hideSpinner } from './ui.js';
import { ADMIN_PASSWORD, clanData } from './config.js';
import { renderActivePokemons } from './homeView.js';




let fullHistoryCache = [];
let groupedHistoryForDelete = {};

export function openHistoryModal() {
    if (dom.historyModal) {
        dom.historyModal.style.display = 'flex';
        fullHistoryCache = [];
        loadAndRenderHistory();
    } else {
        console.error("Modal de Histórico não encontrado no DOM.");
    }
}

export function closeHistoryModal() {
    if (dom.historyModal) {
        dom.historyModal.style.display = 'none';
    }
}

async function loadAndRenderHistory() {
    if (!dom.historyListContainer) {
        console.error("Container 'historyListContainer' não encontrado no DOM.");
        return;
    }
    try {
        console.log("Buscando histórico da API...");
        fullHistoryCache = await fetchAllHistory() || [];
        console.log(`Histórico recebido: ${fullHistoryCache.length} entradas. Primeira entrada:`, fullHistoryCache[0]);
        filterAndRenderHistory();
    } catch (error) {
        console.error("Erro ao carregar e renderizar histórico:", error);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro ao carregar histórico. Tente novamente.</div>`;
    }
}

export function filterAndRenderHistory() {
    if (!dom.historyFilterSelect || !dom.historySearchInput || !dom.historyListContainer) {
        console.error("Elementos de filtro/lista do histórico não encontrados no DOM.");
        return;
    }
    const filterValue = dom.historyFilterSelect.value;
    const searchValue = dom.historySearchInput.value.toLowerCase().trim();
    dom.historyListContainer.innerHTML = '';

    if (!Array.isArray(fullHistoryCache)) {
        console.error("Cache de histórico inválido:", fullHistoryCache);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro interno ao processar histórico.</div>`;
        return;
    }

    console.log(`Filtrando histórico: Status='${filterValue}', Busca='${searchValue}'`);


    const groupedHistory = {};
    fullHistoryCache.forEach((entry, entryIndex) => {
        if (!entry || typeof entry !== 'object' || !entry.trainer || !entry.date || !entry.pokemon_name) {
            console.warn(`Entrada de histórico inválida ignorada no índice ${entryIndex}:`, entry);
            return;
        }
        if(entryIndex < 5) {
             console.log(`Processando Entrada Histórico ${entryIndex}: clan_name recebido = ${entry.clan_name}`);
        }

        const key = `${entry.trainer}-${entry.date}`;
        if (!groupedHistory[key]) {
            groupedHistory[key] = {
                trainer: entry.trainer, date: entry.date, pokemons: [], allReturned: true, entryIds: []
            };
        }
        groupedHistory[key].pokemons.push({
            id: entry.id,
            name: entry.pokemon_name,
            returned: !!entry.returned,
            returnDate: entry.returnDate || null,
            pokemonId: entry.pokemon,
            clan_name: entry.clan_name || 'unknown'
        });
        groupedHistory[key].entryIds.push(entry.id);
        if (!entry.returned) { groupedHistory[key].allReturned = false; }
    });
    groupedHistoryForDelete = groupedHistory;


    const filteredGroups = Object.values(groupedHistory)
        .filter(group => {
            if (filterValue === 'active' && group.allReturned) return false;
            if (filterValue === 'returned' && !group.allReturned) return false;
            if (searchValue) {
                const trainerMatch = group.trainer.toLowerCase().includes(searchValue);
                const pokemonMatch = group.pokemons.some(p => p?.name?.toLowerCase().includes(searchValue));
                return trainerMatch || pokemonMatch;
            }
            return true;
        })
        .sort((a, b) => {
             try {
                 const dateA = new Date(a.date); const dateB = new Date(b.date);
                 if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                 const dateComparison = dateB - dateA;
                 if (dateComparison !== 0) return dateComparison;
             } catch(e) { console.warn("Erro ao ordenar datas ISO:", a.date, b.date, e); }
             return a.trainer.localeCompare(b.trainer);
         });


    if (filteredGroups.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Nenhum registro encontrado para os filtros atuais.';
        dom.historyListContainer.appendChild(emptyMessage);
        return;
    }

    const createPokemonNameHTML = (pokemon) => {
        if (!pokemon || typeof pokemon !== 'object') return '<span style="color: red;">[Erro Dados Pokémon]</span>';
        const clanKey = pokemon.clan_name || 'unknown';
        const clanConfig = clanData[clanKey];
        const clanColor = clanConfig?.color || '#cccccc';
        if (!clanConfig && clanKey !== 'unknown') {
             console.warn(`Configuração do Clã não encontrada para '${clanKey}' (Pokemon: ${pokemon.name})`);
        }
        const clanNameTitle = clanKey !== 'unknown' ? clanKey : 'Desconhecido';
        const clanTag = `<span class="pokemon-clan-tag" style="background-color: ${clanColor};" title="Clã: ${clanNameTitle}"></span>`;
        const safeName = (pokemon.name || 'Nome Inválido').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `${clanTag}${safeName}`;
    };

    filteredGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = `history-item ${group.allReturned ? 'returned' : 'active'}`;
        const header = document.createElement('div');
        header.className = 'history-header';
        const trainerInfo = document.createElement('div');
        trainerInfo.className = 'history-trainer';
        trainerInfo.textContent = group.trainer;
        const dateInfo = document.createElement('div');
        dateInfo.className = 'history-date';
        dateInfo.textContent = formatBrazilianDate(group.date);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button button';
        deleteButton.textContent = 'Deletar';
        deleteButton.dataset.action = 'delete-history-group';
        deleteButton.dataset.trainer = group.trainer;
        deleteButton.dataset.date = group.date;

        header.appendChild(trainerInfo);
        header.appendChild(dateInfo);
        header.appendChild(deleteButton);

        const pokemonsListDiv = document.createElement('div');
        pokemonsListDiv.className = 'history-pokemons';
        const activePokemonsInGroup = group.pokemons.filter(p => !p.returned);
        const returnedPokemonsInGroup = group.pokemons.filter(p => p.returned);

        if (activePokemonsInGroup.length > 0) {
            const activeListHTML = activePokemonsInGroup.map(createPokemonNameHTML).join(', ');
            const activeDiv = document.createElement('div');
            activeDiv.innerHTML = `<span class="history-status active">Em uso</span>: ${activeListHTML}`;
            pokemonsListDiv.appendChild(activeDiv);
        }

        const returnsByDate = {};
        returnedPokemonsInGroup.forEach(p => {
            const returnDateKey = p.returnDate || 'Data Indisponível';
            if (!returnsByDate[returnDateKey]) { returnsByDate[returnDateKey] = []; }
            returnsByDate[returnDateKey].push(p);
        });

        Object.entries(returnsByDate).sort(([dateA], [dateB]) => {
            if (dateA === 'Data Indisponível') return 1; if (dateB === 'Data Indisponível') return -1;
            try { const dA = new Date(dateA); const dB = new Date(dateB); if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return 0; return dB - dA; } catch(e) { return 0; }
        }).forEach(([returnDateISO, pokemons]) => {
             const returnedListHTML = pokemons.map(createPokemonNameHTML).join(', ');
             const returnedDiv = document.createElement('div');
             const formattedReturnDate = (returnDateISO !== 'Data Indisponível') ? formatBrazilianDate(returnDateISO) : '';
             returnedDiv.innerHTML = `<span class="history-status returned">Devolvido</span>: ${returnedListHTML} ${formattedReturnDate ? `<div class="history-return-date">em ${formattedReturnDate}</div>` : ''}`;
             pokemonsListDiv.appendChild(returnedDiv);
         });

        item.appendChild(header);
        item.appendChild(pokemonsListDiv);
        dom.historyListContainer.appendChild(item);
    });
}



export async function handleDeleteHistoryGroup(button) {
    const trainer = button.dataset.trainer;
    const dateISO = button.dataset.date;

    const groupKey = `${trainer}-${dateISO}`;
    const groupInfo = groupedHistoryForDelete[groupKey];


    if (!groupInfo || !groupInfo.entryIds || groupInfo.entryIds.length === 0) {
         console.error(`Não foi possível encontrar informações/IDs para deletar o grupo: ${groupKey}`, groupInfo);
         displayError('Erro ao preparar a deleção do registro (IDs não encontrados).');
         return;
    }


    const password = prompt(`ATENÇÃO: Pokémons em uso serão devolvidos!\nDigite a senha para DEVOLVER e DELETAR o histórico de ${trainer} de ${formatBrazilianDate(dateISO)}:`);
    if (password !== ADMIN_PASSWORD) {
        if (password !== null) displayError('Senha incorreta!');
        return;
    }


    if (!confirm(`Tem certeza que deseja DEVOLVER os Pokémons pendentes e DELETAR este registro de histórico?\nTreinador: ${trainer}\nData: ${formatBrazilianDate(dateISO)}\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }


    const notReturnedPokemons = groupInfo.pokemons.filter(p => !p.returned);
    let werePokemonsReturned = false;

    if (notReturnedPokemons.length > 0) {
        console.log(`Devolvendo ${notReturnedPokemons.length} Pokémon(s) pendentes antes de deletar...`);
        showSpinner();
        try {
            const returnPromises = notReturnedPokemons.map(p => {

                console.log(`Tentando devolver entrada ID: ${p.id} (Pokémon: ${p.name})`);
                return returnPokemonAPI(p.id);
            });
            await Promise.all(returnPromises);
            console.log("Todos os Pokémons pendentes foram devolvidos com sucesso.");
            werePokemonsReturned = true;
        } catch (error) {
            hideSpinner();
            console.error("Erro ao tentar devolver Pokémons pendentes:", error);
            displayError(`Falha ao devolver um ou mais Pokémons pendentes: ${error.message}. A exclusão do histórico foi cancelada.`);

            fullHistoryCache = [];
            loadAndRenderHistory();
            renderActivePokemons();
            return;
        } finally {

             if (!werePokemonsReturned) hideSpinner();
        }
    } else {
        console.log("Nenhum Pokémon pendente para devolver neste grupo.");
    }



    console.log(`Deletando ${groupInfo.entryIds.length} entradas do histórico com IDs: ${groupInfo.entryIds.join(', ')}`);
    showSpinner();
    try {


        const deletePromises = groupInfo.entryIds.map(id => deleteHistoryEntryAPI(id)); // Modificado para usar a nova API
        await Promise.all(deletePromises);

        displaySuccess(`Registro de histórico deletado com sucesso! ${werePokemonsReturned ? '(Pokémons pendentes foram devolvidos automaticamente)' : ''}`);

    } catch (error) {
        hideSpinner();
        console.error("Erro durante a deleção do grupo de histórico:", error);
        displayError(`Erro ao deletar histórico: ${error.message}`);

    } finally {
        hideSpinner();

        fullHistoryCache = [];
        loadAndRenderHistory();
        renderActivePokemons();
    }
}



export async function handleDeleteAllHistory() {
    const password = prompt('[CUIDADO] Digite a senha para deletar TODO o histórico (NÃO devolve Pokémons):');
    if (password !== ADMIN_PASSWORD) {
        if (password !== null) displayError('Senha incorreta!');
        return;
    }
    if (!confirm('ALERTA MÁXIMO!\n\nVocê está prestes a deletar TODO o histórico de empréstimos.\nEsta ação é IRREVERSÍVEL e NÃO devolverá Pokémons que ainda estejam em uso.\n\nConfirma a exclusão total do histórico?')) {
        return;
    }
     if (!confirm('Segunda confirmação: Tem ABSOLUTA CERTEZA que deseja apagar TODO o histórico? Os Pokémons em uso NÃO serão devolvidos automaticamente.')) {
        return;
    }

    showSpinner();
    try {
        await deleteAllHistoryAPI();
        displaySuccess('Histórico completo deletado com sucesso!');
        fullHistoryCache = [];
        loadAndRenderHistory();
        renderActivePokemons();
    } catch (error) {
         displayError(`Erro ao deletar todo o histórico: ${error.message}`);
    } finally {
        hideSpinner();
    }
}


export function clearHistoryCache() {
    console.log("Limpando cache do histórico.");
    fullHistoryCache = [];
}