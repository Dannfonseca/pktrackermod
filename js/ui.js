// js/ui.js
import { elements } from './domElements.js';
import { CONFIG } from './config.js';
import { state } from './state.js';

/**
 * Populates the `elements` object with references to DOM nodes.
 * Should be called after DOMContentLoaded.
 */
export function cacheDOMElements() {
    const selectors = {
        menuToggle: '#menuToggle',
        closeMenu: '#closeMenu',
        sidebar: '#sidebar',
        menuOverlay: '#menuOverlay',
        logo: '.logo',
        sidebarNav: '.sidebar-nav ul',
        homeSection: '#home-section',
        clanSection: '#clan-section',
        exploreButton: '#exploreButton',
        viewActiveButton: '#viewActiveButton',
        activePokemonsList: '#activePokemonsList',
        clanCardsContainer: '.clan-grid',
        clanTitle: '#clan-title',
        clanElementsTag: '#clan-elements',
        backToHomeButton: '#backToHome',
        selectEntireBagButton: '#selectEntireBag',
        pokemonSelectionContainer: '#pokemon-selection',
        emptyClanMessage: '#empty-clan',
        trainerNameInput: '#trainerName',
        confirmSelectionButton: '#confirmSelection',
        errorModal: '#errorModal',
        addPokemonModal: '#addPokemonModal',
        partialReturnModal: '#partialReturnModal',
        historyModal: '#historyModal',
        addPokemonButton: '#addPokemonButton',
        addPokemonForm: '#addPokemonForm',
        newPokemonNameInput: '#newPokemonName',
        newPokemonItemInput: '#newPokemonItem',
        clanSelectInput: '#clanSelect',
        addPokemonModalCloseButton: '#addPokemonModal .close-button',
        addPokemonModalCancelButton: '#addPokemonForm .secondary-button',
        partialReturnListContainer: '#partialReturnList',
        confirmPartialReturnButton: '#confirmPartialReturn',
        partialReturnModalCloseButton: '#partialReturnModal .close-button',
        historyButton: '#historyButton',
        historyModalCloseButton: '#historyModal .close-button',
        historyModalOverlay: '#historyModal .modal-overlay',
        historySearchInput: '#historySearch',
        historyFilterSelect: '#historyFilter',
        deleteAllHistoryButton: '#delete-all-history-button',
        historyListContainer: '#historyList',
        loadingSpinner: '#loadingSpinner',
    };

    for (const key in selectors) {
        elements[key] = document.querySelector(selectors[key]);
        // Basic check if element exists
        if (!elements[key]) {
             console.warn(`DOM element not found for selector: ${selectors[key]} (key: ${key})`);
        }
    }
    console.log("DOM Elements Cached:", elements);
}

export function showSpinner() {
    elements.loadingSpinner?.classList.remove('hidden');
}

export function hideSpinner() {
    // Small delay to prevent flickering
    setTimeout(() => elements.loadingSpinner?.classList.add('hidden'), 150);
}

export function toggleSidebar() {
    elements.sidebar?.classList.toggle('active');
    elements.menuOverlay?.classList.toggle('active');
}

export function closeSidebar() {
    elements.sidebar?.classList.remove('active');
    elements.menuOverlay?.classList.remove('active');
}

export function checkScreenSize() {
    if (window.innerWidth >= 768) {
        elements.sidebar?.classList.remove('active');
        elements.menuOverlay?.classList.remove('active');
    }
}

/** Updates active state and styles for sidebar buttons */
export function updateSidebarActiveState(activeClanId) {
    elements.sidebarNav?.querySelectorAll('.clan-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.clan === activeClanId);
    });
    updateClanUIStyles(); // Also update colors
}

/** Updates the visual style of various clan-related elements */
export function updateClanUIStyles() {
    // Home page cards
    elements.clanCardsContainer?.querySelectorAll('.clan-card').forEach(card => {
        const clanId = card.dataset.clan;
        const clanInfo = CONFIG.CLAN_DATA[clanId];
        if (clanInfo) {
            const iconDiv = card.querySelector('.clan-icon');
            if (iconDiv) iconDiv.style.color = clanInfo.color;
            card.style.borderColor = clanInfo.color;
        }
    });

    // Sidebar buttons
    elements.sidebarNav?.querySelectorAll('.clan-button').forEach(button => {
        const clanId = button.dataset.clan;
        const clanInfo = CONFIG.CLAN_DATA[clanId];
        const isActive = button.classList.contains('active');

        button.style.borderLeftColor = 'transparent';
        button.style.color = 'inherit';
        button.style.removeProperty('--hover-color');

        if (clanId !== 'home' && clanInfo) {
            button.style.setProperty('--hover-color', clanInfo.color);
            if (isActive) {
                button.style.borderLeftColor = clanInfo.color;
                button.style.color = clanInfo.color;
            }
        } else if (clanId === 'home' && isActive) {
             button.style.borderLeftColor = '#3b82f6'; // Default active color for Home
             button.style.color = '#3b82f6';
        }
    });
     // Clan title color in clan view
     const currentClanInfo = CONFIG.CLAN_DATA[state.currentClan];
     if (elements.clanTitle) {
        elements.clanTitle.style.color = (state.currentClan !== 'home' && currentClanInfo) ? currentClanInfo.color : 'inherit';
     }
}

/**
 * Utility to create an element.
 * @param {string} tag - HTML tag name.
 * @param {object} [options] - Optional attributes and content.
 * @param {string} [options.className] - CSS class name.
 * @param {string} [options.textContent] - Text content.
 * @param {string} [options.innerHTML] - HTML content.
 * @param {string} [options.title] - Tooltip text.
 * @param {string} [options.type] - Input type.
 * @param {object} [options.dataset] - Data attributes { key: value }.
 * @returns {HTMLElement} The created element.
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.title) element.title = options.title;
    if (options.type) element.type = options.type;
    if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }
    return element;
}

/** Displays a message inside a container element */
export function displayMessage(container, text, type = 'message') { // type = 'message' | 'error' | 'empty'
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    const messageClass = type === 'error' ? 'error-message' : (type === 'empty' ? 'empty-message' : 'info-message');
    const messageElement = createElement('div', { className: messageClass, textContent: text });
    container.appendChild(messageElement);
}