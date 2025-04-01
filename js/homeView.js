// js/homeView.js
import { elements } from './domElements.js';
import * as API from './api.js';
import { createElement, displayMessage } from './ui.js';
// Import modal function directly if needed, assumes modals.js exports it
import { openPartialReturnModal } from './modals.js';

/** Renders the list of actively borrowed Pokémon */
export async function renderActivePokemons() {
     try {
        const activeGroups = await API.getActiveHistory();
        elements.activePokemonsList.innerHTML = '';

        if (!activeGroups || activeGroups.length === 0) {
           return displayMessage(elements.activePokemonsList, 'Nenhum Pokémon em uso no momento.', 'empty');
        }
        activeGroups.forEach(group => elements.activePokemonsList.appendChild(createActivePokemonGroupElement(group)));
    } catch (error) {
        console.error('Erro ao buscar Pokémons ativos:', error);
         displayMessage(elements.activePokemonsList, 'Não foi possível carregar Pokémons em uso.', 'error');
    }
}

/** Creates the HTML element for a group of active Pokémon */
function createActivePokemonGroupElement(group) {
    const itemDiv = createElement('div', { className: 'active-pokemon-item' });
    const headerDiv = createElement('div', { className: 'active-pokemon-header' });

    let formattedDate = group.date;
    try { formattedDate = new Date(group.date).toLocaleString('pt-BR'); } catch (e) { /* Use original */ }

    headerDiv.appendChild(createElement('div', { className: 'active-pokemon-trainer', textContent: group.trainer }));
    headerDiv.appendChild(createElement('div', { className: 'active-pokemon-date', textContent: formattedDate }));

    // Button to trigger the return modal - uses dataset for event delegation
    const returnButton = createElement('button', {
        className: 'return-button return-loan-group-button', // Specific class
        textContent: 'Devolver',
        title: 'Devolver Pokémon(s) deste empréstimo',
        dataset: { action: 'open-return-modal', trainer: group.trainer, date: group.date } // Add action
    });
    headerDiv.appendChild(returnButton);

    const listDiv = createElement('div', {
        className: 'active-pokemon-list',
        textContent: group.pokemons.join(', ')
    });

    itemDiv.appendChild(headerDiv);
    itemDiv.appendChild(listDiv);
    return itemDiv;
}