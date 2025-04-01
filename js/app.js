// js/app.js
import { state } from './state.js';
import { elements } from './domElements.js';
import { CONFIG } from './config.js';
import * as UI from './ui.js';
import * as ClanView from './clanView.js';
import * as HomeView from './homeView.js';
import * as History from './history.js';
import * as Modals from './modals.js';

/** Binds all event listeners to their respective handlers */
function bindEvents() {
    // --- Sidebar & General UI ---
    elements.menuToggle?.addEventListener('click', UI.toggleSidebar);
    elements.closeMenu?.addEventListener('click', UI.closeSidebar);
    elements.menuOverlay?.addEventListener('click', UI.closeSidebar);
    window.addEventListener('resize', UI.checkScreenSize);

    // --- Navigation ---
    elements.logo?.addEventListener('click', () => navigateTo('home'));
    elements.backToHomeButton?.addEventListener('click', () => navigateTo('home'));
    // Sidebar navigation (delegation)
    elements.sidebarNav?.addEventListener('click', (event) => {
        if (event.target.matches('.clan-button')) {
            navigateTo(event.target.dataset.clan);
        }
    });
    // Home clan cards navigation (delegation)
    elements.clanCardsContainer?.addEventListener('click', (event) => {
        const card = event.target.closest('.clan-card');
        if (card) {
            navigateTo(card.dataset.clan);
        }
    });
    elements.exploreButton?.addEventListener('click', () => {
        if (window.innerWidth < 768) UI.toggleSidebar();
        else navigateTo(Object.keys(CONFIG.CLAN_DATA)[0]); // Navigate to first clan
    });
    elements.viewActiveButton?.addEventListener('click', () => {
        elements.activePokemonsList?.scrollIntoView({ behavior: 'smooth' });
    });

    // --- Clan View Actions ---
    elements.selectEntireBagButton?.addEventListener('click', ClanView.handleSelectEntireBag);
    elements.confirmSelectionButton?.addEventListener('click', ClanView.confirmLoan);
    // Pokémon item actions (delegation)
    elements.pokemonSelectionContainer?.addEventListener('click', ClanView.handleItemClick);

    // --- Home View Actions (Return Button - delegation) ---
     elements.activePokemonsList?.addEventListener('click', (event) => {
         const returnButton = event.target.closest('.return-loan-group-button');
         if (returnButton && returnButton.dataset.action === 'open-return-modal') {
             Modals.openPartialReturnModal(returnButton.dataset.trainer, returnButton.dataset.date);
         }
     });

    // --- Modal Triggers ---
    elements.addPokemonButton?.addEventListener('click', Modals.openAddPokemonModal);
    elements.historyButton?.addEventListener('click', History.openModal);

    // --- History Modal Actions ---
    elements.historySearchInput?.addEventListener('input', History.render);
    elements.historyFilterSelect?.addEventListener('change', History.render);
    elements.deleteAllHistoryButton?.addEventListener('click', History.deleteAll);
    // History item delete action (delegation)
    elements.historyListContainer?.addEventListener('click', (event) => {
         const deleteButton = event.target.closest('.delete-history-group-button');
         if (deleteButton && deleteButton.dataset.action === 'delete-history-group') {
             History.deleteItemGroup(deleteButton.dataset.trainer, deleteButton.dataset.date);
         }
     });
    elements.historyModalCloseButton?.addEventListener('click', History.closeModal);
    elements.historyModalOverlay?.addEventListener('click', History.closeModal);

    // --- Add Pokémon Modal Actions ---
    elements.addPokemonForm?.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        Modals.handleAddPokemonSubmit();
    });
    elements.addPokemonModalCloseButton?.addEventListener('click', Modals.closeAddPokemonModal);
    elements.addPokemonModalCancelButton?.addEventListener('click', Modals.closeAddPokemonModal);

    // --- Partial Return Modal Actions ---
    elements.confirmPartialReturnButton?.addEventListener('click', Modals.confirmPartialReturn);
    elements.partialReturnModalCloseButton?.addEventListener('click', Modals.closePartialReturnModal);

    console.log("Event Listeners Bound");
}

/** Handles navigation between views */
export function navigateTo(clanId) {
    console.log(`App Navigating to: ${clanId}`);
    state.currentClan = clanId;
    state.selectedPokemons = {}; // Reset selection on any navigation

    // Update view sections visibility and content
    if (clanId === 'home') {
        elements.homeSection?.classList.remove('hidden');
        elements.clanSection?.classList.add('hidden');
        HomeView.renderActivePokemons(); // Render active Pokémon for home
    } else {
        elements.homeSection?.classList.add('hidden');
        elements.clanSection?.classList.remove('hidden');
        ClanView.updateHeader(clanId);    // Update title/elements for clan view
        ClanView.loadPokemons(clanId);     // Load Pokémon for clan view
    }

    UI.updateSidebarActiveState(clanId); // Update sidebar style
    if (window.innerWidth < 768) UI.closeSidebar(); // Close mobile sidebar
}

/** Initializes the application */
function init() {
    UI.cacheDOMElements(); // Cache elements first
    bindEvents();          // Then bind events to them
    UI.updateClanUIStyles(); // Set initial styles
    navigateTo('home');    // Navigate to the initial view
    UI.checkScreenSize();  // Check initial screen size
    console.log("App Initialized (Modular)");
}

// --- Start the App ---
document.addEventListener('DOMContentLoaded', init);