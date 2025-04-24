// TODOLISTPOKEMON/js/app.js
/**
 * Orquestrador principal da aplicação frontend.
 * Responsável por inicializar a aplicação, configurar os event listeners globais
 * para elementos da UI (menu, botões, modais, etc.) e gerenciar a troca entre
 * as visualizações (home, clãs, listas favoritas).
 * Inclui funcionalidade de alternância de tema (dark/light) e modal de gerenciamento de treinadores.
 * Conecta os botões da seção de Listas Favoritas aos seus respectivos modais.
 * Adicionado listener para o checkbox "Selecionar Todos" no modal de devolução parcial.
 * Listeners dos checkboxes nos modais de lista (criar/editar) agora atualizam o estado global 'modalPokemonSelection'.
 * Removida a limpeza da seleção principal (selectedPokemons) ao trocar para uma Clan View, permitindo seleção entre clãs.
 * <<< MODIFICADO: Adiciona listeners para paginação do histórico e reseta página nos filtros. >>>
 */
import { dom } from './domElements.js';
import { getState, setCurrentClan, clearSelectedPokemons, addModalPokemonSelection, removeModalPokemonSelection, setHistoryCurrentPage } from './state.js'; // <<< Importa setHistoryCurrentPage >>>
import { updateClanStyles, toggleSidebar, closeSidebar, checkScreenSize, displayError } from './ui.js';
import { loadClanView, handleTogglePokemonSelection, handleSelectEntireBag, handleConfirmSelection, handleDeletePokemon } from './clanView.js';
import { loadHomeView, renderActivePokemons, handleOpenReturnModal } from './homeView.js';
// <<< Importa handlers de paginação >>>
import { openHistoryModal, closeHistoryModal, filterAndRenderHistory, handleDeleteHistoryGroup, handleDeleteAllHistory, clearHistoryCache, handleHistoryPrevPage, handleHistoryNextPage } from './history.js';
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


