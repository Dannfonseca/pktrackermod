// TODOLISTPOKEMON/js/domElements.js
/**
 * Centraliza e exporta referências para elementos do DOM frequentemente
 * utilizados pela aplicação. Isso evita múltiplas chamadas a
 * `document.getElementById` ou `document.querySelector` pelo código,
 * tornando o acesso aos elementos mais fácil e a manutenção mais simples.
 *
 * Objeto Exportado:
 * - dom: Contém referências diretas aos elementos HTML identificados por seus IDs ou seletores CSS.
 */
export const dom = {

    menuToggle: document.getElementById('menuToggle'),
    logo: document.querySelector('.logo'),
    historyButton: document.getElementById('historyButton'),


    sidebar: document.getElementById('sidebar'),
    closeMenu: document.getElementById('closeMenu'),
    menuOverlay: document.getElementById('menuOverlay'),
    clanButtons: document.querySelectorAll('.clan-button'),


    homeSection: document.getElementById('home-section'),
    clanSection: document.getElementById('clan-section'),


    exploreButton: document.getElementById('exploreButton'),
    viewActiveButton: document.getElementById('viewActiveButton'),
    clanCards: document.querySelectorAll('.clan-card'),
    activePokemonsList: document.getElementById('activePokemonsList'),


    clanHeader: document.querySelector('.clan-header'),
    clanTitle: document.getElementById('clan-title'),
    clanElementsTag: document.getElementById('clan-elements'),
    backToHome: document.getElementById('backToHome'),
    selectEntireBagButton: document.getElementById('selectEntireBag'),
    pokemonSelectionContainer: document.getElementById('pokemon-selection'),
    emptyClanMessage: document.getElementById('empty-clan'),
    trainerNameInput: document.getElementById('trainerName'),
    confirmSelectionButton: document.getElementById('confirmSelection'),


    errorModal: document.getElementById('errorModal'),
    addPokemonModal: document.getElementById('addPokemonModal'),
    addPokemonForm: document.getElementById('addPokemonForm'),
    newPokemonNameInput: document.getElementById('newPokemonName'),
    newPokemonItemInput: document.getElementById('newPokemonItem'),
    clanSelectInput: document.getElementById('clanSelect'),
    partialReturnModal: document.getElementById('partialReturnModal'),
    partialReturnListContainer: document.getElementById('partialReturnList'),
    confirmPartialReturnButton: document.getElementById('confirmPartialReturn'),
    historyModal: document.getElementById('historyModal'),
    historyListContainer: document.getElementById('historyList'),
    historySearchInput: document.getElementById('historySearch'),
    historyFilterSelect: document.getElementById('historyFilter'),
    deleteAllHistoryButton: document.getElementById('delete-all-history-button'),


    addPokemonButton: document.getElementById('addPokemonButton'),
    loadingSpinner: document.getElementById('loadingSpinner'),
};