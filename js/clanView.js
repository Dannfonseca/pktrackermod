// TODOLISTPOKEMON/js/clanView.js
/**
 * Gerencia a lógica e a renderização da visualização de um clã específico.
 * Responsável por buscar os Pokémons do clã via API, exibi-los, permitir
 * a seleção individual ou total, lidar com a confirmação do empréstimo
 * (enviando a SENHA do treinador e um COMENTÁRIO opcional para a API de histórico)
 * e permitir a exclusão de Pokémons (com senha de admin).
 *
 * Funções Principais:
 * - loadClanView: Carrega e renderiza a view do clã (título, lista de Pokémons).
 * - renderPokemonList: Cria os elementos HTML para cada Pokémon na lista.
 * - handleTogglePokemonSelection: Adiciona/remove um Pokémon da seleção atual.
 * - handleSelectEntireBag: Seleciona/deseleciona todos os Pokémons disponíveis.
 * - updateSelectEntireBagButton: Atualiza o texto/estado do botão "Adicionar Tudo".
 * - handleConfirmSelection: Valida a seleção, a SENHA do treinador e o COMENTÁRIO (opcional), e envia para a API.
 * - handleDeletePokemon: Pede senha de admin e confirmação para deletar um Pokémon via API.
 */

import { dom } from './domElements.js';
import { getState, addSelectedPokemon, removeSelectedPokemon, clearSelectedPokemons, setIsDeletingPokemon, setSelectedPokemons, setCurrentClan } from './state.js';
import { fetchClanPokemons, postHistory, deletePokemonAPI } from './api.js';
import { updateClanStyles, displayError, displaySuccess } from './ui.js';
import { switchView } from './app.js';

const LOCAL_ADMIN_PASSWORD_FOR_CHECK = 'raito123';

export async function loadClanView(clanName) {
    setCurrentClan(clanName);
    updateClanStyles(clanName);

    try {
        if(dom.trainerPasswordInput) dom.trainerPasswordInput.value = '';
        if(dom.borrowCommentInput) dom.borrowCommentInput.value = ''; // <<< NOVO: Limpa comentário ao carregar
        const pokemons = await fetchClanPokemons(clanName);
        renderPokemonList(pokemons);
    } catch (error) {
        renderPokemonList([]);
    }
}


