// TODOLISTPOKEMON/js/modals.js
/**
 * Gerencia a lógica específica para os modais da aplicação, como o modal
 * para adicionar um novo Pokémon e o modal para devolução parcial de Pokémons.
 * (O modal de Histórico é tratado em history.js).
 *
 * Funções Principais (Modal Adicionar Pokémon):
 * - openAddPokemonModal: Abre o modal e carrega os clãs no select.
 * - closeAddPokemonModal: Fecha o modal e reseta o formulário.
 * - loadClansInModalSelect: Preenche o <select> com os clãs disponíveis.
 * - handleAddPokemonFormSubmit: Processa o envio do formulário, chama a API e fecha o modal.
 *
 * Funções Principais (Modal Devolução Parcial):
 * - openPartialReturnModal: Abre o modal, busca os Pokémons do grupo ativo e os lista com checkboxes.
 * - closePartialReturnModal: Fecha o modal e limpa o estado relacionado.
 * - handleTogglePartialReturn: Atualiza o estado quando um checkbox de devolução é marcado/desmarcado.
 * - handleConfirmPartialReturn: Identifica os Pokémons selecionados, encontra seus IDs de histórico e chama a API para devolvê-los.
 */
import { dom } from './domElements.js';
import { clanData } from './config.js';
import { addPokemonAPI, fetchActiveHistory, returnPokemonAPI, fetchAllHistory } from './api.js';
import { displayError, displaySuccess } from './ui.js';
import { getState, setActiveHistoryGroupIndex, setPartialReturnSelection, togglePartialReturnSelection, clearPartialReturnSelection } from './state.js';
import { renderActivePokemons } from './homeView.js';
import { loadClanView } from './clanView.js';





export function openAddPokemonModal() {
    loadClansInModalSelect();
    dom.addPokemonModal.style.display = 'flex';
    dom.newPokemonNameInput.focus();
}

export function closeAddPokemonModal() {
    dom.addPokemonModal.style.display = 'none';
    dom.addPokemonForm.reset();
}


function loadClansInModalSelect() {
    dom.clanSelectInput.innerHTML = '';


    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um Clã...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dom.clanSelectInput.appendChild(defaultOption);


    Object.keys(clanData).forEach(clanKey => {
        const option = document.createElement('option');
        option.value = clanKey;

        option.textContent = clanKey.charAt(0).toUpperCase() + clanKey.slice(1);
        dom.clanSelectInput.appendChild(option);
    });
}


export async function handleAddPokemonFormSubmit(event) {
    event.preventDefault();

    const name = dom.newPokemonNameInput.value.trim();
    const item = dom.newPokemonItemInput.value.trim();
    const clan = dom.clanSelectInput.value;

    if (!name || !clan) {
        displayError('Nome do Pokémon e Clã são obrigatórios.');
        return;
    }


    const submitButton = dom.addPokemonForm.querySelector('button[type="submit"]');
     if(submitButton) submitButton.disabled = true;


    try {
        await addPokemonAPI(clan, name, item);
        displaySuccess(`Pokémon "${name}" adicionado ao clã ${clan} com sucesso!`);
        closeAddPokemonModal();

        if (getState().currentClan === clan) {
            loadClanView(clan);
        }


    } catch (error) {

    } finally {

         if(submitButton) submitButton.disabled = false;
    }
}




export async function openPartialReturnModal(groupIndex) {
    setActiveHistoryGroupIndex(groupIndex);
    clearPartialReturnSelection();

    try {
        const activeGroups = await fetchActiveHistory();
        const group = activeGroups[groupIndex];

        if (!group) {
            displayError("Grupo de empréstimo não encontrado.");
            return;
        }

        dom.partialReturnListContainer.innerHTML = '';


        group.pokemons.forEach(pokemonName => { // Alterado para iterar sobre nomes (workaround API)
            const item = document.createElement('div');
            item.className = 'partial-return-item';
            item.dataset.pokemonName = pokemonName;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'pokemon-name';
            nameDiv.textContent = pokemonName;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'partial-return-checkbox';
            checkbox.dataset.action = 'toggle-partial-return';
            checkbox.dataset.pokemonName = pokemonName;

            item.appendChild(nameDiv);
            item.appendChild(checkbox);
            dom.partialReturnListContainer.appendChild(item);
        });

        dom.partialReturnModal.style.display = 'flex';

    } catch (error) {

        closePartialReturnModal();
    }
}

export function closePartialReturnModal() {
    dom.partialReturnModal.style.display = 'none';
    dom.partialReturnListContainer.innerHTML = '';
    setActiveHistoryGroupIndex(null);
    clearPartialReturnSelection();
}


export function handleTogglePartialReturn(checkbox) {
    const pokemonName = checkbox.dataset.pokemonName;
    const itemDiv = checkbox.closest('.partial-return-item');

    if (pokemonName && itemDiv) {
        togglePartialReturnSelection(pokemonName);
        itemDiv.classList.toggle('selected', checkbox.checked);
    }
}


export async function handleConfirmPartialReturn() {
    const selection = getState().partialReturnSelection;
    const pokemonsToReturnNames = Object.keys(selection).filter(name => selection[name]);

    if (pokemonsToReturnNames.length === 0) {
        displayError('Selecione pelo menos um Pokémon para devolver.');
        return;
    }


    const groupIndex = getState().activeHistoryGroupIndex;
    if (groupIndex === null) {
        displayError("Erro interno: Grupo de histórico não identificado.");
        return;
    }


    try {

        const fullHistory = await fetchAllHistory();
        const activeGroups = await fetchActiveHistory();
        const targetGroup = activeGroups[groupIndex];

        if (!targetGroup) {
             displayError("Erro ao revalidar grupo de histórico.");
             return;
        }


        const historyEntryIdsToReturn = fullHistory
            .filter(entry =>
                !entry.returned &&
                entry.trainer === targetGroup.trainer &&
                entry.date === targetGroup.date &&
                pokemonsToReturnNames.includes(entry.pokemon_name)
            )
            .map(entry => entry.id);

        if (historyEntryIdsToReturn.length === 0) {
            displayError('Não foi possível encontrar os registros de histórico correspondentes para devolução. A lista pode estar desatualizada.');
             closePartialReturnModal();
             renderActivePokemons();
            return;
        }


        const returnPromises = historyEntryIdsToReturn.map(entryId =>
            returnPokemonAPI(entryId)
        );

        await Promise.all(returnPromises);

        displaySuccess('Pokémon(s) selecionado(s) devolvido(s) com sucesso!');
        closePartialReturnModal();


        renderActivePokemons();

        const currentViewClan = getState().currentClan;
        if (currentViewClan !== 'home') {
            loadClanView(currentViewClan);
        }



    } catch (error) {


         renderActivePokemons();
         const currentViewClan = getState().currentClan;
         if (currentViewClan !== 'home') {
             loadClanView(currentViewClan);
         }
    }
}