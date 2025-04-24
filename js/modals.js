// TODOLISTPOKEMON/js/modals.js
/**
 * Gerencia a lógica específica para os diferentes modais da aplicação:
 * - Adicionar Pokémon: Abre/fecha, carrega clãs no select, trata submissão do form.
 * - Adicionar Treinador: Abre/fecha, trata submissão do form.
 * - Gerenciar Treinadores: Abre/fecha, busca e lista treinadores, trata deleção.
 * - Devolução Parcial: Abre/fecha, lista pokémons agrupados por clã, trata seleção por history.id, senha e confirmação. <<< MODIFICADO: Seleção por history.id >>>
 * - Listas Favoritas (Criar/Editar/Usar): Abre/fecha, busca pokémons, lida com busca interna, seleção, senhas e submissões.
 * renderPokemonSelectionList agora lê a seleção do estado global 'modalPokemonSelection'. handleCreate/EditListPokemonSearch não precisam mais ler seleção do DOM. handleCreate/EditListSubmit lêem seleção do estado global. Funções de abrir modais limpam/populam o estado 'modalPokemonSelection'.
 */
import { dom } from './domElements.js';
import { clanData } from './config.js';
import {
    addPokemonAPI, fetchActiveHistory, fetchAllHistory, // <<< fetchAllHistory usado em openPartialReturnModal
    addTrainerAPI, fetchTrainersAPI, deleteTrainerAPI,
    returnMultiplePokemonAPI,
    fetchAllPokemonsByClanAPI, createFavoriteList, fetchListDetails,
    updateFavoriteList, deleteFavoriteList, borrowFavoriteList
} from './api.js';
import { displayError, displaySuccess, showSpinner, hideSpinner } from './ui.js';
import { getState, setActiveHistoryGroupIndex, setPartialReturnSelection, togglePartialReturnSelection, clearPartialReturnSelection, clearModalPokemonSelection, setModalPokemonSelection } from './state.js';
import { renderActivePokemons } from './homeView.js';
import { loadClanView } from './clanView.js';
import { loadFavoritesView } from './favoriteView.js';


const LOCAL_ADMIN_PASSWORD_FOR_CHECK = 'russelgay24';


let allClanPokemonsCache = null; // Cache para modais de lista


