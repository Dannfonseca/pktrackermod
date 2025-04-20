// TODOLISTPOKEMON/js/api.js
/**
 * Funções para interagir com a API do backend (definida em config.js).
 * ... (comentários anteriores) ...
 * Inclui função para devolução múltipla de Pokémons.
 *
 * Funções Principais:
 * ...
 * - returnPokemonAPI: Marca UMA entrada de histórico como devolvida.
 * - returnMultiplePokemonAPI: Marca VÁRIAS entradas de histórico como devolvidas (NOVO).
 * ...
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
            throw new Error(errorData.error || `HTTP error! status: ${response.status} - ${url}`);
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
             const textResponse = await response.text();
             return { message: textResponse };
        }

    } catch (error) {
        console.error('API Error:', error);
        displayError(`Falha na comunicação com a API: ${error.message}`);
        throw error;
    } finally {
        hideSpinner();
    }
}

// --- Funções da API ---
// (Funções addTrainerAPI, fetchTrainersAPI, deleteTrainerAPI, fetchClanPokemons, fetchAllHistory, fetchActiveHistory, postHistory, deleteHistoryEntryAPI, deleteAllHistoryAPI, addPokemonAPI, deletePokemonAPI permanecem as mesmas)
export async function addTrainerAPI(name, email, password, adminPassword) {
    if (!name || !email || !password || !adminPassword) {
        throw new Error("Nome, email, senha do treinador e senha do admin são obrigatórios.");
    }
    return await fetchData(`${API_BASE_URL}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, admin_password: adminPassword }),
    });
}
export async function fetchTrainersAPI() {
    return await fetchData(`${API_BASE_URL}/trainers`);
}
export async function deleteTrainerAPI(trainerId, adminPassword) {
    if (!trainerId || !adminPassword) {
        throw new Error("ID do Treinador e Senha de Admin são obrigatórios para deleção.");
    }
    return await fetchData(`${API_BASE_URL}/trainers/${trainerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: adminPassword })
    });
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
export async function postHistory(trainerPassword, pokemonIds, comment) {
     if (!trainerPassword || !pokemonIds || pokemonIds.length === 0) {
        throw new Error("Senha do treinador e Pokémons selecionados são necessários.");
    }
    return await fetchData(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
             trainer_password: trainerPassword,
             pokemons: pokemonIds,
             comment: comment || null
        }),
    });
}
export async function deleteHistoryEntryAPI(id) {
    if (!id) {
        throw new Error("ID da entrada do histórico é obrigatório para deleção.");
    }
    return await fetchData(`${API_BASE_URL}/history/${id}`, { method: 'DELETE' });
}
export async function deleteAllHistoryAPI() {
    return await fetchData(`${API_BASE_URL}/history`, { method: 'DELETE' });
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
    return await fetchData(`${API_BASE_URL}/pokemons/${pokemonId}`, { method: 'DELETE' });
}


// API para devolver UM pokemon (Mantida, mas não usada pela devolução múltipla)
export async function returnPokemonAPI(historyEntryId, trainerPassword) {
    console.warn("Chamando API de devolução individual (returnPokemonAPI). Para múltiplos itens, use returnMultiplePokemonAPI.");
    if (!trainerPassword) {
        throw new Error("Senha do treinador é necessária para a devolução.");
    }
    return await fetchData(`${API_BASE_URL}/history/${historyEntryId}/return`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ trainer_password: trainerPassword })
   });
}

// <<< NOVA Função para devolver MÚLTIPLOS pokemons >>>
export async function returnMultiplePokemonAPI(historyEntryIds, trainerPassword) {
    if (!Array.isArray(historyEntryIds) || historyEntryIds.length === 0) {
        throw new Error("É necessário fornecer uma lista de IDs de histórico.");
    }
    if (!trainerPassword) {
        throw new Error("Senha do treinador é necessária para a devolução múltipla.");
    }
    return await fetchData(`${API_BASE_URL}/history/return-multiple`, { // Chama o novo endpoint
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ // Envia a lista de IDs e a senha
           historyEntryIds: historyEntryIds,
           trainer_password: trainerPassword
       })
   });
}