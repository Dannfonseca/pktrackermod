// TODOLISTPOKEMON/js/state.js
/**
 * Gerencia o estado mutável da aplicação frontend.
 * Mantém informações como o clã atualmente visualizado, os Pokémons
 * selecionados para empréstimo na Clan View, a seleção de Pokémons
 * nos modais de lista, informações para devolução parcial (agora por history_id),
 * a página atual do histórico, etc.
 * Exporta funções para acessar (getState) e modificar (setters) o estado.
 *
 * Estado Gerenciado:
 * - currentClan: String ('home' ou nome do clã ativo).
 * - selectedPokemons: Objeto { pokemonId: true } para Pokémons selecionados na Clan View.
 * - modalPokemonSelection: Objeto { pokemonId: true } para Pokémons selecionados nos modais de Criar/Editar Lista.
 * - activeHistoryGroupIndex: Number | null - Índice do grupo ativo selecionado para devolução.
 * - partialReturnSelection: Objeto { historyEntryId: true } para registros selecionados no modal de devolução parcial.
 * - historyCurrentPage: Number - Página atual exibida no modal de histórico. <<< NOVO >>>
 * - isDeletingPokemon: Boolean - Flag para controle de concorrência na deleção.
 */


let currentState = {
    currentClan: 'home',
    selectedPokemons: {},
    modalPokemonSelection: {},
    activeHistoryGroupIndex: null,
    partialReturnSelection: {},
    historyCurrentPage: 1, // <<< NOVO: Página inicial do histórico >>>
    isDeletingPokemon: false,
};


export function getState() {
    return currentState;
}

// --- Seleção Principal (Clan View) ---
export function setCurrentClan(clan) {
    currentState.currentClan = clan;
    console.log('Clã atual:', currentState.currentClan);
}

export function setSelectedPokemons(selection) {
    currentState.selectedPokemons = selection;
    console.log('Pokémons selecionados (Clan View):', currentState.selectedPokemons);
}

export function addSelectedPokemon(pokemonId) {
    currentState.selectedPokemons[pokemonId] = true;
    console.log('Pokémons selecionados (Clan View):', currentState.selectedPokemons);
}

export function removeSelectedPokemon(pokemonId) {
    delete currentState.selectedPokemons[pokemonId];
    console.log('Pokémons selecionados (Clan View):', currentState.selectedPokemons);
}

export function clearSelectedPokemons() {
    currentState.selectedPokemons = {};
    console.log('Seleção (Clan View) limpa.');
}

// --- Seleção dos Modais de Lista (Criar/Editar) ---
export function setModalPokemonSelection(selection) {
    currentState.modalPokemonSelection = selection;
    console.log('Pokémons selecionados (Modal):', currentState.modalPokemonSelection);
}

export function addModalPokemonSelection(pokemonId) {
    currentState.modalPokemonSelection[pokemonId] = true;
    console.log('Pokémons selecionados (Modal):', currentState.modalPokemonSelection);
}

export function removeModalPokemonSelection(pokemonId) {
    delete currentState.modalPokemonSelection[pokemonId];
    console.log('Pokémons selecionados (Modal):', currentState.modalPokemonSelection);
}

export function clearModalPokemonSelection() {
    currentState.modalPokemonSelection = {};
    console.log('Seleção (Modal) limpa.');
}


// --- Devolução Parcial ---
export function setActiveHistoryGroupIndex(index) {
    currentState.activeHistoryGroupIndex = index;
}

export function setPartialReturnSelection(selection) {
    currentState.partialReturnSelection = selection;
    console.log('Seleção devolução parcial (History IDs):', currentState.partialReturnSelection);
}

export function togglePartialReturnSelection(historyEntryId) {
    if (currentState.partialReturnSelection[historyEntryId]) {
        delete currentState.partialReturnSelection[historyEntryId];
    } else {
        currentState.partialReturnSelection[historyEntryId] = true;
    }
    console.log('Seleção devolução parcial (History IDs):', currentState.partialReturnSelection);
}

export function clearPartialReturnSelection() {
    currentState.partialReturnSelection = {};
    console.log('Seleção devolução parcial limpa.');
}

// --- Paginação do Histórico ---
// <<< NOVA FUNÇÃO >>>
export function setHistoryCurrentPage(page) {
    currentState.historyCurrentPage = Math.max(1, page); // Garante que a página seja pelo menos 1
    console.log('Página atual do Histórico:', currentState.historyCurrentPage);
}

// --- Controle de Deleção ---
export function setIsDeletingPokemon(isDeleting) {
    currentState.isDeletingPokemon = isDeleting;
}