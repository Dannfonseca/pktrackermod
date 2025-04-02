// TODOLISTPOKEMON/js/api.js
/**
 * Funções para interagir com a API do backend (definida em config.js).
 * Encapsula as chamadas fetch, tratando erros básicos e controlando
 * a exibição do spinner de carregamento (showSpinner, hideSpinner de ui.js).
 *
 * Funções Principais:
 * - fetchData: Helper genérico para requisições fetch.
 * - fetchClanPokemons: Busca Pokémons de um clã.
 * - fetchAllHistory: Busca todo o histórico.
 * - fetchActiveHistory: Busca histórico ativo (empréstimos não devolvidos).
 * - postHistory: Registra um novo empréstimo.
 * - returnPokemonAPI: Marca uma entrada de histórico como devolvida.
 * - deleteHistoryEntryAPI: Deleta uma entrada/grupo do histórico.
 * - deleteAllHistoryAPI: Deleta todo o histórico.
 * - addPokemonAPI: Adiciona um novo Pokémon a um clã.
 * - deletePokemonAPI: Deleta um Pokémon pelo ID.
 */
import { API_BASE_URL } from './config.js';
import { showSpinner, hideSpinner, displayError } from './ui.js';


async function fetchData(url, options = {}) {
    showSpinner();
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorData;
            try {

                errorData = await response.json();
            } catch (e) {

                errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
            }

            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }


        if (response.status === 204) {
            return null;
        }


        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {


             console.warn("Resposta não JSON recebida:", await response.text());
            return null;
        }

    } catch (error) {
        console.error('API Error:', error);
        displayError(`Falha na comunicação com a API: ${error.message}`);
        throw error;
    } finally {
        hideSpinner();
    }
}


export async function fetchClanPokemons(clan) {
    if (!clan || clan === 'home') return [];
    return await fetchData(`${API_BASE_URL}/clans/${clan}/pokemons`);
}


export async function fetchAllHistory() {
    return await fetchData(`${API_BASE_URL}/history`);
}


export async function fetchActiveHistory() {
    return await fetchData(`${API_BASE_URL}/history/active`);
}


export async function postHistory(trainer, pokemonIds) {
     if (!trainer || !pokemonIds || pokemonIds.length === 0) {
        throw new Error("Nome do treinador e Pokémons são necessários.");
    }
    return await fetchData(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer, pokemons: pokemonIds }),
    });
}


export async function returnPokemonAPI(historyEntryId) {


     return await fetchData(`${API_BASE_URL}/history/${historyEntryId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },

    });
}



export async function deleteHistoryEntryAPI(id) {
    // Modificado para aceitar o ID da entrada do histórico diretamente
     if (!id) {
        throw new Error("ID da entrada do histórico é obrigatório para deleção.");
    }
    return await fetchData(`${API_BASE_URL}/history/${id}`, {
        method: 'DELETE',
    });
}


export async function deleteAllHistoryAPI() {
    return await fetchData(`${API_BASE_URL}/history`, {
        method: 'DELETE',
    });
}


export async function addPokemonAPI(clan, name, item) {
    if (!clan || !name) {
        throw new Error("Clã e nome do Pokémon são obrigatórios.");
    }
    return await fetchData(`${API_BASE_URL}/clans/${clan}/pokemons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, held_item: item || null }),
    });
}


export async function deletePokemonAPI(pokemonId) {
    if (!pokemonId) {
        throw new Error("ID do Pokémon é obrigatório para deleção.");
    }
    return await fetchData(`${API_BASE_URL}/pokemons/${pokemonId}`, {
        method: 'DELETE',
    });
}