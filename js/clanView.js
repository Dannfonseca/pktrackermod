// js/clanView.js
import { CONFIG } from './config.js';
import { state } from './state.js';
import { elements } from './domElements.js';
import * as API from './api.js';
import { createElement, displayMessage } from './ui.js';
import { navigateTo } from './app.js'; // Import for navigation after actions

/** Updates the header section of the clan view */
export function updateHeader(clanId) {
    const clanInfo = CONFIG.CLAN_DATA[clanId];
    if (clanInfo && elements.clanTitle && elements.clanElementsTag) {
        elements.clanTitle.textContent = clanInfo.name;
        elements.clanElementsTag.textContent = clanInfo.elements;
        elements.selectEntireBagButton.textContent = 'Adicionar Tudo'; // Reset button
        elements.selectEntireBagButton.classList.remove('remove-all');
    } else if (elements.clanTitle && elements.clanElementsTag) {
        elements.clanTitle.textContent = 'Clã Desconhecido';
        elements.clanElementsTag.textContent = '';
    }
}

/** Loads and renders Pokémon for the specified clan */
export async function loadPokemons(clanId) {
    try {
        const pokemons = await API.getPokemonsByClan(clanId);
        elements.pokemonSelectionContainer.innerHTML = '';

        if (!pokemons || pokemons.length === 0) {
            elements.pokemonSelectionContainer.classList.add('hidden');
            elements.emptyClanMessage.classList.remove('hidden');
            displayMessage(elements.pokemonSelectionContainer, 'Nenhum Pokémon neste clã.', 'empty');
        } else {
            elements.pokemonSelectionContainer.classList.remove('hidden');
            elements.emptyClanMessage.classList.add('hidden');
            pokemons.forEach(pokemon => {
                const pokemonElement = createPokemonItemElement(pokemon);
                elements.pokemonSelectionContainer.appendChild(pokemonElement);
            });
        }
         updateSelectEntireBagButtonState(pokemons); // Update button based on loaded data
    } catch (error) {
        console.error(`Erro ao carregar Pokémons do clã ${clanId}:`, error);
        displayMessage(elements.pokemonSelectionContainer, 'Não foi possível carregar os Pokémons.', 'error');
        elements.pokemonSelectionContainer.classList.remove('hidden');
        elements.emptyClanMessage.classList.add('hidden');
        updateSelectEntireBagButtonState([]); // Ensure button state is correct on error
    }
}

/** Creates the HTML element for a single Pokémon item */
function createPokemonItemElement(pokemon) {
    const isSelected = !!state.selectedPokemons[pokemon.id];
    const isAvailable = pokemon.status === 'available';

    const itemDiv = createElement('div', {
        className: `pokemon-item ${!isAvailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`,
        dataset: { pokemonId: pokemon.id, pokemonVersion: pokemon.version, pokemonName: pokemon.name }
    });

    itemDiv.appendChild(createElement('div', {
        className: 'pokemon-name',
        textContent: pokemon.name + (pokemon.held_item ? ` (${pokemon.held_item})` : '')
    }));

    const actionsDiv = createElement('div', { className: 'pokemon-actions' });

    const selectButton = createElement('button', {
        className: `select-button action-button ${isSelected ? 'selected' : ''}`,
        textContent: !isAvailable ? 'X' : (isSelected ? '✓' : '+'),
        title: !isAvailable ? 'Indisponível' : (isSelected ? 'Remover da seleção' : 'Adicionar à seleção'),
        dataset: { action: 'toggle-select' }
    });
    if (!isAvailable) selectButton.disabled = true;

    const deleteButton = createElement('button', {
        className: 'delete-button action-button',
        textContent: '-',
        title: 'Deletar Pokémon',
        dataset: { action: 'delete-pokemon' }
    });

    actionsDiv.appendChild(selectButton);
    actionsDiv.appendChild(deleteButton);
    itemDiv.appendChild(actionsDiv);

    return itemDiv;
}

/** Handles clicks on buttons within a Pokémon item */
export function handleItemClick(event) {
    const button = event.target.closest('.action-button');
    if (!button) return;
    const pokemonItem = button.closest('.pokemon-item');
    if (!pokemonItem) return;
    const pokemonId = pokemonItem.dataset.pokemonId;
    const action = button.dataset.action;

    if (action === 'toggle-select') {
        togglePokemonSelection(pokemonId, button, pokemonItem);
    } else if (action === 'delete-pokemon') {
        deletePokemon(pokemonId, pokemonItem.dataset.pokemonName);
    }
}

/** Toggles the selection state of a Pokémon */
function togglePokemonSelection(pokemonId, buttonElement, itemElement) {
    const isCurrentlySelected = !!state.selectedPokemons[pokemonId];
    if (isCurrentlySelected) {
        delete state.selectedPokemons[pokemonId];
        itemElement.classList.remove('selected');
        buttonElement.classList.remove('selected');
        buttonElement.textContent = '+';
        buttonElement.title = 'Adicionar à seleção';
    } else {
        state.selectedPokemons[pokemonId] = true;
        itemElement.classList.add('selected');
        buttonElement.classList.add('selected');
        buttonElement.textContent = '✓';
        buttonElement.title = 'Remover da seleção';
    }
    console.log('Seleção atual:', state.selectedPokemons);
    updateSelectEntireBagButtonState(); // Update bag button based on new selection
}

