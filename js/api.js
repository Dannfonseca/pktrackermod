// TODOLISTPOKEMON/js/api.js
/**
 * Funções para interagir com a API do backend (definida em config.js).
 * Encapsula as chamadas fetch, tratando erros básicos e controlando
 * a exibição do spinner de carregamento (showSpinner, hideSpinner de ui.js).
 * Inclui função para adicionar treinadores e modifica postHistory para usar senha e comentário.
 *
 * Funções Principais:
 * - fetchData: Helper genérico para requisições fetch.
 * - addTrainerAPI: Adiciona um novo treinador (requer senha admin).
 * - fetchClanPokemons: Busca Pokémons de um clã.
 * - fetchAllHistory: Busca todo o histórico (com nome do treinador e comentário).
 * - fetchActiveHistory: Busca histórico ativo (empréstimos não devolvidos, com nome do treinador e comentário).
 * - postHistory: Registra um novo empréstimo validando a senha do treinador e incluindo um comentário opcional.
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

export async function addTrainerAPI(name, email, password, adminPassword) {
    if (!name || !email || !password || !adminPassword) {
        throw new Error("Nome, email, senha do treinador e senha do admin são obrigatórios.");
    }
    return await fetchData(`${API_BASE_URL}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            admin_password: adminPassword
        }),
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
    // Backend já retorna trainer_name e comment
    return await fetchData(`${API_BASE_URL}/history`);
}


export async function fetchActiveHistory() {
     // Backend já retorna trainer_name e comment (do primeiro item do grupo)
    return await fetchData(`${API_BASE_URL}/history/active`);
}

// Aceita senha do treinador e comentário opcional
export async function postHistory(trainerPassword, pokemonIds, comment) { // <<< NOVO: Parâmetro comment
     if (!trainerPassword || !pokemonIds || pokemonIds.length === 0) {
        throw new Error("Senha do treinador e Pokémons selecionados são necessários.");
    }
    return await fetchData(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
             trainer_password: trainerPassword,
             pokemons: pokemonIds,
             comment: comment || null // <<< NOVO: Envia comment ou null
        }),
    });
}


export async function returnPokemonAPI(historyEntryId, trainerPassword) {
    if (!trainerPassword) {
        throw new Error("Senha do treinador é necessária para a devolução.");
    }
    return await fetchData(`${API_BASE_URL}/history/${historyEntryId}/return`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ trainer_password: trainerPassword })
   });
}

export async function deleteHistoryEntryAPI(id) {
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
        headers: {
            'Content-Type': 'application/json',
        },
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