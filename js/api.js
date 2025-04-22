// TODOLISTPOKEMON/js/api.js
/**
 * Funções para interagir com a API do backend (definida em config.js).
 * Encapsula as chamadas fetch, tratando erros básicos e controlando
 * a exibição do spinner de carregamento (showSpinner, hideSpinner de ui.js).
 * Inclui função para adicionar treinadores e modifica postHistory para usar senha e comentário.
 * Inclui função para devolução múltipla de Pokémons.
 * Adicionadas funções para interagir com a API de Listas Favoritas.
 * Adicionada função fetchAllPokemonsByClanAPI para obter todos os pokémons com status.
 * Funções de Listas Favoritas agora enviam senha do treinador.
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
                errorData = { error: `(${response.status}) ${response.statusText}` || `HTTP error! status: ${response.status}` };
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status} - ${url}`);
        }

        if (response.status === 204) {
            return null; // Ex: DELETE bem-sucedido
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
             const textResponse = await response.text();
             return { message: textResponse || 'Operação concluída.' };
        }

    } catch (error) {
        console.error('API Error:', error);
        const displayMsg = error.message.startsWith('Senha') || error.message.includes('encontrado') || error.message.includes('permissão') || error.message.includes('duplicado')
                           ? error.message
                           : `Falha na comunicação com a API: ${error.message}`;
        displayError(displayMsg);
        throw error;
    } finally {
        hideSpinner();
    }
}

// --- Funções da API ---

// --- Funções de Treinadores, Pokémon, Clãs, Histórico ---
// (Sem alterações aqui)
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
    if (!clan || clan === 'home' || clan === 'favorites') return [];
    return await fetchData(`${API_BASE_URL}/clans/${clan}/pokemons`);
}
export async function fetchAllAvailablePokemonsAPI() {
    console.warn("fetchAllAvailablePokemonsAPI está sendo usada. Considere usar fetchAllPokemonsByClanAPI para obter todos os pokémons com status.");
    return await fetchData(`${API_BASE_URL}/pokemons/available`);
}
// <<< NOVA FUNÇÃO >>>
/** Busca TODOS os pokémons agrupados por clã, incluindo status. */
export async function fetchAllPokemonsByClanAPI() {
    return await fetchData(`${API_BASE_URL}/pokemons/all-by-clan`);
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
export async function returnMultiplePokemonAPI(historyEntryIds, trainerPassword) {
    if (!Array.isArray(historyEntryIds) || historyEntryIds.length === 0) {
        throw new Error("É necessário fornecer uma lista de IDs de histórico.");
    }
    if (!trainerPassword) {
        throw new Error("Senha do treinador é necessária para a devolução múltipla.");
    }
    return await fetchData(`${API_BASE_URL}/history/return-multiple`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ historyEntryIds: historyEntryIds, trainer_password: trainerPassword })
   });
}
export async function deleteHistoryEntryAPI(id) {
    if (!id) throw new Error("ID da entrada do histórico é obrigatório para deleção.");
    return await fetchData(`${API_BASE_URL}/history/${id}`, { method: 'DELETE' });
}
export async function deleteAllHistoryAPI() {
    return await fetchData(`${API_BASE_URL}/history`, { method: 'DELETE' });
}
export async function addPokemonAPI(clan, name, item) {
    if (!clan || !name) throw new Error("Clã e nome do Pokémon são obrigatórios.");
    return await fetchData(`${API_BASE_URL}/clans/${clan}/pokemons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, held_item: item || null }),
    });
}
export async function deletePokemonAPI(pokemonId) {
    if (!pokemonId) throw new Error("ID do Pokémon é obrigatório para deleção.");
    return await fetchData(`${API_BASE_URL}/pokemons/${pokemonId}`, { method: 'DELETE' });
}


// --- Funções da API de Listas Favoritas ---
// (Sem alterações aqui, já estavam corretas)
export async function fetchFavoriteLists() {
    return await fetchData(`${API_BASE_URL}/favorite-lists`);
}
export async function createFavoriteList(name, pokemonIds, trainerPassword) {
    if (!name || !Array.isArray(pokemonIds) || pokemonIds.length === 0) throw new Error("Nome e IDs de Pokémon são necessários.");
    if (!trainerPassword) throw new Error("Senha do treinador é obrigatória para criar a lista.");

    return await fetchData(`${API_BASE_URL}/favorite-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pokemonIds, trainer_password: trainerPassword }),
    });
}
export async function fetchListDetails(listId) {
    if (!listId) throw new Error("ID da lista é obrigatório.");
    return await fetchData(`${API_BASE_URL}/favorite-lists/${listId}`);
}
export async function updateFavoriteList(listId, updateData, trainerPassword) {
     if (!listId) throw new Error("ID da lista é obrigatório.");
     if (!updateData || (!updateData.name && !updateData.pokemonIds)) throw new Error("Dados para atualização são necessários.");
     if (updateData.pokemonIds && !Array.isArray(updateData.pokemonIds)) throw new Error("pokemonIds deve ser um array.");
     if (!trainerPassword) throw new Error("Senha do treinador é obrigatória para editar a lista.");

    return await fetchData(`${API_BASE_URL}/favorite-lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updateData, trainer_password: trainerPassword }),
    });
}
export async function deleteFavoriteList(listId, credentials) {
    if (!listId) throw new Error("ID da lista é obrigatório.");
    if (!credentials || (!credentials.trainer_password && !credentials.admin_password)) throw new Error("Senha do treinador ou admin é obrigatória para deletar.");

    return await fetchData(`${API_BASE_URL}/favorite-lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
}
export async function borrowFavoriteList(listId, trainerPassword, comment) {
    if (!listId || !trainerPassword) {
        throw new Error("ID da lista e senha do treinador são obrigatórios.");
    }
    return await fetchData(`${API_BASE_URL}/favorite-lists/${listId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_password: trainerPassword, comment: comment || null }),
    });
}