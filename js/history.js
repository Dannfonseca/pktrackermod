// TODOLISTPOKEMON/js/history.js
/**
 * Gerencia a lógica do modal de Histórico de Empréstimos.
 * Responsável por abrir/fechar o modal, buscar os dados do histórico completo
 * via API, filtrar e renderizar as entradas agrupadas por treinador/data,
 * exibir o comentário da transação e o item do pokémon.
 * Implementa paginação para exibir os registros.
 * <<< MODIFICADO: Adiciona paginação, renderiza controles, ajusta renderização para página atual. >>>
 *
 * Funções Principais:
 * - openHistoryModal / closeHistoryModal: Abre/fecha o modal, reseta página.
 * - loadAndRenderHistory: Busca dados da API e chama a renderização (agora da página 1).
 * - filterAndRenderHistory: Filtra o cache local, calcula páginas, renderiza a página atual e os controles.
 * - renderHistoryPaginationControls: Desenha os botões e informações de paginação.
 * - handleHistoryPrevPage / handleHistoryNextPage: Muda a página e re-renderiza.
 * - handleDeleteHistoryGroup: Deleta entradas de histórico associadas a um grupo.
 * - handleDeleteAllHistory: Deleta todo o histórico (requer senha admin).
 * - clearHistoryCache: Limpa o cache local do histórico.
 */
import { dom } from './domElements.js';
import { fetchAllHistory, deleteHistoryEntryAPI, deleteAllHistoryAPI } from './api.js';
import { displayError, displaySuccess, formatBrazilianDate, showSpinner, hideSpinner } from './ui.js';
import { clanData } from './config.js';
import { renderActivePokemons } from './homeView.js';
import { getState, setHistoryCurrentPage } from './state.js'; // <<< Importa getState e setHistoryCurrentPage

const LOCAL_ADMIN_PASSWORD_FOR_CHECK = 'russelgay24';
const HISTORY_ITEMS_PER_PAGE = 10; // <<< Define itens por página

let fullHistoryCache = [];
let groupedHistoryForDelete = {};
let totalHistoryPages = 1; // <<< Guarda o total de páginas calculado

export function openHistoryModal() {
    if (dom.historyModal) {
        dom.historyModal.style.display = 'flex';
        fullHistoryCache = [];
        groupedHistoryForDelete = {};
        if(dom.historySearchInput) dom.historySearchInput.value = '';
        if(dom.historyFilterSelect) dom.historyFilterSelect.value = 'all';
        setHistoryCurrentPage(1); // <<< Reseta para a página 1 ao abrir >>>
        loadAndRenderHistory();
    } else {
        console.error("Modal de Histórico não encontrado no DOM.");
    }
}

export function closeHistoryModal() {
    if (dom.historyModal) {
        dom.historyModal.style.display = 'none';
    }
    // Opcional: Limpar cache ao fechar para sempre buscar dados frescos?
    // clearHistoryCache();
}

