// TODOLISTPOKEMON/js/clanView.js
/**
 * Gerencia a lógica e a renderização da visualização de um clã específico.
 * Responsável por buscar os Pokémons do clã via API, exibi-los, permitir
 * a seleção individual ou total, lidar com a confirmação do empréstimo
 * (enviando para a API de histórico) e permitir a exclusão de Pokémons (com senha).
 *
 * Funções Principais:
 * - loadClanView: Carrega e renderiza a view do clã (título, lista de Pokémons).
 * - renderPokemonList: Cria os elementos HTML para cada Pokémon na lista.
 * - handleTogglePokemonSelection: Adiciona/remove um Pokémon da seleção atual.
 * - handleSelectEntireBag: Seleciona/deseleciona todos os Pokémons disponíveis.
 * - updateSelectEntireBagButton: Atualiza o texto/estado do botão "Adicionar Tudo".
 * - handleConfirmSelection: Valida a seleção e o nome do treinador, e envia para a API.
 * - handleDeletePokemon: Pede senha e confirmação para deletar um Pokémon via API.
 */
// Arquivo: js/clanView.js

import { dom } from './domElements.js';
import { getState, addSelectedPokemon, removeSelectedPokemon, clearSelectedPokemons, setIsDeletingPokemon, setSelectedPokemons } from './state.js';
import { fetchClanPokemons, postHistory, deletePokemonAPI } from './api.js';
import { updateClanStyles, displayError, displaySuccess } from './ui.js';
import { ADMIN_PASSWORD } from './config.js';
import { switchView } from './app.js';


export async function loadClanView(clanName) {
    updateClanStyles(clanName);

    try {
        const pokemons = await fetchClanPokemons(clanName);
        renderPokemonList(pokemons);
    } catch (error) {

        renderPokemonList([]);
    }
}


function renderPokemonList(pokemons) {
    dom.pokemonSelectionContainer.innerHTML = '';

    if (!pokemons || pokemons.length === 0) {
        dom.pokemonSelectionContainer.classList.add('hidden');
        dom.emptyClanMessage.classList.remove('hidden');
    } else {
        dom.pokemonSelectionContainer.classList.remove('hidden');
        dom.emptyClanMessage.classList.add('hidden');

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

            if (pokemon.status !== 'available') {
                div.classList.add('unavailable');
                selectButton.disabled = true;
                selectButton.classList.add('unavailable');
                selectButton.textContent = 'X';
                 const statusDiv = document.createElement('div');
                 statusDiv.className = 'pokemon-status';
                 statusDiv.textContent = `Em uso`;
                 div.appendChild(statusDiv);

            } else {
                selectButton.textContent = getState().selectedPokemons[pokemon.id] ? '✓' : '+';
                 if (getState().selectedPokemons[pokemon.id]) {
                    div.classList.add('selected');
                    selectButton.classList.add('selected');
                }
            }

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '-';
            deleteButton.dataset.action = 'delete-pokemon';

            actionsDiv.appendChild(selectButton);
            actionsDiv.appendChild(deleteButton);
            div.appendChild(actionsDiv);

            dom.pokemonSelectionContainer.appendChild(div);
        });


        updateSelectEntireBagButton(pokemons);
    }

    dom.trainerNameInput.value = '';
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


    const pokemonItems = dom.pokemonSelectionContainer.querySelectorAll('.pokemon-item:not(.unavailable)');
    const pokemons = Array.from(pokemonItems).map(item => ({ id: item.dataset.pokemonId, status: 'available' }));
    updateSelectEntireBagButton(pokemons);
}


export async function handleSelectEntireBag() {
    const currentClan = getState().currentClan;
    if (!currentClan || currentClan === 'home') return;

    try {

        const pokemons = await fetchClanPokemons(currentClan);
        const availablePokemons = pokemons.filter(p => p.status === 'available');
        if (availablePokemons.length === 0) {
            displayError('Nenhum Pokémon disponível neste clã.');
            return;
        }

        const currentSelection = getState().selectedPokemons;
        const allAvailableSelected = availablePokemons.every(p => currentSelection[p.id]);

        const newSelection = { ...currentSelection };

        if (allAvailableSelected) {

            availablePokemons.forEach(p => {
                delete newSelection[p.id];
            });
            displaySuccess('Todos os Pokémons disponíveis foram removidos da seleção.');
        } else {

            availablePokemons.forEach(p => {
                newSelection[p.id] = true;
            });
            displaySuccess('Todos os Pokémons disponíveis foram adicionados à seleção.');
        }

        setSelectedPokemons(newSelection);
        renderPokemonList(pokemons);

    } catch (error) {

    }
}


function updateSelectEntireBagButton(pokemons) {
    const availablePokemons = pokemons.filter(p => p.status === 'available');
    const currentSelection = getState().selectedPokemons;
    const allAvailableSelected = availablePokemons.length > 0 && availablePokemons.every(p => currentSelection[p.id]);

    if (allAvailableSelected) {
        dom.selectEntireBagButton.textContent = 'Retirar Tudo';
        dom.selectEntireBagButton.classList.add('remove-all');
    } else {
        dom.selectEntireBagButton.textContent = 'Adicionar Tudo';
        dom.selectEntireBagButton.classList.remove('remove-all');
    }

    dom.selectEntireBagButton.disabled = availablePokemons.length === 0;
}



export async function handleConfirmSelection() {
    const trainerName = dom.trainerNameInput.value.trim();
    const selectedIds = Object.keys(getState().selectedPokemons);

    if (!trainerName) {
        displayError("Por favor, insira seu nome.");
        return;
    }

    if (selectedIds.length === 0) {
        displayError("Nenhum Pokémon selecionado.");
        return;
    }

    try {
        await postHistory(trainerName, selectedIds);
        displaySuccess(`${selectedIds.length} Pokémon(s) registrado(s) com sucesso para ${trainerName}!`);

        clearSelectedPokemons();
        dom.trainerNameInput.value = '';
        switchView('home');

    } catch (error) {

    }
}


export async function handleDeletePokemon(button) {
    const pokemonItem = button.closest('.pokemon-item');
    if (!pokemonItem || getState().isDeletingPokemon) return;

    const pokemonId = pokemonItem.dataset.pokemonId;
    const pokemonName = pokemonItem.querySelector('.pokemon-name')?.textContent || pokemonId;

    const password = prompt(`Digite a senha para deletar o Pokémon "${pokemonName}":`);
    if (password !== ADMIN_PASSWORD) {
        if (password !== null) {
           displayError('Senha incorreta!');
        }
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar PERMANENTEMENTE o Pokémon "${pokemonName}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    setIsDeletingPokemon(true);
    try {
        const result = await deletePokemonAPI(pokemonId);
        displaySuccess(result.message || 'Pokémon deletado com sucesso!');

        loadClanView(getState().currentClan);
    } catch (error) {

    } finally {
        setIsDeletingPokemon(false);
    }
}