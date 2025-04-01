// js/history.js
import { CONFIG } from './config.js';
import { elements } from './domElements.js';
import * as API from './api.js';
import { createElement, displayMessage } from './ui.js';

/** Opens the history modal and loads data */
export function openModal() {
    render();
    elements.historyModal.style.display = 'flex';
}

/** Closes the history modal */
export function closeModal() {
    elements.historyModal.style.display = 'none';
}

/** Renders the history list based on current filters */
export async function render() {
    const filter = elements.historyFilterSelect.value;
    const searchTerm = elements.historySearchInput.value.toLowerCase();
    try {
        const history = await API.getFullHistory();
        elements.historyListContainer.innerHTML = '';

        const grouped = groupHistoryEntries(history);
        const filtered = Object.values(grouped)
            .filter(group => filterHistoryGroup(group, filter, searchTerm))
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

        if (filtered.length === 0) {
           return displayMessage(elements.historyListContainer, 'Nenhum registro encontrado.', 'empty');
        }
        filtered.forEach(group => elements.historyListContainer.appendChild(createHistoryGroupElement(group)));
    } catch (error) {
        console.error('Erro ao renderizar histórico:', error);
        displayMessage(elements.historyListContainer, 'Não foi possível carregar o histórico.', 'error');
    }
}

/** Groups raw history entries by trainer and date */
function groupHistoryEntries(entries) {
    const grouped = {};
    entries.forEach(entry => {
        const key = `${entry.trainer}-${entry.date}`; // Group key
        if (!grouped[key]) {
            grouped[key] = { trainer: entry.trainer, date: entry.date, pokemons: [], allReturned: true };
        }
        grouped[key].pokemons.push({
            historyId: entry.id, // Important for individual returns/updates
            name: entry.pokemon_name || `ID ${entry.pokemon || '?'}`,
            returned: !!entry.returned,
            returnDate: entry.returnDate,
        });
        if (!entry.returned) grouped[key].allReturned = false; // Mark group as active if any are not returned
    });
    return grouped;
}

/** Filters a history group */
function filterHistoryGroup(group, filter, searchTerm) {
    // Status filter
    if (filter === 'active' && group.allReturned) return false;
    if (filter === 'returned' && !group.allReturned) return false;
    // Search filter
    if (searchTerm) {
        const trainerMatch = group.trainer.toLowerCase().includes(searchTerm);
        const pokemonMatch = group.pokemons.some(p => p.name.toLowerCase().includes(searchTerm));
        if (!trainerMatch && !pokemonMatch) return false;
    }
    return true;
}

/** Creates the HTML element for a history group */
function createHistoryGroupElement(group) {
    const itemDiv = createElement('div', { className: `history-item ${group.allReturned ? 'returned' : 'active'}` });
    const headerDiv = createElement('div', { className: 'history-header' });

     let formattedDate = group.date;
     try { formattedDate = new Date(group.date).toLocaleString('pt-BR'); } catch (e) { /* ignore */ }

    headerDiv.appendChild(createElement('div', { className: 'history-trainer', textContent: group.trainer }));
    headerDiv.appendChild(createElement('div', { className: 'history-date', textContent: formattedDate }));
    // Delete button with data attributes for delegation
    headerDiv.appendChild(createElement('button', {
        className: 'delete-button delete-history-group-button', // Specific class
        textContent: 'Deletar',
        title: 'Deletar este registro',
        dataset: { action: 'delete-history-group', trainer: group.trainer, date: group.date } // Add action
    }));

    const pokemonsDiv = createElement('div', { className: 'history-pokemons' });
    const active = group.pokemons.filter(p => !p.returned).map(p => p.name);
    const returned = group.pokemons.filter(p => p.returned);

    if (active.length > 0) {
        pokemonsDiv.appendChild(createElement('div', { innerHTML: `<span class="history-status active">Em uso</span>: ${active.join(', ')}` }));
    }

    // Group returned by date
    const returnsByDate = {};
    returned.forEach(p => {
        const key = p.returnDate || 'Data Indisponível';
        if (!returnsByDate[key]) returnsByDate[key] = [];
        returnsByDate[key].push(p.name);
    });
    Object.entries(returnsByDate).forEach(([date, names]) => {
        let fDate = date;
        try { fDate = new Date(date).toLocaleString('pt-BR'); } catch (e) { /* ignore */ }
        pokemonsDiv.appendChild(createElement('div', {
            innerHTML: `<span class="history-status returned">Devolvido</span>: ${names.join(', ')} <div class="history-return-date">em ${fDate}</div>`
        }));
    });

    itemDiv.appendChild(headerDiv);
    itemDiv.appendChild(pokemonsDiv);
    return itemDiv;
}

/** Deletes a specific history group */
export async function deleteItemGroup(trainer, date) {
    const password = prompt(`Senha para deletar registro de ${trainer} (${date}):`);
    if (password !== CONFIG.ADMIN_PASSWORD) { if (password !== null) alert('Senha incorreta!'); return; }
    if (!confirm(`Deletar PERMANENTEMENTE o registro de ${trainer} de ${date}?`)) return;
    try {
        await API.deleteHistoryGroup(trainer, date);
        alert('Registro deletado.');
        render(); // Refresh history list
    } catch (error) {
        alert(`Falha ao deletar: ${error.message}`);
    }
}

/** Deletes all history entries */
export async function deleteAll() {
    const password = prompt('Senha para deletar TODO o histórico:');
    if (password !== CONFIG.ADMIN_PASSWORD) { if (password !== null) alert('Senha incorreta!'); return; }
    if (!confirm('DELETAR TODO O HISTÓRICO? Ação IRREVERSÍVEL!')) return;
    try {
        await API.deleteAllHistory();
        alert('Histórico deletado.');
        render(); // Refresh history list
    } catch (error) {
         alert(`Falha ao deletar histórico: ${error.message}`);
    }
}