export function openAddPokemonModal() {
    loadClansInModalSelect();
    if (dom.addPokemonModal) dom.addPokemonModal.style.display = 'flex';
    if(dom.addPokemonForm) dom.addPokemonForm.reset();
    if(dom.newPokemonNameInput) dom.newPokemonNameInput.focus();
}
export function closeAddPokemonModal() {
    if(dom.addPokemonModal) dom.addPokemonModal.style.display = 'none';
    if(dom.addPokemonForm) dom.addPokemonForm.reset();
}
function loadClansInModalSelect() {
    if (!dom.clanSelectInput) return;
    dom.clanSelectInput.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = ''; defaultOption.textContent = 'Selecione um Clã...';
    defaultOption.disabled = true; defaultOption.selected = true;
    dom.clanSelectInput.appendChild(defaultOption);
    Object.keys(clanData).sort().forEach(clanKey => {
        const option = document.createElement('option');
        option.value = clanKey;
        option.textContent = clanKey.charAt(0).toUpperCase() + clanKey.slice(1);
        dom.clanSelectInput.appendChild(option);
    });
}
export async function handleAddPokemonFormSubmit(event) {
    event.preventDefault();
    if(!dom.addPokemonForm || !dom.newPokemonNameInput || !dom.clanSelectInput) {
        console.error("Elementos do form de adicionar pokemon não encontrados.");
        return;
    }
    const name = dom.newPokemonNameInput.value.trim();
    const item = dom.newPokemonItemInput ? dom.newPokemonItemInput.value.trim() : '';
    const clan = dom.clanSelectInput.value;
    if (!name || !clan) {
        displayError('Nome do Pokémon e Clã são obrigatórios.');
        return;
    }
    const submitButton = dom.addPokemonForm.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    try {
        const result = await addPokemonAPI(clan, name, item);
        displaySuccess(result.message || `Pokémon "${name}" adicionado ao clã ${clan} com sucesso!`);
        closeAddPokemonModal();
        allClanPokemonsCache = null;
        if (getState().currentClan === clan) {
            loadClanView(clan);
        }
    } catch (error) {
        console.error("Erro ao adicionar Pokémon:", error);
    } finally {
        if(submitButton) submitButton.disabled = false;
    }
}
export function openAddTrainerModal() {
    if (dom.addTrainerModal) {
        dom.addTrainerModal.style.display = 'flex';
         if(dom.addTrainerForm) dom.addTrainerForm.reset();
        if(dom.newTrainerNameInput) dom.newTrainerNameInput.focus();
        closeManageTrainersModal();
    }
}
export function closeAddTrainerModal() {
     if (dom.addTrainerModal) {
        dom.addTrainerModal.style.display = 'none';
         if(dom.addTrainerForm) dom.addTrainerForm.reset();
    }
}
export async function handleAddTrainerFormSubmit(event) {
    event.preventDefault();
     if (!dom.addTrainerForm || !dom.newTrainerNameInput || !dom.newTrainerEmailInput || !dom.newTrainerPasswordInput || !dom.adminPasswordForTrainerInput) {
         console.error("Elementos do formulário de adicionar treinador não encontrados."); return;
     }
    const name = dom.newTrainerNameInput.value.trim();
    const email = dom.newTrainerEmailInput.value.trim();
    const password = dom.newTrainerPasswordInput.value.trim();
    const adminPassword = dom.adminPasswordForTrainerInput.value.trim();
    if (!name || !email || !password || !adminPassword) { displayError("Todos os campos são obrigatórios."); return; }
    const submitButton = dom.addTrainerForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
        const result = await addTrainerAPI(name, email, password, adminPassword);
        displaySuccess(result.message || `Treinador ${name} adicionado com sucesso!`);
        closeAddTrainerModal();
        openManageTrainersModal();
    } catch (error) {
        console.error("Erro ao adicionar treinador:", error);
        if (error.message && error.message.toLowerCase().includes('administrador incorreta')) {
            displayError('Senha de administrador inválida.'); if(dom.adminPasswordForTrainerInput) dom.adminPasswordForTrainerInput.focus();
        } else if (error.message && error.message.toLowerCase().includes('email já cadastrado')) {
             displayError('Este email já está em uso.'); if(dom.newTrainerEmailInput) dom.newTrainerEmailInput.focus();
        }
    } finally { if (submitButton) submitButton.disabled = false; }
}
export async function openManageTrainersModal() {
    if (!dom.manageTrainersModal || !dom.trainerListContainer) {
        console.error("Modal de Gerenciamento de Treinadores ou container da lista não encontrado."); return;
    }
    dom.trainerListContainer.innerHTML = '<p class="loading-message" style="margin:0; padding: 1rem;">Carregando treinadores...</p>';
    dom.manageTrainersModal.style.display = 'flex';
    try {
        const trainers = await fetchTrainersAPI();
        if (trainers && trainers.length > 0) {
            populateTrainerList(trainers);
        } else {
            dom.trainerListContainer.innerHTML = '<p class="empty-message" style="margin:0; padding: 1rem;">Nenhum treinador cadastrado.</p>';
        }
    } catch (error) {
        dom.trainerListContainer.innerHTML = `<p class="error-message" style="margin: 0; padding: 1rem;">Erro ao carregar treinadores.</p>`;
    }
}
export function closeManageTrainersModal() {
    if (dom.manageTrainersModal) dom.manageTrainersModal.style.display = 'none';
    if (dom.trainerListContainer) dom.trainerListContainer.innerHTML = '';
}
function populateTrainerList(trainers) {
    if (!dom.trainerListContainer) return;
    dom.trainerListContainer.innerHTML = '';
    trainers.forEach(trainer => {
        const item = document.createElement('div');
        item.className = 'trainer-list-item';
        item.dataset.trainerId = trainer.id;
        const infoDiv = document.createElement('div');
        infoDiv.className = 'trainer-info';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'trainer-name'; nameSpan.textContent = trainer.name;
        infoDiv.appendChild(nameSpan);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button small-delete-button';
        deleteButton.dataset.trainerId = trainer.id;
        deleteButton.dataset.trainerName = trainer.name;
        deleteButton.setAttribute('aria-label', `Deletar Treinador ${trainer.name}`);
        deleteButton.title = `Deletar ${trainer.name}`;
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        item.appendChild(infoDiv);
        item.appendChild(deleteButton);
        dom.trainerListContainer.appendChild(item);
    });
}
export async function handleDeleteTrainer(button) {
    const trainerId = button.dataset.trainerId;
    const trainerName = button.dataset.trainerName || `ID ${trainerId}`;
    if (!trainerId) { displayError("ID do treinador não encontrado."); return; }
    const password = prompt(`[ADMIN] Digite a senha para deletar PERMANENTEMENTE o treinador "${trainerName}" e todo o seu histórico associado:`);
    if (password === null) return;
    if (password !== LOCAL_ADMIN_PASSWORD_FOR_CHECK) {
        displayError('Senha de administrador incorreta!');
        return;
    }
    if (!confirm(`Tem CERTEZA que deseja deletar o treinador "${trainerName}"?\n\nATENÇÃO: Todo o histórico de empréstimos deste treinador será PERMANENTEMENTE DELETADO.\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    showSpinner();
    try {
        await deleteTrainerAPI(trainerId, password);
        hideSpinner();
        displaySuccess(`Treinador "${trainerName}" deletado com sucesso!`);
        const listItem = button.closest('.trainer-list-item');
        if (listItem) listItem.remove();
        else openManageTrainersModal();
        if (dom.trainerListContainer && dom.trainerListContainer.children.length === 0) {
             dom.trainerListContainer.innerHTML = '<p class="empty-message" style="margin:0; padding: 1rem;">Nenhum treinador cadastrado.</p>';
        }
    } catch (error) {
        hideSpinner();
        console.error(`Erro ao deletar treinador ${trainerId}:`, error);
        displayError(error.message || "Erro ao deletar treinador.");
    }
}


// <<< MODIFICADO: Busca histórico completo e renderiza itens com history.id >>>
export async function openPartialReturnModal(groupIndex) {
    setActiveHistoryGroupIndex(groupIndex);
    clearPartialReturnSelection();
    const passwordInput = document.getElementById('partialReturnPassword');
    const selectAllCheckbox = document.getElementById('selectAllPartialReturn');
    const listContainer = dom.partialReturnListContainer;

    if (passwordInput) passwordInput.value = '';
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    if (!listContainer || !dom.partialReturnModal) {
        console.error("Elementos do modal de devolução parcial não encontrados.");
        return;
    }

    listContainer.innerHTML = '<p class="loading-message">Carregando Pokémons...</p>';
    dom.partialReturnModal.style.display = 'flex';

    try {
        // Busca ambos: grupos ativos para pegar trainer/date e histórico completo para pegar IDs
        const [activeGroups, fullHistory] = await Promise.all([fetchActiveHistory(), fetchAllHistory()]);

        const targetGroup = activeGroups[groupIndex];

        if (!targetGroup || !targetGroup.trainer_name || !targetGroup.date) {
            displayError("Grupo de empréstimo ativo não encontrado ou inválido.");
            closePartialReturnModal(); return;
        }

        // Filtra o histórico completo para encontrar as entradas EXATAS deste grupo ativo
        const historyEntriesForGroup = fullHistory.filter(entry =>
            !entry.returned && // Apenas os não devolvidos deste grupo
            entry.trainer_id === targetGroup.trainer_id &&
            entry.date === targetGroup.date
        );

        listContainer.innerHTML = '';

        if (historyEntriesForGroup.length === 0) {
            listContainer.innerHTML = '<p class="empty-message">Nenhum Pokémon pendente neste grupo.</p>';
            if (selectAllCheckbox) selectAllCheckbox.disabled = true;
        } else {
            if (selectAllCheckbox) selectAllCheckbox.disabled = false;

            // Agrupa por clã (opcional, mas mantém a UI)
            const pokemonsByClan = historyEntriesForGroup.reduce((acc, entry) => {
                 const clanName = entry?.clan_name || 'unknown';
                 if (!acc[clanName]) {
                     acc[clanName] = [];
                 }
                 // Guarda o objeto entry inteiro para ter acesso ao ID e nome
                 acc[clanName].push(entry);
                 return acc;
            }, {});

             const sortedClans = Object.keys(pokemonsByClan).sort((a, b) => {
                 if (a === 'unknown') return 1; if (b === 'unknown') return -1;
                 return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
             });

             sortedClans.forEach(clanName => {
                 const clanHeader = document.createElement('div');
                 clanHeader.className = 'partial-return-clan-header';
                 clanHeader.textContent = clanName === 'unknown' ? 'Clã Desconhecido' : (clanName.charAt(0).toUpperCase() + clanName.slice(1));
                 const color = clanData[clanName]?.color || 'var(--text-medium)';
                 clanHeader.style.color = color;
                 listContainer.appendChild(clanHeader);

                 pokemonsByClan[clanName].forEach(historyEntry => {
                     if(!historyEntry || !historyEntry.id || !historyEntry.pokemon_name) {
                         console.warn("Entrada de histórico inválida encontrada:", historyEntry); return;
                     }
                     const item = document.createElement('div');
                     item.className = 'partial-return-item';
                     item.dataset.historyId = historyEntry.id; // <<< USA history.id

                     const nameDiv = document.createElement('div');
                     nameDiv.className = 'pokemon-name';
                     nameDiv.textContent = historyEntry.pokemon_name; // <<< Usa o nome do histórico

                     const checkbox = document.createElement('input');
                     checkbox.type = 'checkbox';
                     checkbox.className = 'partial-return-checkbox';
                     checkbox.dataset.action = 'toggle-partial-return';
                     checkbox.dataset.historyId = historyEntry.id; // <<< USA history.id

                     item.appendChild(nameDiv);
                     item.appendChild(checkbox);
                     listContainer.appendChild(item);
                 });
             });
        }

        if (passwordInput) passwordInput.focus();

    } catch (error) {
        console.error("Erro ao abrir modal de devolução parcial:", error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar Pokémons.</p>';
        if (selectAllCheckbox) selectAllCheckbox.disabled = true;
    }
}
export function closePartialReturnModal() {
    if(dom.partialReturnModal) dom.partialReturnModal.style.display = 'none';
    if(dom.partialReturnListContainer) dom.partialReturnListContainer.innerHTML = '';
    setActiveHistoryGroupIndex(null);
    clearPartialReturnSelection(); // Limpa a seleção (que agora é de IDs)
    const passwordInput = document.getElementById('partialReturnPassword');
    if (passwordInput) passwordInput.value = '';
}
// <<< MODIFICADO: Usa historyId >>>
export function handleTogglePartialReturn(checkbox) {
    const historyId = checkbox.dataset.historyId; // <<< Pega historyId
    const itemDiv = checkbox.closest('.partial-return-item');
    if (!historyId || !itemDiv) return;

    togglePartialReturnSelection(historyId); // <<< Passa historyId para o estado
    itemDiv.classList.toggle('selected', checkbox.checked);

    const allCheckboxes = dom.partialReturnListContainer?.querySelectorAll('.partial-return-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllPartialReturn');

    if (!selectAllCheckbox || !allCheckboxes || allCheckboxes.length === 0) return;

    const totalItems = allCheckboxes.length;
    const checkedItems = Array.from(allCheckboxes).filter(cb => cb.checked).length;

    if (checkedItems === totalItems) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedItems === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}
// <<< MODIFICADO: Usa historyId >>>
export function handleSelectAllPartialReturn() {
    const selectAllCheckbox = document.getElementById('selectAllPartialReturn');
    const allCheckboxes = dom.partialReturnListContainer?.querySelectorAll('.partial-return-checkbox');

    if (!selectAllCheckbox || !allCheckboxes || allCheckboxes.length === 0) {
        console.warn("Checkbox 'Select All' ou lista de pokémons não encontrada.");
        return;
    }

    const shouldBeChecked = selectAllCheckbox.checked;
    let newSelectionState = {};

    allCheckboxes.forEach(checkbox => {
        const historyId = checkbox.dataset.historyId; // <<< Pega historyId
        const itemDiv = checkbox.closest('.partial-return-item');

        checkbox.checked = shouldBeChecked;
        if (itemDiv) {
             itemDiv.classList.toggle('selected', shouldBeChecked);
        }

        if (shouldBeChecked && historyId) {
            newSelectionState[historyId] = true; // <<< Guarda historyId
        }
    });

    setPartialReturnSelection(newSelectionState); // <<< Atualiza estado com historyIds
    selectAllCheckbox.indeterminate = false;
    // O log no state.js já foi adaptado
}
// <<< MODIFICADO: Lê seleção de IDs do estado, remove validação de discrepância >>>
export async function handleConfirmPartialReturn() {
    // <<< Lê a seleção de History IDs diretamente do estado >>>
    const historyEntryIdsToReturn = Object.keys(getState().partialReturnSelection);
    const passwordInput = document.getElementById('partialReturnPassword');
    const trainerPassword = passwordInput ? passwordInput.value : '';

    if (historyEntryIdsToReturn.length === 0) { displayError('Selecione pelo menos um Pokémon para devolver.'); return; }
    if (!trainerPassword) { displayError('Por favor, digite sua senha de treinador para confirmar a devolução.'); if(passwordInput) passwordInput.focus(); return; }

    // Não precisamos mais do groupIndex aqui, mas mantemos caso precise no futuro
    const groupIndex = getState().activeHistoryGroupIndex;
    if (groupIndex === null) { displayError("Erro interno: Grupo de histórico não identificado."); return; }

    const confirmButton = dom.confirmPartialReturnButton;
    if (confirmButton) confirmButton.disabled = true;
    showSpinner();

    try {
        // <<< REMOVIDO: Busca de fullHistory e activeGroups aqui >>>
        // <<< REMOVIDO: Lógica de filtragem para encontrar IDs (já temos os IDs selecionados) >>>
        // <<< REMOVIDO: Verificação de discrepância (historyEntryIdsToReturn.length !== pokemonsToReturnNames.length) >>>

        if (historyEntryIdsToReturn.length === 0) {
             // Este caso não deve ocorrer devido à checagem inicial, mas mantido por segurança
             hideSpinner(); displayError('Não foi possível encontrar os registros correspondentes para devolução.');
             closePartialReturnModal();
             renderActivePokemons();
              if (confirmButton) confirmButton.disabled = false;
             return;
        }

        console.log(`[Partial Return] IDs de histórico a devolver: ${historyEntryIdsToReturn.join(', ')}`);

        // <<< Envia os IDs de histórico selecionados diretamente >>>
        const result = await returnMultiplePokemonAPI(historyEntryIdsToReturn, trainerPassword);
        hideSpinner();

        displaySuccess(result.message || `${historyEntryIdsToReturn.length} Pokémon(s) devolvido(s) com sucesso!`);
        closePartialReturnModal();

    } catch (error) {
        hideSpinner();
        console.error("Erro ao confirmar devolução parcial:", error);
        if (error.message && error.message.toLowerCase().includes('senha do treinador inválida')) {
            displayError('Senha do treinador inválida. Nenhum Pokémon foi devolvido.');
            if(passwordInput) passwordInput.focus();
        } else {
            // Exibe outros erros da API (ex: "Nenhum registro válido...")
            displayError(error.message || "Ocorreu um erro inesperado durante a devolução.");
        }
    } finally {
         // Sempre atualiza as visualizações
         renderActivePokemons();
         const currentViewClan = getState().currentClan;
         if (currentViewClan !== 'home' && currentViewClan !== 'favorites') {
              loadClanView(currentViewClan);
         }
         if (confirmButton) confirmButton.disabled = false;
    }
}


// --- Funções de Listas Favoritas (sem alterações nesta seção) ---
async function loadAllClanPokemonsForModal() {
    if (allClanPokemonsCache) {
        return allClanPokemonsCache;
    }
    try {
        console.log("Buscando todos os pokemons para cache do modal...");
        allClanPokemonsCache = await fetchAllPokemonsByClanAPI();
        console.log("Cache de pokemons do modal preenchido:", allClanPokemonsCache ? Object.keys(allClanPokemonsCache).length + " clãs" : "Falhou");
        return allClanPokemonsCache;
    } catch (error) {
        console.error("Erro ao buscar todos os Pokémons por clã para o modal:", error);
        allClanPokemonsCache = null;
        throw error;
    }
}
function renderPokemonSelectionList(container, allClanPokemons, searchString = '') {
    if (!container) { console.error("Container de seleção não fornecido."); return; }
    container.innerHTML = '';
    const lowerSearch = searchString.toLowerCase().trim();
    let countRendered = 0;
    const currentModalSelection = getState().modalPokemonSelection;

    console.log(`Renderizando lista para modal. Busca: "${lowerSearch}". Seleção global modal:`, currentModalSelection);

    Object.entries(allClanPokemons).forEach(([clanName, pokemons]) => {
        const filteredPokemons = pokemons.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.held_item && p.held_item.toLowerCase().includes(lowerSearch))
        );

        if (filteredPokemons.length > 0) {
            const clanGroupDiv = document.createElement('div');
            clanGroupDiv.className = 'modal-clan-group';

            const clanHeader = document.createElement('h4');
            clanHeader.className = 'modal-pokemon-clan-header';
            clanHeader.textContent = clanName;
            clanGroupDiv.appendChild(clanHeader);

            filteredPokemons.forEach(pokemon => {
                countRendered++;
                const isSelected = currentModalSelection[pokemon.id];
                const isAvailable = pokemon.status === 'available';

                const item = document.createElement('div');
                item.className = `modal-pokemon-item ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`;
                item.dataset.pokemonId = pokemon.id;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !!isSelected;
                checkbox.id = `modal-poke-${pokemon.id}`;
                checkbox.dataset.pokemonId = pokemon.id;

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                const statusTag = !isAvailable ? '<span class="modal-pokemon-status-tag">(Em uso)</span>' : '';
                label.innerHTML = `${pokemon.name} ${pokemon.held_item ? `(${pokemon.held_item})` : ''} ${statusTag}`;

                item.appendChild(checkbox);
                item.appendChild(label);
                clanGroupDiv.appendChild(item);
            });

            container.appendChild(clanGroupDiv);
        }
    });

    if (countRendered === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum Pokémon encontrado.</p>';
    }
}
export async function openCreateListModal() {
    if (!dom.createListModal || !dom.createListForm || !dom.createListPokemonSelection || !dom.newListNameInput || !dom.createListPokemonSearch) {
        console.error("Elementos do modal de criar lista não encontrados."); return;
    }
    clearModalPokemonSelection();
    dom.createListForm.reset();
    dom.createListPokemonSelection.innerHTML = '<p class="loading-message">Carregando Pokémons...</p>';
    dom.createListModal.style.display = 'flex';
    dom.newListNameInput.focus();

    try {
        const pokemons = await loadAllClanPokemonsForModal();
        renderPokemonSelectionList(dom.createListPokemonSelection, pokemons);
    } catch (error) {
        dom.createListPokemonSelection.innerHTML = '<p class="error-message">Erro ao carregar Pokémons.</p>';
    }
}
export function closeCreateListModal() {
    if (dom.createListModal) dom.createListModal.style.display = 'none';
    clearModalPokemonSelection();
}
export function handleCreateListPokemonSearch() {
    if (!dom.createListPokemonSearch || !dom.createListPokemonSelection || !allClanPokemonsCache) return;
    const searchTerm = dom.createListPokemonSearch.value;
    renderPokemonSelectionList(dom.createListPokemonSelection, allClanPokemonsCache, searchTerm);
}
export async function handleCreateListSubmit(event) {
    event.preventDefault();
    if (!dom.newListNameInput || !dom.confirmCreateListButton || !document.getElementById('createListTrainerPassword')) return;

    const listName = dom.newListNameInput.value.trim();
    const selectedPokemonIds = Object.keys(getState().modalPokemonSelection);
    const trainerPassword = document.getElementById('createListTrainerPassword').value;

    if (!listName) { displayError("O nome da lista é obrigatório."); dom.newListNameInput.focus(); return; }
    if (selectedPokemonIds.length === 0) { displayError("Selecione pelo menos um Pokémon para a lista."); return; }
    if (!trainerPassword) { displayError("A senha do treinador é obrigatória para criar a lista."); document.getElementById('createListTrainerPassword').focus(); return; }

    dom.confirmCreateListButton.disabled = true;
    showSpinner();

    try {
        const result = await createFavoriteList(listName, selectedPokemonIds, trainerPassword);
        hideSpinner();
        displaySuccess(result.message || `Lista "${listName}" criada com sucesso!`);
        closeCreateListModal();
        loadFavoritesView();
    } catch (error) {
        hideSpinner();
        console.error("Erro ao criar lista favorita:", error);
    } finally {
        if (dom.confirmCreateListButton) dom.confirmCreateListButton.disabled = false;
    }
}
export async function openViewEditListModal(listId) {
     if (!dom.viewEditListModal || !dom.editListForm || !dom.editListIdInput || !dom.editListNameInput || !dom.editListPokemonSelection || !dom.editListPokemonSearch || !document.getElementById('editListTrainerPassword')) {
        console.error("Elementos do modal de editar lista não encontrados."); return;
    }
    clearModalPokemonSelection();
    dom.editListForm.reset();
    dom.editListPokemonSearch.value = '';
    dom.editListPokemonSelection.innerHTML = '<p class="loading-message">Carregando detalhes da lista...</p>';
    dom.viewEditListModal.style.display = 'flex';

    try {
        showSpinner();
        const listDetails = await fetchListDetails(listId);
        const allPokemons = await loadAllClanPokemonsForModal();
        hideSpinner();

        dom.editListIdInput.value = listDetails.id;
        dom.editListNameInput.value = listDetails.name;
        document.getElementById('editListTrainerPassword').value = '';

        const initialSelection = {};
        listDetails.pokemons.forEach(p => { initialSelection[p.id] = true; });
        setModalPokemonSelection(initialSelection);

        renderPokemonSelectionList(dom.editListPokemonSelection, allPokemons);

        dom.editListNameInput.focus();

    } catch (error) {
        hideSpinner();
        console.error(`Erro ao carregar detalhes/pokémons para editar lista ${listId}:`, error);
        closeViewEditListModal();
    }
}
export function closeViewEditListModal() {
     if (dom.viewEditListModal) dom.viewEditListModal.style.display = 'none';
     clearModalPokemonSelection();
}
export function handleEditListPokemonSearch() {
    if (!dom.editListPokemonSearch || !dom.editListPokemonSelection || !allClanPokemonsCache) return;
    const searchTerm = dom.editListPokemonSearch.value;
    renderPokemonSelectionList(dom.editListPokemonSelection, allClanPokemonsCache, searchTerm);
}
export async function handleUpdateListSubmit(event) {
    event.preventDefault();
    if (!dom.editListIdInput || !dom.editListNameInput || !dom.confirmEditListButton || !document.getElementById('editListTrainerPassword')) return;

    const listId = dom.editListIdInput.value;
    const newName = dom.editListNameInput.value.trim();
    const newPokemonIds = Object.keys(getState().modalPokemonSelection);
    const trainerPassword = document.getElementById('editListTrainerPassword').value;

    if (!newName) { displayError("O nome da lista é obrigatório."); dom.editListNameInput.focus(); return; }
    if (!trainerPassword) { displayError("A senha do treinador é obrigatória para editar a lista."); document.getElementById('editListTrainerPassword').focus(); return; }

    dom.confirmEditListButton.disabled = true;
    showSpinner();

    try {
        const result = await updateFavoriteList(listId, { name: newName, pokemonIds: newPokemonIds }, trainerPassword);
        hideSpinner();
        displaySuccess(result.message || `Lista "${newName}" atualizada com sucesso!`);
        closeViewEditListModal();
        loadFavoritesView();
    } catch (error) {
        hideSpinner();
        console.error(`Erro ao atualizar lista ${listId}:`, error);
    } finally {
        if (dom.confirmEditListButton) dom.confirmEditListButton.disabled = false;
    }
}
export async function openBorrowListModal(listId, listName) {
    if (!dom.borrowListModal || !dom.borrowListModalTitle || !dom.borrowListIdInput || !dom.borrowListPokemonsPreview || !dom.borrowListTrainerPasswordInput || !dom.borrowListCommentInput) {
        console.error("Elementos do modal de usar lista não encontrados."); return;
    }
    dom.borrowListModalTitle.textContent = `Usar Lista: ${listName}`;
    dom.borrowListIdInput.value = listId;
    dom.borrowListTrainerPasswordInput.value = '';
    dom.borrowListCommentInput.value = '';
    dom.borrowListPokemonsPreview.innerHTML = '<li class="loading-message">Carregando detalhes da lista...</li>';
    dom.borrowListModal.style.display = 'flex';

    try {
        const listDetails = await fetchListDetails(listId);
        dom.borrowListPokemonsPreview.innerHTML = '';

        if (!listDetails.pokemons || listDetails.pokemons.length === 0) {
             dom.borrowListPokemonsPreview.innerHTML = '<li class="empty-message">Esta lista está vazia.</li>';
             if(dom.confirmBorrowListButton) dom.confirmBorrowListButton.disabled = true;
             return;
        }

        listDetails.pokemons.forEach(pokemon => {
            const li = document.createElement('li');
            li.className = pokemon.status === 'available' ? 'available' : 'unavailable';
            li.textContent = pokemon.name + (pokemon.held_item ? ` (${pokemon.held_item})` : '');
            li.title = pokemon.status === 'available' ? 'Disponível' : 'Indisponível';
            dom.borrowListPokemonsPreview.appendChild(li);
        });

        const anyAvailable = listDetails.pokemons.some(p => p.status === 'available');
        if (!anyAvailable) {
             dom.borrowListPokemonsPreview.insertAdjacentHTML('beforeend', '<li class="warning-message">Nenhum Pokémon desta lista está disponível no momento.</li>');
        }
         if(dom.confirmBorrowListButton) dom.confirmBorrowListButton.disabled = !anyAvailable;

        dom.borrowListTrainerPasswordInput.focus();

    } catch (error) {
        console.error(`Erro ao carregar detalhes da lista ${listId} para empréstimo:`, error);
        dom.borrowListPokemonsPreview.innerHTML = '<li class="error-message">Erro ao carregar Pokémons da lista.</li>';
        if(dom.confirmBorrowListButton) dom.confirmBorrowListButton.disabled = true;
    }
}
export function closeBorrowListModal() {
    if (dom.borrowListModal) dom.borrowListModal.style.display = 'none';
}
export async function handleConfirmBorrowList() {
    if (!dom.borrowListIdInput || !dom.borrowListTrainerPasswordInput || !dom.borrowListCommentInput || !dom.confirmBorrowListButton) return;

    const listId = dom.borrowListIdInput.value;
    const trainerPassword = dom.borrowListTrainerPasswordInput.value.trim();
    const comment = dom.borrowListCommentInput.value.trim();

    if (!trainerPassword) { displayError("Digite sua senha de treinador."); dom.borrowListTrainerPasswordInput.focus(); return; }

    dom.confirmBorrowListButton.disabled = true;
    showSpinner();

    try {
        const result = await borrowFavoriteList(listId, trainerPassword, comment);
        hideSpinner();
        displaySuccess(result.message || `Pokémons da lista emprestados com sucesso!`);
        closeBorrowListModal();
        renderActivePokemons();
         const currentViewClan = getState().currentClan;
         if (currentViewClan !== 'home' && currentViewClan !== 'favorites') {
              loadClanView(currentViewClan);
         }
         allClanPokemonsCache = null;

    } catch (error) {
        hideSpinner();
        console.error(`Erro ao emprestar lista ${listId}:`, error);
        if (error.message && error.message.toLowerCase().includes('senha do treinador inválida')) {
            displayError('Senha do treinador inválida.');
            if (dom.borrowListTrainerPasswordInput) dom.borrowListTrainerPasswordInput.focus();
        } else if (error.message && error.message.toLowerCase().includes('disponível')) {
            displayError(error.message);
            const listNameElem = dom.borrowListModalTitle;
            const listName = listNameElem ? listNameElem.textContent.replace('Usar Lista: ', '') : 'esta lista';

            await openBorrowListModal(listId, listName);
        } else {
             displayError(error.message || "Ocorreu um erro ao tentar usar a lista.");
        }
    } finally {
        if (dom.borrowListModal.style.display === 'flex' && dom.confirmBorrowListButton) {
             dom.confirmBorrowListButton.disabled = false;
        }
    }
}
export async function handleDeleteListClick(listId, listName) {
     if (!listId) return;

     const password = prompt(`Digite sua senha de Treinador para deletar a lista "${listName}".\n(Ou digite a senha de Admin para forçar a deleção)`);

     if (password === null) return;
     if (!password) { displayError("Senha é obrigatória para deletar."); return; }

     const isPotentiallyAdmin = password === LOCAL_ADMIN_PASSWORD_FOR_CHECK;

     const confirmMessage = isPotentiallyAdmin
         ? `ADMIN: Tem certeza que deseja deletar PERMANENTEMENTE a lista "${listName}"?`
         : `Tem certeza que deseja deletar PERMANENTEMENTE a lista "${listName}"?`;

     if (!confirm(confirmMessage)) {
         return;
     }

     showSpinner();
     try {
         let credentials = {};
         if (isPotentiallyAdmin) {
             credentials.admin_password = password;
         } else {
             credentials.trainer_password = password;
         }
         await deleteFavoriteList(listId, credentials);
         hideSpinner();
         displaySuccess(`Lista "${listName}" deletada com sucesso!`);
         loadFavoritesView();
     } catch (error) {
         hideSpinner();
         console.error(`Erro ao deletar lista ${listId}:`, error);
     }
}