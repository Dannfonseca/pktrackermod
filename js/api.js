// js/api.js
import { CONFIG } from './config.js';
import { showSpinner, hideSpinner } from './ui.js';

/** Generic fetch wrapper */
async function fetchAPI(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    showSpinner();
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            let errorData = { message: `HTTP error! status: ${response.status}` };
            try { errorData = await response.json(); } catch (e) { /* Ignore */ }
            console.error('API Error Response:', errorData);
            throw new Error(errorData.error || errorData.message || 'API request failed');
        }
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null; // Indicate success with no content
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch API Error:', error);
        alert(`Erro na comunicação com a API: ${error.message}`);
        throw error; // Re-throw for handling in calling function
    } finally {
        hideSpinner();
    }
}

// --- Specific API Calls ---
export const getPokemonsByClan = (clanId) => fetchAPI(`/clans/${clanId}/pokemons`);
export const getActiveHistory = () => fetchAPI('/history/active');
export const getFullHistory = () => fetchAPI('/history');
export const postLoan = (trainerName, pokemonIds) => fetchAPI('/history', { method: 'POST', body: { trainer: trainerName, pokemons: pokemonIds } });
export const returnPokemonHistory = (historyId) => fetchAPI(`/history/${historyId}/return`, { method: 'PUT' });
export const addPokemon = (clanId, name, item) => fetchAPI(`/clans/${clanId}/pokemons`, { method: 'POST', body: { name, held_item: item || null } });
export const deletePokemon = (pokemonId) => fetchAPI(`/pokemons/${pokemonId}`, { method: 'DELETE' });
export const deleteHistoryGroup = (trainer, date) => fetchAPI(`/history/trainer/${encodeURIComponent(trainer)}/date/${encodeURIComponent(date)}`, { method: 'DELETE' });
export const deleteAllHistory = () => fetchAPI('/history', { method: 'DELETE' });