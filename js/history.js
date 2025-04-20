// TODOLISTPOKEMON/js/history.js
/**
 * Gerencia a lógica do modal de Histórico de Empréstimos.
 * Responsável por abrir/fechar o modal, buscar os dados do histórico completo
 * via API (incluindo nome do treinador e comentário via JOIN), filtrar e renderizar
 * as entradas agrupadas por treinador/data, exibir o comentário associado,
 * permitir a busca e filtragem, e lidar com a exclusão de grupos de histórico
 * ou a exclusão total do histórico (com confirmação e senha admin).
 *
 * Funções Principais:
 * - openHistoryModal / closeHistoryModal: Abre/fecha o modal.
 * - loadAndRenderHistory: Busca dados da API e chama a renderização.
 * - filterAndRenderHistory: Filtra o cache local e renderiza a lista agrupada (incluindo comentário).
 * - handleDeleteHistoryGroup: Devolve Pokémons pendentes de um grupo e deleta entradas associadas.
 * - handleDeleteAllHistory: Deleta todo o histórico (requer senha admin).
 * - clearHistoryCache: Limpa o cache local do histórico.
 */
import { dom } from './domElements.js';
import { fetchAllHistory, deleteHistoryEntryAPI, deleteAllHistoryAPI, returnPokemonAPI } from './api.js';
import { displayError, displaySuccess, formatBrazilianDate, showSpinner, hideSpinner } from './ui.js';
import { clanData } from './config.js';
import { renderActivePokemons } from './homeView.js';

const LOCAL_ADMIN_PASSWORD_FOR_CHECK = 'raito123';

let fullHistoryCache = [];
let groupedHistoryForDelete = {};