/** Selects or deselects all available Pokémon in the current clan */
export async function handleSelectEntireBag() {
    const currentClanId = state.currentClan;
    if (!currentClanId || currentClanId === 'home') return;
     try {
        // Fetch fresh list to ensure correct status
        const pokemons = await API.getPokemonsByClan(currentClanId);
        const availablePokemonItems = elements.pokemonSelectionContainer.querySelectorAll('.pokemon-item:not(.unavailable)');
        const availablePokemonIds = Array.from(availablePokemonItems).map(item => item.dataset.pokemonId);

        if (availablePokemonIds.length === 0) return alert('Nenhum Pokémon disponível.');

        const allAvailableSelected = availablePokemonIds.every(id => state.selectedPokemons[id]);

        if (allAvailableSelected) { // Deselect All
            availablePokemonIds.forEach(id => delete state.selectedPokemons[id]);
        } else { // Select All
            availablePokemonIds.forEach(id => state.selectedPokemons[id] = true);
        }

        // Update UI efficiently
        availablePokemonItems.forEach(item => {
            const id = item.dataset.pokemonId;
            const button = item.querySelector('.select-button');
            const isSelected = !!state.selectedPokemons[id];
            item.classList.toggle('selected', isSelected);
            if (button && !button.disabled) {
                button.textContent = isSelected ? '✓' : '+';
                button.classList.toggle('selected', isSelected);
                button.title = isSelected ? 'Remover da seleção' : 'Adicionar à seleção';
            }
        });
         updateSelectEntireBagButtonState(); // Update button text/state

    } catch (error) {
         console.error('Erro no Adicionar/Retirar Tudo:', error);
         alert('Erro ao processar seleção da bag.');
     }
}

/** Updates the text/class of the "Select/Deselect All" button */
function updateSelectEntireBagButtonState(pokemons = null) {
    let availablePokemonIds = [];
    if (pokemons) { // If Pokémon list is passed (e.g., after loading)
        availablePokemonIds = pokemons.filter(p => p.status === 'available').map(p => p.id);
    } else { // Otherwise, query the current DOM
        availablePokemonIds = Array.from(elements.pokemonSelectionContainer.querySelectorAll('.pokemon-item:not(.unavailable)'))
                               .map(item => item.dataset.pokemonId);
    }
    const numAvailable = availablePokemonIds.length;
    const numSelected = Object.keys(state.selectedPokemons).filter(id => availablePokemonIds.includes(id)).length;

    elements.selectEntireBagButton.disabled = numAvailable === 0;
    if (numAvailable > 0 && numSelected === numAvailable) {
        elements.selectEntireBagButton.textContent = 'Retirar Tudo';
        elements.selectEntireBagButton.classList.add('remove-all');
    } else {
        elements.selectEntireBagButton.textContent = 'Adicionar Tudo';
        elements.selectEntireBagButton.classList.remove('remove-all');
    }
}

/** Confirms the Pokémon selection and registers the loan */
export async function confirmLoan() {
    const trainerName = elements.trainerNameInput.value.trim();
    if (!trainerName) return alert("Por favor, insira seu nome.");
    const pokemonIdsToSave = Object.keys(state.selectedPokemons);
    if (pokemonIdsToSave.length === 0) return alert("Nenhum Pokémon selecionado.");

    try {
        await API.postLoan(trainerName, pokemonIdsToSave);
        alert(`${pokemonIdsToSave.length} Pokémon(s) registrado(s) para ${trainerName}!`);
        state.selectedPokemons = {}; // Clear selection
        elements.trainerNameInput.value = ''; // Clear input
        navigateTo('home'); // Navigate home after successful loan
    } catch (error) {
        console.error('Erro ao registrar empréstimo:', error);
        // Handle specific API errors if possible (like Pokémon already borrowed)
        if (error.message.includes('não está disponível') || error.message.includes('modificado por outra pessoa')) {
             alert(`Erro: ${error.message} Atualizando a lista...`);
             loadPokemons(state.currentClan); // Refresh current clan list if error indicates state mismatch
         } else {
             alert('Falha ao registrar o empréstimo.');
         }
    }
}

/** Deletes a specific Pokémon after confirmation */
async function deletePokemon(pokemonId, pokemonName) {
     if (state.isDeletingPokemon) return;
     const name = pokemonName || 'este Pokémon';
     const password = prompt(`Digite a senha para deletar ${name}:`);
     if (password !== CONFIG.ADMIN_PASSWORD) {
         if (password !== null) alert('Senha incorreta!'); return;
     }
     if (!confirm(`Tem certeza que deseja deletar ${name} PERMANENTEMENTE?`)) return;

     state.isDeletingPokemon = true;
     try {
         await API.deletePokemon(pokemonId);
         alert(`${name} deletado com sucesso!`);
         loadPokemons(state.currentClan); // Refresh the list after deletion
     } catch (error) {
         console.error(`Erro ao deletar Pokémon ${pokemonId}:`, error);
         alert(`Falha ao deletar: ${error.message}`);
     } finally {
         state.isDeletingPokemon = false;
     }
 }