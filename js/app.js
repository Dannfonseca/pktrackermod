// TODOLISTPOKEMON/js/app.js
/**
 * Orquestrador principal da aplicação frontend.
 * Responsável por inicializar a aplicação, configurar os event listeners globais
 * para elementos da UI (menu, botões, modais, etc.) e gerenciar a troca entre
 * as visualizações (home, clãs, listas favoritas).
 * Inclui funcionalidade de alternância de tema (dark/light) e modal de gerenciamento de treinadores.
 * Conecta os botões da seção de Listas Favoritas aos seus respectivos modais.
 * Adicionado listener para o checkbox "Selecionar Todos" no modal de devolução parcial.
 */
import { dom } from './domElements.js';
import { getState, setCurrentClan, clearSelectedPokemons } from './state.js';
import { updateClanStyles, toggleSidebar, closeSidebar, checkScreenSize, displayError } from './ui.js';
import { loadClanView, handleTogglePokemonSelection, handleSelectEntireBag, handleConfirmSelection, handleDeletePokemon } from './clanView.js';
import { loadHomeView, renderActivePokemons, handleOpenReturnModal } from './homeView.js';
import { openHistoryModal, closeHistoryModal, filterAndRenderHistory, handleDeleteHistoryGroup, handleDeleteAllHistory, clearHistoryCache } from './history.js';
import {
    openAddPokemonModal, closeAddPokemonModal, handleAddPokemonFormSubmit,
    openPartialReturnModal, closePartialReturnModal, handleTogglePartialReturn, handleConfirmPartialReturn, handleSelectAllPartialReturn,
    openAddTrainerModal, closeAddTrainerModal, handleAddTrainerFormSubmit,
    openManageTrainersModal, closeManageTrainersModal, handleDeleteTrainer,
    openCreateListModal, closeCreateListModal, handleCreateListPokemonSearch, handleCreateListSubmit,
    openViewEditListModal, closeViewEditListModal, handleEditListPokemonSearch, handleUpdateListSubmit,
    openBorrowListModal, closeBorrowListModal, handleConfirmBorrowList, handleDeleteListClick
} from './modals.js';
import { loadFavoritesView } from './favoriteView.js';

