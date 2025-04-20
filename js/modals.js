// TODOLISTPOKEMON/js/modals.js
/**
 * Gerencia a lógica específica para os modais da aplicação:
 * ... (comentários anteriores) ...
 * - Devolução Parcial: Abre/fecha, lista pokémons, trata seleção, senha e confirmação
 * (agora usando endpoint único para devolução múltipla).
 */
import { dom } from './domElements.js';
import { clanData } from './config.js';
// <<< NOVO: Importa returnMultiplePokemonAPI e remove returnPokemonAPI daqui >>>
import {
    addPokemonAPI, fetchActiveHistory, fetchAllHistory,
    addTrainerAPI, fetchTrainersAPI, deleteTrainerAPI,
    returnMultiplePokemonAPI // Importa a nova função
} from './api.js';
import { displayError, displaySuccess, showSpinner, hideSpinner } from './ui.js';
import { getState, setActiveHistoryGroupIndex, setPartialReturnSelection, togglePartialReturnSelection, clearPartialReturnSelection } from './state.js';
import { renderActivePokemons } from './homeView.js';
import { loadClanView } from './clanView.js';

const LOCAL_ADMIN_PASSWORD_FOR_CHECK = 'raito123';


// --- Modal Adicionar Pokémon ---
// (Funções open/close/loadClans/handleAddPokemonFormSubmit permanecem as mesmas)
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
        if (getState().currentClan === clan) {
            loadClanView(clan);
        }
    } catch (error) {
        console.error("Erro ao adicionar Pokémon:", error);
    } finally {
        if(submitButton) submitButton.disabled = false;
    }
}

// --- Modal Adicionar Treinador (Formulário) ---
// (Funções open/close/handleAddTrainerFormSubmit permanecem as mesmas)
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


// --- Modal Gerenciar Treinadores (Lista) ---
// (Funções open/close/populate/handleDelete permanecem as mesmas)
export async function openManageTrainersModal() {
    if (!dom.manageTrainersModal || !dom.trainerListContainer) {
        console.error("Modal de Gerenciamento de Treinadores ou container da lista não encontrado."); return;
    }
    dom.trainerListContainer.innerHTML = '';
    dom.manageTrainersModal.style.display = 'flex';
    showSpinner();
    try {
        const trainers = await fetchTrainersAPI();
        hideSpinner();
        if (trainers && trainers.length > 0) {
            populateTrainerList(trainers);
        } else {
            console.log("Nenhum treinador encontrado.");
            dom.trainerListContainer.innerHTML = '';
        }
    } catch (error) {
        hideSpinner();
        dom.trainerListContainer.innerHTML = `<p class="error-message" style="margin: 0;">Erro ao carregar treinadores.</p>`;
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
        const emailSpan = document.createElement('span');
        emailSpan.className = 'trainer-email'; emailSpan.textContent = trainer.email;
        infoDiv.appendChild(nameSpan); infoDiv.appendChild(emailSpan);
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
             console.log("Lista de treinadores ficou vazia.");
        }
    } catch (error) {
        hideSpinner();
        console.error(`Erro ao deletar treinador ${trainerId}:`, error);
    }
}


// --- Modal Devolução Parcial (com validação de senha) ---
// (Funções open/close/handleToggle permanecem as mesmas)
export async function openPartialReturnModal(groupIndex) {
    setActiveHistoryGroupIndex(groupIndex);
    clearPartialReturnSelection();
    const passwordInput = document.getElementById('partialReturnPassword');
    if (passwordInput) passwordInput.value = '';
    if(!dom.partialReturnListContainer || !dom.partialReturnModal) return;
    showSpinner();
    try {
        const activeGroups = await fetchActiveHistory();
        hideSpinner();
        const group = activeGroups[groupIndex];
        if (!group || !group.pokemons || !Array.isArray(group.pokemons)) {
            displayError("Grupo de empréstimo não encontrado ou inválido.");
            closePartialReturnModal(); return;
        }
        dom.partialReturnListContainer.innerHTML = '';
        group.pokemons.forEach(pokemon => {
            const pokemonName = pokemon.name;
            if(!pokemonName) return;
            const item = document.createElement('div');
            item.className = 'partial-return-item'; item.dataset.pokemonName = pokemonName;
            const nameDiv = document.createElement('div');
            nameDiv.className = 'pokemon-name'; nameDiv.textContent = pokemonName;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox'; checkbox.className = 'partial-return-checkbox';
            checkbox.dataset.action = 'toggle-partial-return'; checkbox.dataset.pokemonName = pokemonName;
            item.appendChild(nameDiv); item.appendChild(checkbox);
            dom.partialReturnListContainer.appendChild(item);
        });
        dom.partialReturnModal.style.display = 'flex';
        if (passwordInput) passwordInput.focus();
    } catch (error) {
        hideSpinner(); console.error("Erro ao abrir modal de devolução parcial:", error);
        closePartialReturnModal();
    }
}
export function closePartialReturnModal() {
    if(dom.partialReturnModal) dom.partialReturnModal.style.display = 'none';
    if(dom.partialReturnListContainer) dom.partialReturnListContainer.innerHTML = '';
    setActiveHistoryGroupIndex(null);
    clearPartialReturnSelection();
    const passwordInput = document.getElementById('partialReturnPassword');
    if (passwordInput) passwordInput.value = '';
}
export function handleTogglePartialReturn(checkbox) {
    const pokemonName = checkbox.dataset.pokemonName;
    const itemDiv = checkbox.closest('.partial-return-item');
    if (pokemonName && itemDiv) {
        togglePartialReturnSelection(pokemonName);
        itemDiv.classList.toggle('selected', checkbox.checked);
    }
}