async function loadAndRenderHistory() {
    if (!dom.historyListContainer) {
        console.error("Container 'historyListContainer' não encontrado no DOM.");
        return;
    }
    dom.historyListContainer.innerHTML = '';
    const paginationControls = document.getElementById('historyPaginationControls'); // <<< Pega container da paginação
    if (paginationControls) paginationControls.innerHTML = ''; // Limpa controles antigos
    showSpinner();
    try {
        console.log("[History] Buscando histórico completo da API...");
        fullHistoryCache = await fetchAllHistory() || [];
        hideSpinner();
        console.log(`[History] Histórico recebido: ${fullHistoryCache.length} entradas.`);
        filterAndRenderHistory(); // Renderiza a primeira página (estado já está em 1)
    } catch (error) {
        hideSpinner();
        console.error("[History] Erro ao carregar histórico:", error);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro ao carregar histórico. Tente novamente.</div>`;
    }
}

// <<< MODIFICADO: Renderiza apenas a página atual e os controles >>>
export function filterAndRenderHistory() {
    if (!dom.historyFilterSelect || !dom.historySearchInput || !dom.historyListContainer) {
        console.error("[History] Elementos de filtro/lista do histórico não encontrados.");
        return;
    }
    const filterValue = dom.historyFilterSelect.value;
    const searchValue = dom.historySearchInput.value.toLowerCase().trim();
    dom.historyListContainer.innerHTML = ''; // Limpa a lista
    groupedHistoryForDelete = {};

    if (!Array.isArray(fullHistoryCache)) {
        console.error("[History] Cache de histórico inválido:", fullHistoryCache);
        dom.historyListContainer.innerHTML = `<div class="error-message">Erro interno ao processar histórico.</div>`;
        renderHistoryPaginationControls(1, 1); // Mostra paginação vazia/inicial
        return;
    }

    console.log(`[History] Filtrando: Status='${filterValue}', Busca='${searchValue}'`);

    // 1. Agrupar
    const groupedHistory = {};
    fullHistoryCache.forEach((entry, entryIndex) => {
        if (!entry || typeof entry !== 'object' || !entry.trainer_name || !entry.date || !entry.pokemon_name) {
            console.warn(`[History] Entrada inválida ignorada (índice ${entryIndex}):`, entry);
            return;
        }
        const key = `${entry.trainer_name}-${entry.date}`;
        if (!groupedHistory[key]) {
            groupedHistory[key] = {
                trainer_id: entry.trainer_id, trainer_name: entry.trainer_name, date: entry.date,
                pokemons: [], allReturned: true, entryIds: [], comment: entry.comment || null
            };
        }
        groupedHistory[key].pokemons.push({
            id: entry.id, name: entry.pokemon_name, returned: !!entry.returned,
            returnDate: entry.returnDate || null, pokemonId: entry.pokemon,
            clan_name: entry.clan_name || 'unknown', held_item: entry.held_item || null
        });
        groupedHistory[key].entryIds.push(entry.id);
        if (!entry.returned) groupedHistory[key].allReturned = false;
    });
    groupedHistoryForDelete = { ...groupedHistory };

    // 2. Filtrar
    const filteredGroups = Object.values(groupedHistory)
        .filter(group => {
            if (filterValue === 'active' && group.allReturned) return false;
            if (filterValue === 'returned' && !group.allReturned) return false;
            if (searchValue) {
                const trainerMatch = group.trainer_name.toLowerCase().includes(searchValue);
                const pokemonMatch = group.pokemons.some(p =>
                    p?.name?.toLowerCase().includes(searchValue) ||
                    p?.held_item?.toLowerCase().includes(searchValue)
                );
                const commentMatch = group.comment && group.comment.toLowerCase().includes(searchValue);
                return trainerMatch || pokemonMatch || commentMatch;
            }
            return true;
        })
        // 3. Ordenar
        .sort((a, b) => {
             try {
                 const dateA = new Date(a.date); const dateB = new Date(b.date);
                 if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                 return dateB - dateA;
             } catch(e) { console.warn("[History] Erro ao ordenar datas:", a.date, b.date, e); return 0; }
         });

    // <<< LÓGICA DE PAGINAÇÃO >>>
    const totalItems = filteredGroups.length;
    totalHistoryPages = Math.ceil(totalItems / HISTORY_ITEMS_PER_PAGE) || 1; // Atualiza total de páginas (mínimo 1)
    const currentPage = getState().historyCurrentPage;
    // Ajusta currentPage se for maior que o total de páginas após filtrar
    const effectiveCurrentPage = Math.min(currentPage, totalHistoryPages);
     if (currentPage !== effectiveCurrentPage) {
        setHistoryCurrentPage(effectiveCurrentPage); // Corrige o estado se necessário
     }

    const startIndex = (effectiveCurrentPage - 1) * HISTORY_ITEMS_PER_PAGE;
    const endIndex = startIndex + HISTORY_ITEMS_PER_PAGE;
    const groupsToRender = filteredGroups.slice(startIndex, endIndex);
    console.log(`[History Pagination] Total: ${totalItems}, Páginas: ${totalHistoryPages}, Atual: ${effectiveCurrentPage}, Exibindo: ${startIndex + 1}-${Math.min(endIndex, totalItems)}`);
    // <<< FIM LÓGICA PAGINAÇÃO >>>

    // 4. Renderizar (apenas a página atual)
    if (groupsToRender.length === 0 && totalItems > 0) {
         // Isso não deve acontecer se effectiveCurrentPage for calculado corretamente, mas por segurança
         dom.historyListContainer.innerHTML = `<div class="empty-message">Nenhum registro nesta página.</div>`;
    } else if (totalItems === 0) {
        dom.historyListContainer.innerHTML = `<div class="empty-message">Nenhum registro encontrado para os filtros atuais.</div>`;
    } else {
        const createPokemonNameHTML = (pokemon) => {
            if (!pokemon || typeof pokemon !== 'object') return '<span style="color: red;">[Erro Dados]</span>';
            const clanKey = pokemon.clan_name || 'unknown';
            const clanConfig = clanData[clanKey];
            const clanColor = clanConfig?.color || '#cccccc';
            const clanNameTitle = (clanKey !== 'unknown' && clanConfig) ? (clanKey.charAt(0).toUpperCase() + clanKey.slice(1)) : 'Desconhecido';
            const clanTag = `<span class="pokemon-clan-tag" style="background-color: ${clanColor};" title="Clã: ${clanNameTitle}"></span>`;
            const safeName = (pokemon.name || 'Nome Inválido').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const itemText = pokemon.held_item ? ` (${pokemon.held_item.replace(/</g, "&lt;").replace(/>/g, "&gt;")})` : '';
            return `${clanTag}${safeName}${itemText}`;
        };

        groupsToRender.forEach(group => {
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
            deleteButton.title = 'Deletar este registro (requer senha admin, NÃO devolve Pokémons)';
            header.appendChild(trainerInfo); header.appendChild(dateInfo); header.appendChild(deleteButton);

            const pokemonsListDiv = document.createElement('div');
            pokemonsListDiv.className = 'history-pokemons';
            if (group.comment) {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'history-comment';
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
            item.appendChild(header); item.appendChild(pokemonsListDiv);
            dom.historyListContainer.appendChild(item);
        });
    }

    // <<< Renderiza os controles de paginação >>>
    renderHistoryPaginationControls(effectiveCurrentPage, totalHistoryPages);
    console.log(`[History] ${groupsToRender.length} grupos renderizados na página ${effectiveCurrentPage}.`);
}

// <<< NOVA FUNÇÃO: Renderiza controles de paginação >>>
function renderHistoryPaginationControls(currentPage, totalPages) {
    const container = document.getElementById('historyPaginationControls');
    if (!container) {
        console.error("Container de paginação do histórico não encontrado (#historyPaginationControls).");
        return;
    }
    container.innerHTML = ''; // Limpa controles antigos

    if (totalPages <= 1) {
        // Não mostra controles se só tem 1 página ou menos
        return;
    }

    // Botão Anterior
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.className = 'button pagination-button';
    prevButton.disabled = currentPage === 1;
    prevButton.dataset.action = 'history-prev';
    container.appendChild(prevButton);

    // Informação da Página
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    container.appendChild(pageInfo);

    // Botão Próximo
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.className = 'button pagination-button';
    nextButton.disabled = currentPage === totalPages;
    nextButton.dataset.action = 'history-next';
    container.appendChild(nextButton);
}

// <<< NOVA FUNÇÃO: Handler para botão Anterior >>>
export function handleHistoryPrevPage() {
    const currentPage = getState().historyCurrentPage;
    if (currentPage > 1) {
        setHistoryCurrentPage(currentPage - 1);
        filterAndRenderHistory(); // Re-renderiza a página anterior
    }
}

// <<< NOVA FUNÇÃO: Handler para botão Próximo >>>
export function handleHistoryNextPage() {
    const currentPage = getState().historyCurrentPage;
    // Re-calcula totalPages aqui ou assume que totalHistoryPages está atualizado
    // Para segurança, vamos pegar o total de grupos filtrados novamente
     const filterValue = dom.historyFilterSelect.value;
     const searchValue = dom.historySearchInput.value.toLowerCase().trim();
     const groupedHistory = {}; // Recalcula agrupamento (simplificado)
     fullHistoryCache.forEach(entry => {
         if (!entry || typeof entry !== 'object' || !entry.trainer_name || !entry.date || !entry.pokemon_name) return;
         const key = `${entry.trainer_name}-${entry.date}`;
         if (!groupedHistory[key]) groupedHistory[key] = { pokemons: [], allReturned: true };
         if (!entry.returned) groupedHistory[key].allReturned = false;
         groupedHistory[key].pokemons.push(entry); // Guarda entrada completa
     });
     const filteredGroups = Object.values(groupedHistory).filter(group => { // Recalcula filtro
         if (filterValue === 'active' && group.allReturned) return false;
         if (filterValue === 'returned' && !group.allReturned) return false;
         if (searchValue) {
             const trainerMatch = group.trainer_name?.toLowerCase().includes(searchValue);
             const pokemonMatch = group.pokemons.some(p => p.pokemon_name?.toLowerCase().includes(searchValue) || p.held_item?.toLowerCase().includes(searchValue));
             const commentMatch = group.comment?.toLowerCase().includes(searchValue);
             return trainerMatch || pokemonMatch || commentMatch;
         }
         return true;
     });
    const recalculateTotalPages = Math.ceil(filteredGroups.length / HISTORY_ITEMS_PER_PAGE) || 1;


    if (currentPage < recalculateTotalPages) {
        setHistoryCurrentPage(currentPage + 1);
        filterAndRenderHistory(); // Re-renderiza a próxima página
    }
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

    const notReturnedPokemons = groupInfo.pokemons.filter(p => !p.returned);
    let promptMessage = `Digite a senha ADMIN para DELETAR o histórico de ${trainerName} de ${formatBrazilianDate(dateISO)}:`;
    if (notReturnedPokemons.length > 0) {
         promptMessage = `ATENÇÃO: ${notReturnedPokemons.length} Pokémon(s) deste grupo ainda estão em uso e NÃO serão devolvidos automaticamente!\n` + promptMessage;
    }

    const password = prompt(promptMessage);
    if (password === null) return;

    if (password !== LOCAL_ADMIN_PASSWORD_FOR_CHECK) {
        displayError('Senha de administrador incorreta!');
        return;
    }

    if (!confirm(`Tem certeza que deseja DELETAR PERMANENTEMENTE este registro de histórico?\nTreinador: ${trainerName}\nData: ${formatBrazilianDate(dateISO)}\n\n${notReturnedPokemons.length > 0 ? 'Lembre-se: Pokémons em uso NÃO serão devolvidos.\n' : ''}Esta ação não pode ser desfeita.`)) {
        return;
    }

    const deleteButton = button;
    deleteButton.disabled = true;
    showSpinner();

    try {
        if (notReturnedPokemons.length > 0) {
             console.warn(`[History Delete] Deletando grupo ${groupKey} que contém ${notReturnedPokemons.length} Pokémon(s) ainda em uso. Eles NÃO serão devolvidos.`);
        }

        console.log(`[History Delete] Deletando ${groupInfo.entryIds.length} entradas do histórico (IDs: ${groupInfo.entryIds.join(', ')})`);
        const deletePromises = groupInfo.entryIds.map(id => deleteHistoryEntryAPI(id));
        await Promise.all(deletePromises);

        displaySuccess(`Registro de histórico deletado com sucesso!`);

    } catch (error) {
        console.error("[History Delete] Erro durante a deleção do grupo:", error);
        displayError(error.message || "Erro ao deletar o registro de histórico.");
    } finally {
        hideSpinner();
        deleteButton.disabled = false;
        // Recarrega o histórico (reseta para página 1 implicitamente)
        fullHistoryCache = [];
        groupedHistoryForDelete = {};
        setHistoryCurrentPage(1); // <<< Garante reset da página
        loadAndRenderHistory();
        renderActivePokemons();
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
        setHistoryCurrentPage(1); // <<< Garante reset da página
        loadAndRenderHistory(); // Renderiza a (agora vazia) página 1
        renderActivePokemons();
    } catch (error) {
         console.error("Erro ao deletar todo o histórico:", error);
         displayError(error.message || "Erro ao deletar histórico completo.");
    } finally {
        hideSpinner();
    }
}


export function clearHistoryCache() {
    console.log("[History] Limpando cache do histórico.");
    fullHistoryCache = [];
    groupedHistoryForDelete = {};
}