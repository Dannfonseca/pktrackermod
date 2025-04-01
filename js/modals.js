// js/modals.js
import { CONFIG } from './config.js';
import { state } from './state.js';
import { elements } from './domElements.js';
import * as API from './api.js';
import { createElement } from './ui.js';
import { navigateTo } from './app.js'; // Import for navigation after actions

// --- Add Pokémon Modal ---
export function openAddPokemonModal() {
    loadClansInAddSelect(); // Populate select before showing
    elements.addPokemonModal.style.display = 'flex';
}
export function closeAddPokemonModal() {
    elements.addPokemonModal.style.display = 'none';
    elements.addPokemonForm?.reset(); // Clear form on close
}
function loadClansInAddSelect() {
    elements.clanSelectInput.innerHTML = '<option value="" disabled selected>Selecione um Clã</option>';
    Object.entries(CONFIG.CLAN_DATA).forEach(([id, data]) => {
         elements.clanSelectInput.appendChild(createElement('option', { value: id, textContent: data.name }));
    });
}
export async function handleAddPokemonSubmit() {
    const name = elements.newPokemonNameInput.value.trim();
    const item = elements.newPokemonItemInput.value.trim();
    const clanId = elements.clanSelectInput.value;
    if (!name || !clanId) return alert('Nome e Clã são obrigatórios.');

    const addButton = elements.addPokemonForm.querySelector('button[type="submit"]');
    addButton.disabled = true;
    try {
        await API.addPokemon(clanId, name, item);
        alert(`Pokémon ${name} adicionado!`);
        closeAddPokemonModal();
        // Reload is the simplest way to ensure all views are updated
        // If dynamic update is preferred, need to call relevant view refresh, e.g.:
        // if (state.currentClan === clanId) { ClanView.loadPokemons(clanId); }
        window.location.reload();
    } catch (error) {
        alert(`Falha ao adicionar: ${error.message}`);
    } finally {
        addButton.disabled = false;
    }
}

// --- Partial Return Modal ---
export async function openPartialReturnModal(trainer, date) {
     try {
         // Fetch full history to get individual history IDs for the group
         const fullHistory = await API.getFullHistory();
         const groupEntries = fullHistory.filter(entry =>
             entry.trainer === trainer && entry.date === date && !entry.returned
         );

         if (groupEntries.length === 0) {
             alert('Não foi possível encontrar detalhes ou empréstimo já devolvido.');
             // Optionally refresh home view here if needed
             // HomeView.renderActivePokemons(); // Assumes HomeView is imported or accessible
             return;
         }

         // Store data needed for confirmation (history IDs and names)
         state.currentLoanGroupData = {
             trainer,
             date,
             pokemons: groupEntries.map(e => ({ id: e.id, name: e.pokemon_name }))
         };
         state.partialReturnSelection = {}; // Reset selection
         elements.partialReturnListContainer.innerHTML = ''; // Clear modal list

         // Populate modal list
         state.currentLoanGroupData.pokemons.forEach(p =>
             elements.partialReturnListContainer.appendChild(createPartialReturnItem(p))
         );

         elements.partialReturnModal.style.display = 'flex';
     } catch (error) {
         console.error("Erro ao abrir modal de devolução:", error);
         alert('Erro ao buscar detalhes para devolução.');
     }
 }
export function closePartialReturnModal() {
    elements.partialReturnModal.style.display = 'none';
    state.partialReturnSelection = {}; // Clear selection state
    state.currentLoanGroupData = null; // Clear group data
    elements.partialReturnListContainer.innerHTML = ''; // Clear list
}
function createPartialReturnItem(pokemon) { // pokemon = { id: historyId, name: pokemonName }
    const itemDiv = createElement('div', {
        className: 'partial-return-item',
        dataset: { historyId: pokemon.id, pokemonName: pokemon.name }
    });
    itemDiv.appendChild(createElement('div', { className: 'pokemon-name', textContent: pokemon.name }));
    const checkbox = createElement('input', {
        type: 'checkbox',
        className: 'partial-return-checkbox',
        dataset: { historyId: pokemon.id }
    });
    // Add listener to update state and UI on check/uncheck
    checkbox.addEventListener('change', (e) => {
        state.partialReturnSelection[e.target.dataset.historyId] = e.target.checked;
        itemDiv.classList.toggle('selected', e.target.checked);
    });
    itemDiv.appendChild(checkbox);
    return itemDiv;
}
export async function confirmPartialReturn() {
    const idsToReturn = Object.keys(state.partialReturnSelection).filter(id => state.partialReturnSelection[id]);
    if (idsToReturn.length === 0) return alert('Selecione ao menos um Pokémon.');

    try {
        // Send a return request for each selected history ID
        await Promise.all(idsToReturn.map(id => API.returnPokemonHistory(id)));
        alert('Pokémon(s) devolvido(s)!');
        closePartialReturnModal();
        navigateTo('home'); // Refresh home view to show updated active list
        // Consider if clan view also needs refresh if user navigates there
        // window.location.reload(); // Keep reload if dynamic updates are complex
    } catch (error) {
        alert(`Erro ao devolver: ${error.message}`);
        closePartialReturnModal(); // Close modal even on error
        navigateTo('home'); // Attempt to refresh view anyway
    }
}