const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`;


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
    } else {
        loadHomeView().catch(error => { console.error("Erro ao carregar home:", error); });
    }


    if (window.innerWidth < 768) closeSidebar();
    window.scrollTo(0, 0);
}


function setupEventListeners() {
    console.log("Configurando event listeners...");


    if (dom.menuToggle) dom.menuToggle.addEventListener('click', toggleSidebar);
    if (dom.logo) dom.logo.addEventListener('click', () => switchView('home'));
    if (dom.historyButton) dom.historyButton.addEventListener('click', openHistoryModal);
    if (dom.manageTrainersButton) dom.manageTrainersButton.addEventListener('click', openManageTrainersModal);
    if (dom.favoritesButton) dom.favoritesButton.addEventListener('click', () => switchView('favorites'));
    if (dom.themeToggleButton) dom.themeToggleButton.addEventListener('click', toggleTheme);


    if (dom.closeMenu) dom.closeMenu.addEventListener('click', closeSidebar);
    if (dom.menuOverlay) dom.menuOverlay.addEventListener('click', closeSidebar);
    if (dom.clanButtons) {
        dom.clanButtons.forEach(button => {
            if (button) {
                const viewTarget = button.dataset.clan || 'home';
                if (viewTarget !== 'favorites') {
                     button.addEventListener('click', () => switchView(viewTarget));
                }
            }
        });
    } else { console.error("Elementos DOM 'clanButtons' não encontrados!"); }


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


    if(dom.addPokemonButton) dom.addPokemonButton.addEventListener('click', openAddPokemonModal);


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


    if(dom.addPokemonForm) dom.addPokemonForm.addEventListener('submit', handleAddPokemonFormSubmit);
    if(dom.addTrainerForm) dom.addTrainerForm.addEventListener('submit', handleAddTrainerFormSubmit);
    if(dom.confirmPartialReturnButton) dom.confirmPartialReturnButton.addEventListener('click', handleConfirmPartialReturn);

    if(dom.partialReturnListContainer) {
        dom.partialReturnListContainer.addEventListener('change', (e) => {
            if (e.target.matches('.partial-return-checkbox[data-action="toggle-partial-return"]')) {
                 handleTogglePartialReturn(e.target);
            }
        });
    }

    const selectAllPartialCheckbox = document.getElementById('selectAllPartialReturn');
    if(selectAllPartialCheckbox) {
        selectAllPartialCheckbox.addEventListener('change', handleSelectAllPartialReturn);
    } else {
        console.warn("Checkbox #selectAllPartialReturn não encontrado para adicionar listener.");
    }

    // <<< MODIFICADO: Filtros do histórico agora resetam para a página 1 >>>
    if(dom.historySearchInput) dom.historySearchInput.addEventListener('input', () => {
        setHistoryCurrentPage(1); // Reseta a página
        filterAndRenderHistory();
    });
    if(dom.historyFilterSelect) dom.historyFilterSelect.addEventListener('change', () => {
        setHistoryCurrentPage(1); // Reseta a página
        filterAndRenderHistory();
    });
    // <<< FIM DA MODIFICAÇÃO FILTROS >>>

    if(dom.deleteAllHistoryButton) dom.deleteAllHistoryButton.addEventListener('click', handleDeleteAllHistory);
    // <<< MODIFICADO: Delegação para botões de deleção E paginação >>>
    if(dom.historyModal) { // Adiciona listener ao corpo do modal
        dom.historyModal.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-button[data-action="delete-history-group"]');
            const prevBtn = e.target.closest('.pagination-button[data-action="history-prev"]');
            const nextBtn = e.target.closest('.pagination-button[data-action="history-next"]');

            if(deleteBtn) handleDeleteHistoryGroup(deleteBtn);
            else if (prevBtn) handleHistoryPrevPage();
            else if (nextBtn) handleHistoryNextPage();
        });
    } else {
        console.error("Modal de histórico não encontrado para adicionar listeners delegados.");
    }
    // <<< FIM DA MODIFICAÇÃO HISTÓRICO >>>

    if(dom.openAddTrainerModalButton) dom.openAddTrainerModalButton.addEventListener('click', openAddTrainerModal);
    if(dom.trainerListContainer) dom.trainerListContainer.addEventListener('click', (e) => { const btn = e.target.closest('.delete-button.small-delete-button'); if(btn) handleDeleteTrainer(btn); });

    if(dom.createListForm) dom.createListForm.addEventListener('submit', handleCreateListSubmit);
    if(dom.createListPokemonSearch) dom.createListPokemonSearch.addEventListener('input', handleCreateListPokemonSearch);
    if(dom.createListPokemonSelection) {
        dom.createListPokemonSelection.addEventListener('change', (e) => {
            if(e.target.matches('input[type="checkbox"]')) {
                const pokemonId = e.target.dataset.pokemonId;
                if (!pokemonId) return;
                if (e.target.checked) {
                    addModalPokemonSelection(pokemonId);
                } else {
                    removeModalPokemonSelection(pokemonId);
                }
                const itemDiv = e.target.closest('.modal-pokemon-item');
                if (itemDiv) itemDiv.classList.toggle('selected', e.target.checked);
            }
        });
    }


    if(dom.editListForm) dom.editListForm.addEventListener('submit', handleUpdateListSubmit);
    if(dom.editListPokemonSearch) dom.editListPokemonSearch.addEventListener('input', handleEditListPokemonSearch);
    if(dom.editListPokemonSelection) {
         dom.editListPokemonSelection.addEventListener('change', (e) => {
            if(e.target.matches('input[type="checkbox"]')) {
                const pokemonId = e.target.dataset.pokemonId;
                if (!pokemonId) return;
                if (e.target.checked) {
                    addModalPokemonSelection(pokemonId);
                } else {
                    removeModalPokemonSelection(pokemonId);
                }
                 const itemDiv = e.target.closest('.modal-pokemon-item');
                 if (itemDiv) itemDiv.classList.toggle('selected', e.target.checked);
            }
        });
    }


    if(dom.confirmBorrowListButton) dom.confirmBorrowListButton.addEventListener('click', handleConfirmBorrowList);


    window.addEventListener('resize', checkScreenSize);

    console.log("Event listeners configurados.");
}



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