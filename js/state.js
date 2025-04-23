// TODOLISTPOKEMON/js/state.js
/**
 * Gerencia o estado mutável da aplicação frontend.
 * Mantém informações como o clã atualmente visualizado, os Pokémons
 * selecionados para empréstimo na Clan View, a seleção de Pokémons
 * nos modais de lista, informações para devolução parcial, etc.
 * Exporta funções para acessar (getState) e modificar (setters) o estado.
 *
 * Estado Gerenciado:
 * - currentClan: String ('home' ou nome do clã ativo).
 * - selectedPokemons: Objeto { pokemonId: true } para Pokémons selecionados na Clan View.
 * - modalPokemonSelection: Objeto { pokemonId: true } para Pokémons selecionados nos modais de Criar/Editar Lista.
 * - activeHistoryGroupIndex: Number | null - Índice do grupo ativo selecionado para devolução.
 * - partialReturnSelection: Objeto { pokemonName: true } para Pokémons selecionados no modal de devolução parcial.
 * - isDeletingPokemon: Boolean - Flag para controle de concorrência na deleção.
 */


let currentState = {
    currentClan: 'home',
    selectedPokemons: {}, // Seleção principal (Clan View)
    modalPokemonSelection: {}, // <<< NOVO: Seleção específica dos modais de lista >>>
    activeHistoryGroupIndex: null,
    partialReturnSelection: {},
    isDeletingPokemon: false,
};


export function getState() {
    // Retorna uma cópia para evitar mutação externa direta, se necessário,
    // mas para objetos aninhados, isso ainda permitiria mutação.
    // Para este caso, retornar a referência direta é mais simples.
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
// <<< NOVAS FUNÇÕES >>>
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
// <<< FIM DAS NOVAS FUNÇÕES >>>


// --- Devolução Parcial ---
export function setActiveHistoryGroupIndex(index) {
    currentState.activeHistoryGroupIndex = index;
}

export function setPartialReturnSelection(selection) {
    currentState.partialReturnSelection = selection;
}

export function togglePartialReturnSelection(pokemonName) {
    if (currentState.partialReturnSelection[pokemonName]) {
        delete currentState.partialReturnSelection[pokemonName];
    } else {
        currentState.partialReturnSelection[pokemonName] = true;
    }
    console.log('Seleção devolução parcial:', currentState.partialReturnSelection);
}

export function clearPartialReturnSelection() {
    currentState.partialReturnSelection = {};
}

// --- Controle de Deleção ---
export function setIsDeletingPokemon(isDeleting) {
    currentState.isDeletingPokemon = isDeleting;
}