// --- Ícones SVG para o botão de tema ---
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`;


// --- Lógica de Troca de Tema ---
function applyTheme(theme) {
    if (!dom.body) { console.error("Elemento body não encontrado."); return; }
    if (theme === 'dark') {
        dom.body.classList.add('dark-mode');
        if (dom.themeToggleButton) dom.themeToggleButton.innerHTML = sunIcon;
        localStorage.setItem('theme', 'dark');
    } else {
        dom.body.classList.remove('dark-mode');
        if (dom.themeToggleButton) dom.themeToggleButton.innerHTML = moonIcon;
        localStorage.setItem('theme', 'light');
    }
}
function toggleTheme() {
    if (!dom.body) return;
    applyTheme(dom.body.classList.contains('dark-mode') ? 'light' : 'dark');
}
function initializeTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) applyTheme(savedTheme);
    else applyTheme(prefersDark ? 'dark' : 'light');
}
// --- Fim Lógica de Troca de Tema ---


// Controla a troca de visualização (Home vs Clã vs Favoritos)
export function switchView(viewName) {
    console.log(`Mudando para view: ${viewName}`);
    const isHome = viewName === 'home';
    const isFavorites = viewName === 'favorites';
    const isClan = !isHome && !isFavorites;

    if (isClan) setCurrentClan(viewName);
    else setCurrentClan('home');

    try {
        if (dom.homeSection) dom.homeSection.classList.toggle('hidden', !isHome);
        if (dom.clanSection) dom.clanSection.classList.toggle('hidden', !isClan);
        if (dom.favoritesSection) dom.favoritesSection.classList.toggle('hidden', !isFavorites);
    } catch (e) {
        console.error("Erro ao alternar visibilidade das seções:", e);
        displayError("Erro ao carregar a interface."); return;
    }

    updateClanStyles(isClan ? viewName : 'home');

    if (isClan) {
        loadClanView(viewName).catch(error => { console.error(`Erro ao carregar clã ${viewName}:`, error); switchView('home'); });
    } else if (isFavorites) {
        loadFavoritesView().catch(error => { console.error("Erro ao carregar favoritos:", error); switchView('home'); });
    } else { // isHome
        loadHomeView().catch(error => { console.error("Erro ao carregar home:", error); });
    }

    if (window.innerWidth < 768) closeSidebar();
    window.scrollTo(0, 0);
}


function setupEventListeners() {
    console.log("Configurando event listeners...");

    // --- Header ---
    if (dom.menuToggle) dom.menuToggle.addEventListener('click', toggleSidebar);
    if (dom.logo) dom.logo.addEventListener('click', () => switchView('home'));
    if (dom.historyButton) dom.historyButton.addEventListener('click', openHistoryModal);
    if (dom.manageTrainersButton) dom.manageTrainersButton.addEventListener('click', openManageTrainersModal);
    if (dom.favoritesButton) dom.favoritesButton.addEventListener('click', () => switchView('favorites'));
    if (dom.themeToggleButton) dom.themeToggleButton.addEventListener('click', toggleTheme);


    // --- Sidebar ---
    if (dom.closeMenu) dom.closeMenu.addEventListener('click', closeSidebar);
    if (dom.menuOverlay) dom.menuOverlay.addEventListener('click', closeSidebar);
    if (dom.clanButtons) {
        dom.clanButtons.forEach(button => {
            if (button) {
                const viewTarget = button.dataset.clan || 'home';
                if (button.dataset.view !== 'favorites') {
                     button.addEventListener('click', () => switchView(viewTarget));
                }
            }
        });
    } else { console.error("Elementos DOM 'clanButtons' não encontrados!"); }

    // --- Home View ---
    if (dom.exploreButton) {
        dom.exploreButton.addEventListener('click', () => {
            if (window.innerWidth < 768) toggleSidebar();
            else {
                const firstClanButton = document.querySelector('.sidebar-nav .clan-button:not([data-clan="home"])');
                switchView(firstClanButton ? firstClanButton.dataset.clan : 'malefic');
            }
        });
    }
    if (dom.viewActiveButton && dom.activePokemonsList) dom.viewActiveButton.addEventListener('click', () => dom.activePokemonsList.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    if (dom.clanCards) dom.clanCards.forEach(card => { if(card) card.addEventListener('click', () => switchView(card.dataset.clan)); });
    if(dom.activePokemonsList) dom.activePokemonsList.addEventListener('click', (event) => { const btn = event.target.closest('.return-button[data-action="open-return-modal"]'); if (btn) handleOpenReturnModal(btn); });
    else console.error("Container 'activePokemonsList' não encontrado.");

    // --- Clan View ---
    if(dom.backToHome) dom.backToHome.addEventListener('click', () => switchView('home'));
    if(dom.selectEntireBagButton) dom.selectEntireBagButton.addEventListener('click', handleSelectEntireBag);
    if(dom.confirmSelectionButton) dom.confirmSelectionButton.addEventListener('click', handleConfirmSelection);
     if(dom.pokemonSelectionContainer) {
        dom.pokemonSelectionContainer.addEventListener('click', (event) => {
            const selectBtn = event.target.closest('.select-button[data-action="toggle-select"]');
            const deleteBtn = event.target.closest('.delete-button[data-action="delete-pokemon"]');
            if (selectBtn) handleTogglePokemonSelection(selectBtn);
            else if (deleteBtn) handleDeletePokemon(deleteBtn);
        });
     } else console.error("Container 'pokemonSelectionContainer' não encontrado.");

    // --- Favorites View ---
    if (dom.addNewListButton) {
        dom.addNewListButton.addEventListener('click', openCreateListModal);
    } else console.error("Botão 'addNewListButton' não encontrado.");

    if (dom.favoriteListsContainer) {
        dom.favoriteListsContainer.addEventListener('click', (event) => {
            const viewEditButton = event.target.closest('.view-edit-button');
            const borrowButton = event.target.closest('.borrow-list-button');
            const deleteButton = event.target.closest('.delete-list-button');
            const listItem = event.target.closest('.favorite-list-item');

            if (!listItem) return;
            const listId = listItem.dataset.listId;
            const listName = listItem.querySelector('h3')?.textContent || 'Lista';

            if (!listId) { console.error("ID da lista não encontrado no item:", listItem); return; }

            if (viewEditButton) {
                openViewEditListModal(listId);
            } else if (borrowButton) {
                 openBorrowListModal(listId, listName);
            } else if (deleteButton) {
                 handleDeleteListClick(listId, listName);
            }
        });
    } else console.error("Container 'favoriteListsContainer' não encontrado.");


    // --- Botão Flutuante Adicionar Pokémon ---
    if(dom.addPokemonButton) dom.addPokemonButton.addEventListener('click', openAddPokemonModal);

    // --- Modais Comuns (Listeners de fechar/cancelar) ---
    const setupModalCloseListeners = (modalElement) => {
        if(!modalElement) return;
        const closeBtn = modalElement.querySelector('.modal-header .close-button');
        const overlay = modalElement.querySelector('.modal-overlay');
        const cancelBtn = modalElement.querySelector('.modal-footer .secondary-button');

        const closeFunc = () => {
            switch(modalElement.id) {
                case 'addPokemonModal': closeAddPokemonModal(); break;
                case 'addTrainerModal': closeAddTrainerModal(); break;
                case 'manageTrainersModal': closeManageTrainersModal(); break;
                case 'partialReturnModal': closePartialReturnModal(); break;
                case 'historyModal': closeHistoryModal(); break;
                case 'createListModal': closeCreateListModal(); break;
                case 'viewEditListModal': closeViewEditListModal(); break;
                case 'borrowListModal': closeBorrowListModal(); break;
                default: if(modalElement) modalElement.style.display = 'none';
            }
        };

        if(closeBtn) closeBtn.addEventListener('click', closeFunc);
        if(overlay) overlay.addEventListener('click', closeFunc);
        if(cancelBtn) cancelBtn.addEventListener('click', closeFunc);
    };

    [
        dom.addPokemonModal, dom.addTrainerModal, dom.manageTrainersModal,
        dom.partialReturnModal, dom.historyModal, dom.createListModal,
        dom.viewEditListModal, dom.borrowListModal
    ].forEach(setupModalCloseListeners);

    // --- Listeners Específicos de Forms/Ações em Modais ---
    if(dom.addPokemonForm) dom.addPokemonForm.addEventListener('submit', handleAddPokemonFormSubmit);
    if(dom.addTrainerForm) dom.addTrainerForm.addEventListener('submit', handleAddTrainerFormSubmit);
    if(dom.confirmPartialReturnButton) dom.confirmPartialReturnButton.addEventListener('click', handleConfirmPartialReturn);
    // <<< MODIFICADO: Delegação de eventos para o container da lista >>>
    if(dom.partialReturnListContainer) {
        dom.partialReturnListContainer.addEventListener('change', (e) => {
            if (e.target.matches('.partial-return-checkbox[data-action="toggle-partial-return"]')) {
                 handleTogglePartialReturn(e.target);
            }
        });
    }
    // <<< Listener para o checkbox "Selecionar Todos" adicionado aqui >>>
    const selectAllPartialCheckbox = document.getElementById('selectAllPartialReturn');
    if(selectAllPartialCheckbox) {
        selectAllPartialCheckbox.addEventListener('change', handleSelectAllPartialReturn);
    } else {
        console.warn("Checkbox #selectAllPartialReturn não encontrado para adicionar listener.");
    }

    if(dom.historySearchInput) dom.historySearchInput.addEventListener('input', filterAndRenderHistory);
    if(dom.historyFilterSelect) dom.historyFilterSelect.addEventListener('change', filterAndRenderHistory);
    if(dom.deleteAllHistoryButton) dom.deleteAllHistoryButton.addEventListener('click', handleDeleteAllHistory);
    if(dom.historyListContainer) dom.historyListContainer.addEventListener('click', (e) => { const btn = e.target.closest('.delete-button[data-action="delete-history-group"]'); if(btn) handleDeleteHistoryGroup(btn); });
    if(dom.openAddTrainerModalButton) dom.openAddTrainerModalButton.addEventListener('click', openAddTrainerModal);
    if(dom.trainerListContainer) dom.trainerListContainer.addEventListener('click', (e) => { const btn = e.target.closest('.delete-button.small-delete-button'); if(btn) handleDeleteTrainer(btn); });

    if(dom.createListForm) dom.createListForm.addEventListener('submit', handleCreateListSubmit);
    if(dom.createListPokemonSearch) dom.createListPokemonSearch.addEventListener('input', handleCreateListPokemonSearch);
    if(dom.createListPokemonSelection) dom.createListPokemonSelection.addEventListener('change', (e) => { if(e.target.matches('input[type="checkbox"]')) {/* Ação opcional */} });

    if(dom.editListForm) dom.editListForm.addEventListener('submit', handleUpdateListSubmit);
    if(dom.editListPokemonSearch) dom.editListPokemonSearch.addEventListener('input', handleEditListPokemonSearch);
    if(dom.editListPokemonSelection) dom.editListPokemonSelection.addEventListener('change', (e) => { if(e.target.matches('input[type="checkbox"]')) {/* Ação opcional */} });

    if(dom.confirmBorrowListButton) dom.confirmBorrowListButton.addEventListener('click', handleConfirmBorrowList);

    // --- Outros Listeners Globais ---
    window.addEventListener('resize', checkScreenSize);

    console.log("Event listeners configurados.");
}


// Inicialização
function initializeApp() {
    console.log("Inicializando aplicação...");
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInitialization);
    } else {
        runInitialization();
    }
}

function runInitialization() {
    console.log("DOM carregado, executando inicialização...");
    initializeTheme();
    setupEventListeners();
    checkScreenSize();
    switchView('home');
    console.log("Aplicação inicializada.");
}

initializeApp();