// js/state.js
// Objeto que mantém o estado mutável da aplicação.
export const state = {
    currentClan: 'home',
    selectedPokemons: {}, // { pokemonId: true }
    partialReturnSelection: {}, // { historyId: true }
    currentLoanGroupData: null, // { trainer, date, pokemons: [{id, name}] } // Stores history ID and name
    isDeletingPokemon: false,
};