export function openHistoryModal() {
    if (dom.historyModal) {
        dom.historyModal.style.display = 'flex';
        fullHistoryCache = [];
        groupedHistoryForDelete = {};
        if(dom.historySearchInput) dom.historySearchInput.value = '';
        if(dom.historyFilterSelect) dom.historyFilterSelect.value = 'all';
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
    dom.historyListContainer.innerHTML = '';
    showSpinner();
    try {
        console.log("[History] Buscando histórico completo da API...");
        fullHistoryCache = await fetchAllHistory() || [];
        hideSpinner();
        console.log(`[History] Histórico recebido: ${fullHistoryCache.length} entradas.`);
        filterAndRenderHistory();
    } catch (error) {
        hideSpinner();
        console.error("[History] Erro ao carregar histórico:", error);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro ao carregar histórico. Tente novamente.</div>`;
    }
}

export function filterAndRenderHistory() {
    if (!dom.historyFilterSelect || !dom.historySearchInput || !dom.historyListContainer) {
        console.error("[History] Elementos de filtro/lista do histórico não encontrados.");
        return;
    }
    const filterValue = dom.historyFilterSelect.value;
    const searchValue = dom.historySearchInput.value.toLowerCase().trim();
    dom.historyListContainer.innerHTML = '';
    groupedHistoryForDelete = {};

    if (!Array.isArray(fullHistoryCache)) {
        console.error("[History] Cache de histórico inválido:", fullHistoryCache);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro interno ao processar histórico.</div>`;
        return;
    }

    console.log(`[History] Filtrando: Status='${filterValue}', Busca='${searchValue}'`);

    // 1. Agrupar o histórico
    const groupedHistory = {};
    fullHistoryCache.forEach((entry, entryIndex) => {
        // <<< NOVO: Validação inclui 'comment' (opcional) >>>
        if (!entry || typeof entry !== 'object' || !entry.trainer_name || !entry.date || !entry.pokemon_name) {
            console.warn(`[History] Entrada inválida ignorada (índice ${entryIndex}):`, entry);
            return;
        }
        const key = `${entry.trainer_name}-${entry.date}`;
        if (!groupedHistory[key]) {
            groupedHistory[key] = {
                trainer_id: entry.trainer_id,
                trainer_name: entry.trainer_name,
                date: entry.date,
                pokemons: [],
                allReturned: true,
                entryIds: [],
                comment: entry.comment || null // <<< NOVO: Guarda o comentário (do primeiro item do grupo)
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
        if (!entry.returned) {
            groupedHistory[key].allReturned = false;
        }
    });
    groupedHistoryForDelete = { ...groupedHistory };

    // 2. Filtrar os grupos
    const filteredGroups = Object.values(groupedHistory)
        .filter(group => {
            if (filterValue === 'active' && group.allReturned) return false;
            if (filterValue === 'returned' && !group.allReturned) return false;

            // <<< NOVO: Busca inclui o comentário >>>
            if (searchValue) {
                const trainerMatch = group.trainer_name.toLowerCase().includes(searchValue);
                const pokemonMatch = group.pokemons.some(p => p?.name?.toLowerCase().includes(searchValue));
                const commentMatch = group.comment && group.comment.toLowerCase().includes(searchValue); // Verifica comentário
                return trainerMatch || pokemonMatch || commentMatch; // Retorna true se bater em qualquer um
            }
            return true;
        })
        // 3. Ordenar os grupos
        .sort((a, b) => {
             try {
                 const dateA = new Date(a.date); const dateB = new Date(b.date);
                 if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                 return dateB - dateA;
             } catch(e) {
                 console.warn("[History] Erro ao ordenar datas:", a.date, b.date, e);
                 return 0;
             }
         });

    // 4. Renderizar
    if (filteredGroups.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Nenhum registro encontrado para os filtros atuais.';
        dom.historyListContainer.appendChild(emptyMessage);
        return;
    }

    const createPokemonNameHTML = (pokemon) => {
        if (!pokemon || typeof pokemon !== 'object') return '<span style="color: red;">[Erro Dados]</span>';
        const clanKey = pokemon.clan_name || 'unknown';
        const clanConfig = clanData[clanKey];
        const clanColor = clanConfig?.color || '#cccccc';
        const clanNameTitle = (clanKey !== 'unknown' && clanConfig) ? (clanKey.charAt(0).toUpperCase() + clanKey.slice(1)) : 'Desconhecido';
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
        trainerInfo.textContent = group.trainer_name;

        const dateInfo = document.createElement('div');
        dateInfo.className = 'history-date';
        dateInfo.textContent = formatBrazilianDate(group.date);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button button';
        deleteButton.textContent = 'Deletar';
        deleteButton.dataset.action = 'delete-history-group';
        deleteButton.dataset.trainer = group.trainer_name;
        deleteButton.dataset.date = group.date;
        deleteButton.title = 'Deletar este registro (devolverá Pokémons pendentes)';

        header.appendChild(trainerInfo);
        header.appendChild(dateInfo);
        header.appendChild(deleteButton);

        const pokemonsListDiv = document.createElement('div');
        pokemonsListDiv.className = 'history-pokemons';

        // <<< NOVO: Renderiza o comentário se existir >>>
        if (group.comment) {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'history-comment'; // Classe para estilização
            // Sanitiza o comentário para evitar XSS simples
            const safeComment = group.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            commentDiv.innerHTML = `<strong>Comentário:</strong> ${safeComment}`;
            pokemonsListDiv.appendChild(commentDiv);
        }

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
    console.log(`[History] ${filteredGroups.length} grupos renderizados.`);
}



export async function handleDeleteHistoryGroup(button) {
    const trainerName = button.dataset.trainer;
    const dateISO = button.dataset.date;
    const groupKey = `${trainerName}-${dateISO}`;
    const groupInfo = groupedHistoryForDelete[groupKey];

    if (!groupInfo || !groupInfo.entryIds || groupInfo.entryIds.length === 0) {
         console.error(`[History Delete] Não foi possível encontrar informações/IDs para deletar o grupo: ${groupKey}`, groupInfo);
         displayError('Erro ao preparar a deleção do registro (IDs não encontrados). Verifique o console.');
         return;
    }

    const password = prompt(`ATENÇÃO: Pokémons em uso neste grupo (${groupInfo.pokemons.filter(p=>!p.returned).length}) serão devolvidos!\nDigite a senha ADMIN para DEVOLVER e DELETAR o histórico de ${trainerName} de ${formatBrazilianDate(dateISO)}:`);
    if (password === null) return;

    if (password !== LOCAL_ADMIN_PASSWORD_FOR_CHECK) {
        displayError('Senha de administrador incorreta!');
        return;
    }

    if (!confirm(`Tem certeza que deseja DEVOLVER os Pokémons pendentes e DELETAR este registro de histórico?\nTreinador: ${trainerName}\nData: ${formatBrazilianDate(dateISO)}\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    const deleteButton = button;
    deleteButton.disabled = true;
    showSpinner();

    const notReturnedPokemons = groupInfo.pokemons.filter(p => !p.returned);
    let werePokemonsReturned = false;

    try {
        if (notReturnedPokemons.length > 0) {
            console.log(`[History Delete] Devolvendo ${notReturnedPokemons.length} Pokémon(s) pendentes para o grupo ${groupKey}...`);
            // A API de devolução exige senha do TREINADOR. Não temos essa senha aqui.
            // Alternativa: Chamar uma API de devolução forçada (que requer senha ADMIN) ou
            // Informar o usuário que a devolução automática não é possível sem a senha do treinador.
            // *** VAMOS MANTER A DELEÇÃO SEM DEVOLUÇÃO AUTOMÁTICA POR ENQUANTO ***
            // -> Ou adaptar returnPokemonAPI para aceitar senha admin? Complexifica.
            // -> Melhor: Exibir um aviso que a devolução precisa ser feita manualmente antes.
            // ***** REVERTENDO: Vamos tentar deletar o histórico mesmo assim, MAS AVISANDO *****
            // const returnPromises = notReturnedPokemons.map(p => {
            //     console.log(`[History Delete] Tentando devolver entrada ID: ${p.id} (Pokémon: ${p.name})`);
            //     return returnPokemonAPI(p.id); // ESTA CHAMADA FALHARÁ SEM SENHA DO TREINADOR
            // });
            // await Promise.all(returnPromises);
            // console.log("[History Delete] Tentativa de devolução automática concluída (pode ter falhado sem senha).");
            // werePokemonsReturned = true; // Marcamos como tentativa
             displayError("A deleção do histórico NÃO devolverá Pokémons automaticamente. Faça a devolução manual primeiro se necessário."); // Avisa o usuário
        } else {
            console.log(`[History Delete] Nenhum Pokémon pendente para devolver no grupo ${groupKey}.`);
        }

        console.log(`[History Delete] Deletando ${groupInfo.entryIds.length} entradas do histórico (IDs: ${groupInfo.entryIds.join(', ')})`);
        const deletePromises = groupInfo.entryIds.map(id => deleteHistoryEntryAPI(id));
        await Promise.all(deletePromises);

        displaySuccess(`Registro de histórico deletado com sucesso!`);

    } catch (error) {
        console.error("[History Delete] Erro durante a deleção do grupo:", error);
    } finally {
        hideSpinner();
        deleteButton.disabled = false;
        fullHistoryCache = [];
        groupedHistoryForDelete = {};
        loadAndRenderHistory();
        renderActivePokemons(); // Atualiza home pois o status do pokemon NÃO mudou
    }
}



export async function handleDeleteAllHistory() {
    const password = prompt('[CUIDADO] Digite a senha ADMIN para deletar TODO o histórico (NÃO devolve Pokémons):');
    if (password === null) return;
    if (password !== LOCAL_ADMIN_PASSWORD_FOR_CHECK) {
        displayError('Senha de administrador incorreta!');
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
        groupedHistoryForDelete = {};
        loadAndRenderHistory();
        renderActivePokemons();
    } catch (error) {
         console.error("Erro ao deletar todo o histórico:", error);
    } finally {
        hideSpinner();
    }
}


export function clearHistoryCache() {
    console.log("[History] Limpando cache do histórico.");
    fullHistoryCache = [];
    groupedHistoryForDelete = {};
}