// <<< REESCRITA: Agora chama a API uma única vez >>>
export async function handleConfirmPartialReturn() {
    const selection = getState().partialReturnSelection;
    const pokemonsToReturnNames = Object.keys(selection).filter(name => selection[name]);
    const passwordInput = document.getElementById('partialReturnPassword');
    const trainerPassword = passwordInput ? passwordInput.value : '';

    if (pokemonsToReturnNames.length === 0) { displayError('Selecione pelo menos um Pokémon para devolver.'); return; }
    if (!trainerPassword) { displayError('Por favor, digite sua senha de treinador para confirmar a devolução.'); if(passwordInput) passwordInput.focus(); return; }

    const groupIndex = getState().activeHistoryGroupIndex;
    if (groupIndex === null) { displayError("Erro interno: Grupo de histórico não identificado."); return; }

    const confirmButton = dom.confirmPartialReturnButton;
    if (confirmButton) confirmButton.disabled = true;

    try {
        // Busca o histórico COMPLETO para encontrar os IDs corretos das entradas a serem devolvidas
        const fullHistory = await fetchAllHistory();
        const activeGroups = await fetchActiveHistory(); // Rebusca grupos ativos para pegar data/nome atuais
        const targetGroup = activeGroups[groupIndex];

        if (!targetGroup || !targetGroup.trainer_name || !targetGroup.date) {
             displayError("Erro ao revalidar grupo de histórico ativo."); closePartialReturnModal(); return;
        }

        // Filtra o histórico completo para encontrar os IDs das entradas específicas que correspondem
        // aos Pokémons selecionados DENTRO do grupo ativo (mesmo treinador, mesma data de empréstimo)
        const historyEntryIdsToReturn = fullHistory
            .filter(entry =>
                !entry.returned && // Apenas os não devolvidos
                entry.trainer_name === targetGroup.trainer_name && // Mesmo treinador
                entry.date === targetGroup.date && // Mesma data de empréstimo original
                pokemonsToReturnNames.includes(entry.pokemon_name) // Nomes dos Pokémons selecionados no modal
            )
            .map(entry => entry.id); // Pega apenas os IDs

        if (historyEntryIdsToReturn.length !== pokemonsToReturnNames.length) {
             console.warn("Discrepância entre Pokémons selecionados e IDs encontrados no histórico.", { selected: pokemonsToReturnNames, foundIds: historyEntryIdsToReturn });
             displayError('Erro ao mapear seleção para registros do histórico. A lista pode estar desatualizada.');
             renderActivePokemons(); // Atualiza a lista de ativos
             closePartialReturnModal();
             if (confirmButton) confirmButton.disabled = false;
             return;
        }

        if (historyEntryIdsToReturn.length === 0) {
             displayError('Não foi possível encontrar os registros correspondentes para devolução.');
             closePartialReturnModal();
             renderActivePokemons();
              if (confirmButton) confirmButton.disabled = false;
             return;
        }

        console.log(`[Partial Return] IDs a devolver: ${historyEntryIdsToReturn.join(', ')}`);

        // <<< CHAMADA ÚNICA PARA A NOVA API >>>
        const result = await returnMultiplePokemonAPI(historyEntryIdsToReturn, trainerPassword);

        // Sucesso!
        displaySuccess(result.message || `${historyEntryIdsToReturn.length} Pokémon(s) devolvido(s) com sucesso!`);
        closePartialReturnModal(); // Fecha o modal

    } catch (error) {
        // Trata erros específicos da API ou erros gerais
        console.error("Erro ao confirmar devolução parcial:", error);
        if (error.message && error.message.toLowerCase().includes('senha do treinador inválida')) {
            displayError('Senha do treinador inválida. Nenhum Pokémon foi devolvido.');
            if(passwordInput) passwordInput.focus();
        } else {
            // Usa a mensagem de erro da API se disponível, senão uma genérica
            displayError(error.message || "Ocorreu um erro inesperado durante a devolução.");
        }
         // Não fecha o modal se a senha/outro erro ocorreu
    } finally {
         // Atualiza a UI independentemente de sucesso ou falha
         renderActivePokemons();
         const currentViewClan = getState().currentClan;
         if (currentViewClan !== 'home') loadClanView(currentViewClan);
         if (confirmButton) confirmButton.disabled = false; // Reabilita o botão
    }
}