function renderPokemonList(pokemons) {
    if (!dom.pokemonSelectionContainer || !dom.emptyClanMessage || !dom.selectEntireBagButton) {
         console.error("Elementos essenciais da Clan View não encontrados no DOM (pokemonSelectionContainer, emptyClanMessage, selectEntireBagButton).");
         return;
    }

    dom.pokemonSelectionContainer.innerHTML = '';

    if (!pokemons || pokemons.length === 0) {
        dom.pokemonSelectionContainer.classList.add('hidden');
        dom.emptyClanMessage.classList.remove('hidden');
        dom.selectEntireBagButton.disabled = true;
    } else {
        dom.pokemonSelectionContainer.classList.remove('hidden');
        dom.emptyClanMessage.classList.add('hidden');
        dom.selectEntireBagButton.disabled = false;

        pokemons.forEach(pokemon => {
            const div = document.createElement('div');
            div.className = 'pokemon-item';
            div.dataset.pokemonId = pokemon.id;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'pokemon-name';
            nameDiv.textContent = pokemon.name + (pokemon.held_item ? ` (${pokemon.held_item})` : '');
            div.appendChild(nameDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'pokemon-actions';

            const selectButton = document.createElement('button');
            selectButton.className = 'select-button';
            selectButton.dataset.action = 'toggle-select';

            const isSelectedGlobally = getState().selectedPokemons[pokemon.id];

            if (pokemon.status !== 'available') {
                div.classList.add('unavailable');
                selectButton.disabled = true;
                selectButton.classList.add('unavailable');
                selectButton.textContent = 'X';
                const statusDiv = document.createElement('div');
                statusDiv.className = 'pokemon-status';
                statusDiv.textContent = `Em uso`;
                nameDiv.appendChild(statusDiv);
            } else {
                selectButton.textContent = isSelectedGlobally ? '✓' : '+';
                if (isSelectedGlobally) {
                    div.classList.add('selected');
                    selectButton.classList.add('selected');
                }
            }

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '-';
            deleteButton.dataset.action = 'delete-pokemon';
            deleteButton.title = 'Deletar este Pokémon (Admin)';

            actionsDiv.appendChild(selectButton);
            actionsDiv.appendChild(deleteButton);
            div.appendChild(actionsDiv);

            dom.pokemonSelectionContainer.appendChild(div);
        });
        updateSelectEntireBagButton(pokemons);
    }
}


export function handleTogglePokemonSelection(button) {
    const pokemonItem = button.closest('.pokemon-item');
    if (!pokemonItem || pokemonItem.classList.contains('unavailable')) return;

    const pokemonId = pokemonItem.dataset.pokemonId;
    const isSelected = getState().selectedPokemons[pokemonId];

    if (isSelected) {
        removeSelectedPokemon(pokemonId);
        pokemonItem.classList.remove('selected');
        button.classList.remove('selected');
        button.textContent = '+';
    } else {
        addSelectedPokemon(pokemonId);
        pokemonItem.classList.add('selected');
        button.classList.add('selected');
        button.textContent = '✓';
    }

    const pokemonItems = dom.pokemonSelectionContainer ? dom.pokemonSelectionContainer.querySelectorAll('.pokemon-item') : [];
     const currentClanPokemons = Array.from(pokemonItems).map(item => ({
         id: item.dataset.pokemonId,
         status: item.classList.contains('unavailable') ? 'borrowed' : 'available'
     }));
    updateSelectEntireBagButton(currentClanPokemons);
}


export async function handleSelectEntireBag() {
    const currentClan = getState().currentClan;
    if (!currentClan || currentClan === 'home' || !dom.pokemonSelectionContainer) return;

    try {
        const pokemons = await fetchClanPokemons(currentClan);
        const availablePokemons = pokemons.filter(p => p.status === 'available');

        if (availablePokemons.length === 0) {
            displayError('Nenhum Pokémon disponível neste clã para selecionar.');
            return;
        }

        const currentSelection = getState().selectedPokemons;
        const availableIdsInCurrentClan = availablePokemons.map(p => p.id);
        const allAvailableInClanSelected = availableIdsInCurrentClan.every(id => currentSelection[id]);

        let newSelection = { ...currentSelection };

        if (allAvailableInClanSelected) {
            availableIdsInCurrentClan.forEach(id => {
                delete newSelection[id];
            });
            console.log(`Removendo ${availableIdsInCurrentClan.length} pokemons do clã ${currentClan} da seleção.`);
        } else {
            availableIdsInCurrentClan.forEach(id => {
                newSelection[id] = true;
            });
             console.log(`Adicionando ${availableIdsInCurrentClan.length} pokemons do clã ${currentClan} à seleção.`);
        }

        setSelectedPokemons(newSelection);
        renderPokemonList(pokemons);

    } catch (error) {
        console.error("Erro ao selecionar/deselecionar toda a bag:", error);
    }
}


function updateSelectEntireBagButton(pokemons) {
     if(!dom.selectEntireBagButton) return;

    const availablePokemons = pokemons.filter(p => p.status === 'available');
    if (availablePokemons.length === 0) {
        dom.selectEntireBagButton.textContent = 'Adicionar Tudo';
        dom.selectEntireBagButton.classList.remove('remove-all');
        dom.selectEntireBagButton.disabled = true;
        return;
    }
    dom.selectEntireBagButton.disabled = false;

    const currentSelection = getState().selectedPokemons;
    const availableIdsInCurrentClan = availablePokemons.map(p => p.id);
    const allAvailableInClanSelected = availableIdsInCurrentClan.every(id => currentSelection[id]);

    if (allAvailableInClanSelected) {
        dom.selectEntireBagButton.textContent = 'Retirar Tudo';
        dom.selectEntireBagButton.classList.add('remove-all');
    } else {
        dom.selectEntireBagButton.textContent = 'Adicionar Tudo';
        dom.selectEntireBagButton.classList.remove('remove-all');
    }
}


export async function handleConfirmSelection() {
     // <<< NOVO: Inclui verificação do borrowCommentInput >>>
     if(!dom.trainerPasswordInput || !dom.confirmSelectionButton || !dom.borrowCommentInput) {
         console.error("Input de senha, botão de confirmação ou input de comentário não encontrado!");
         return;
     }

    const trainerPassword = dom.trainerPasswordInput.value.trim();
    const comment = dom.borrowCommentInput.value.trim(); // <<< NOVO: Pega o valor do comentário
    const selectedIds = Object.keys(getState().selectedPokemons);

    if (!trainerPassword) {
        displayError("Por favor, insira sua senha de treinador.");
        dom.trainerPasswordInput.focus();
        return;
    }

    if (selectedIds.length === 0) {
        displayError("Nenhum Pokémon selecionado.");
        return;
    }

    const confirmButton = dom.confirmSelectionButton;
    confirmButton.disabled = true;

    try {
        // <<< NOVO: Passa o comentário para a função postHistory >>>
        const result = await postHistory(trainerPassword, selectedIds, comment);
        displaySuccess(result.message || `${selectedIds.length} Pokémon(s) registrado(s) com sucesso!`);

        clearSelectedPokemons();
        dom.trainerPasswordInput.value = '';
        dom.borrowCommentInput.value = ''; // <<< NOVO: Limpa o campo de comentário
        switchView('home');

    } catch (error) {
        console.error("Erro ao confirmar seleção:", error);
         if (error.message && error.message.toLowerCase().includes('senha do treinador inválida')) {
             displayError('Senha do treinador inválida. Tente novamente.');
              dom.trainerPasswordInput.focus();
         } else if (error.message && error.message.toLowerCase().includes('disponível')) {
             displayError(`Um ou mais Pokémons selecionados não estão mais disponíveis: ${error.message}. Recarregando a lista...`);
              loadClanView(getState().currentClan);
         }
    } finally {
        confirmButton.disabled = false;
    }
}


export async function handleDeletePokemon(button) {
    const pokemonItem = button.closest('.pokemon-item');
    if (!pokemonItem || getState().isDeletingPokemon) return;

    const pokemonId = pokemonItem.dataset.pokemonId;
    const pokemonNameElement = pokemonItem.querySelector('.pokemon-name');
    const pokemonName = pokemonNameElement ? pokemonNameElement.textContent.split('(')[0].trim() : pokemonId;

    const password = prompt(`[ADMIN] Digite a senha para deletar PERMANENTEMENTE o Pokémon "${pokemonName}":`);
    if (password === null) return;

    if (password !== LOCAL_ADMIN_PASSWORD_FOR_CHECK) {
           displayError('Senha de administrador incorreta!');
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar PERMANENTEMENTE o Pokémon "${pokemonName}" (${pokemonId})? Esta ação não pode ser desfeita.`)) {
        return;
    }

    setIsDeletingPokemon(true);
    const deleteButton = button;
    deleteButton.disabled = true;

    try {
        const result = await deletePokemonAPI(pokemonId);
        displaySuccess(result.message || 'Pokémon deletado com sucesso!');
        pokemonItem.remove();
         if(dom.pokemonSelectionContainer) {
            loadClanView(getState().currentClan);
         }

    } catch (error) {
        console.error(`Erro ao deletar Pokémon ${pokemonId}:`, error);
         if (error.message && error.message.toLowerCase().includes('emprestado')) {
             displayError('Não é possível deletar um Pokémon que está emprestado.');
         }
         deleteButton.disabled = false;
    } finally {
        setIsDeletingPokemon(false);
    }
}