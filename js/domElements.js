// TODOLISTPOKEMON/js/domElements.js
/**
 * Centraliza e exporta referências para elementos do DOM frequentemente
 * utilizados pela aplicação. Inclui referências para a seção de favoritos e seus modais.
 */
export const dom = {

    // Body
    body: document.body,

    // Header
    menuToggle: document.getElementById('menuToggle'),
    logo: document.querySelector('.logo'),
    favoritesButton: document.getElementById('favoritesButton'),
    manageTrainersButton: document.getElementById('manageTrainersButton'),
    historyButton: document.getElementById('historyButton'),
    themeToggleButton: document.getElementById('themeToggleButton'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    closeMenu: document.getElementById('closeMenu'),
    menuOverlay: document.getElementById('menuOverlay'),
    clanButtons: document.querySelectorAll('.clan-button'),

    // Seções Principais
    homeSection: document.getElementById('home-section'),
    clanSection: document.getElementById('clan-section'),
    favoritesSection: document.getElementById('favorites-section'),

    // Home View
    exploreButton: document.getElementById('exploreButton'),
    viewActiveButton: document.getElementById('viewActiveButton'),
    clanCards: document.querySelectorAll('.clan-card'),
    activePokemonsList: document.getElementById('activePokemonsList'),

    // Clan View
    clanHeader: document.querySelector('.clan-header'),
    clanTitle: document.getElementById('clan-title'),
    clanElementsTag: document.getElementById('clan-elements'),
    backToHome: document.getElementById('backToHome'),
    selectEntireBagButton: document.getElementById('selectEntireBag'),
    pokemonSelectionContainer: document.getElementById('pokemon-selection'),
    emptyClanMessage: document.getElementById('empty-clan'),
    trainerPasswordInput: document.getElementById('trainerPassword'),
    borrowCommentInput: document.getElementById('borrowComment'), // Campo de comentário da Clan View
    confirmSelectionButton: document.getElementById('confirmSelection'),

    // Favorites View
    addNewListButton: document.getElementById('addNewListButton'),
    favoriteListsContainer: document.getElementById('favoriteListsContainer'),

    // Modais Gerais e Botão Flutuante
    errorModal: document.getElementById('errorModal'),
    addPokemonButton: document.getElementById('addPokemonButton'),
    loadingSpinner: document.getElementById('loadingSpinner'),

    // Modal Adicionar Pokémon (Form)
    addPokemonModal: document.getElementById('addPokemonModal'),
    addPokemonForm: document.getElementById('addPokemonForm'),
    newPokemonNameInput: document.getElementById('newPokemonName'),
    newPokemonItemInput: document.getElementById('newPokemonItem'),
    clanSelectInput: document.getElementById('clanSelect'),

    // Modal Adicionar Treinador (Form)
    addTrainerModal: document.getElementById('addTrainerModal'),
    addTrainerForm: document.getElementById('addTrainerForm'),
    newTrainerNameInput: document.getElementById('newTrainerName'),
    newTrainerEmailInput: document.getElementById('newTrainerEmail'),
    newTrainerPasswordInput: document.getElementById('newTrainerPassword'),
    adminPasswordForTrainerInput: document.getElementById('adminPasswordForTrainer'),
    confirmAddTrainerButton: document.getElementById('confirmAddTrainer'),

    // Modal Devolução Parcial
    partialReturnModal: document.getElementById('partialReturnModal'),
    partialReturnListContainer: document.getElementById('partialReturnList'),
    confirmPartialReturnButton: document.getElementById('confirmPartialReturn'),
    partialReturnPasswordInput: document.getElementById('partialReturnPassword'),


    // Modal Histórico
    historyModal: document.getElementById('historyModal'),
    historyListContainer: document.getElementById('historyList'),
    historySearchInput: document.getElementById('historySearch'),
    historyFilterSelect: document.getElementById('historyFilter'),
    deleteAllHistoryButton: document.getElementById('delete-all-history-button'),

    // Modal Gerenciar Treinadores
    manageTrainersModal: document.getElementById('manageTrainersModal'),
    trainerListContainer: document.getElementById('trainerListContainer'),
    openAddTrainerModalButton: document.getElementById('openAddTrainerModalButton'),

    // Modal Criar Lista Favorita
    createListModal: document.getElementById('createListModal'),
    createListForm: document.getElementById('createListForm'),
    newListNameInput: document.getElementById('newListName'),
    createListPokemonSearch: document.getElementById('createListPokemonSearch'),
    createListPokemonSelection: document.getElementById('createListPokemonSelection'),
    confirmCreateListButton: document.getElementById('confirmCreateListButton'),

    // Modal Ver/Editar Lista Favorita
    viewEditListModal: document.getElementById('viewEditListModal'),
    editListForm: document.getElementById('editListForm'),
    editListIdInput: document.getElementById('editListId'),
    editListNameInput: document.getElementById('editListName'),
    editListPokemonSearch: document.getElementById('editListPokemonSearch'),
    editListPokemonSelection: document.getElementById('editListPokemonSelection'),
    confirmEditListButton: document.getElementById('confirmEditListButton'),

    // Modal Usar Lista Favorita
    borrowListModal: document.getElementById('borrowListModal'),
    borrowListModalTitle: document.getElementById('borrowListModalTitle'),
    borrowListIdInput: document.getElementById('borrowListId'),
    borrowListPokemonsPreview: document.getElementById('borrowListPokemonsPreview'),
    borrowListTrainerPasswordInput: document.getElementById('borrowListTrainerPassword'),
    borrowListCommentInput: document.getElementById('borrowListComment'), // Campo de comentário do Modal Borrow List
    confirmBorrowListButton: document.getElementById('confirmBorrowListButton'),
};