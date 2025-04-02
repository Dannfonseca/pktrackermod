// TODOLISTPOKEMON/js/app.js
/**
 * Orquestrador principal da aplicação frontend.
 * Responsável por inicializar a aplicação, configurar os event listeners globais
 * para elementos da UI (menu, botões, modais) e gerenciar a troca entre
 * as visualizações principal (home) e de clãs específicos.
 *
 * Funções Principais:
 * - initializeApp: Ponto de entrada, aguarda o DOM carregar e chama runInitialization.
 * - runInitialization: Configura listeners e carrega a view inicial.
 * - setupEventListeners: Mapeia todos os eventos de clique, submit, change, etc., para as funções apropriadas nos outros módulos (ui.js, clanView.js, homeView.js, history.js, modals.js). Usa event delegation quando apropriado.
 * - switchView: Controla qual seção (home ou clã) é exibida, atualiza o estado, estilos e carrega os dados necessários para a view.
 */
import { dom } from './domElements.js';
import { getState, setCurrentClan } from './state.js';
import { updateClanStyles, toggleSidebar, closeSidebar, checkScreenSize, displayError } from './ui.js';
import { loadClanView, handleTogglePokemonSelection, handleSelectEntireBag, handleConfirmSelection, handleDeletePokemon } from './clanView.js';
import { loadHomeView, renderActivePokemons, handleOpenReturnModal } from './homeView.js';

import { openHistoryModal, closeHistoryModal, filterAndRenderHistory, handleDeleteHistoryGroup, handleDeleteAllHistory } from './history.js';
import { openAddPokemonModal, closeAddPokemonModal, handleAddPokemonFormSubmit, closePartialReturnModal, handleTogglePartialReturn, handleConfirmPartialReturn } from './modals.js';





export function switchView(viewName) {
    console.log(`Mudando para view: ${viewName}`);




    const isClanView = viewName !== 'home';


    setCurrentClan(viewName);


    try {
        dom.homeSection.classList.toggle('hidden', isClanView);
        dom.clanSection.classList.toggle('hidden', !isClanView);
    } catch (e) {
        console.error("Erro ao alternar visibilidade das seções:", e);

        displayError("Erro ao carregar a interface. Verifique o console.");
        return;
    }



    updateClanStyles(viewName);


    if (isClanView) {

        loadClanView(viewName).catch(error => {
             console.error(`Erro ao carregar view do clã ${viewName}:`, error);
             displayError(`Não foi possível carregar os dados do clã ${viewName}.`);
             switchView('home');
        });
    } else {

        loadHomeView().catch(error => {
             console.error("Erro ao carregar view da home:", error);
             displayError("Não foi possível carregar a página inicial.");

        });
    }


    if (window.innerWidth < 768) {
        closeSidebar();
    }


    window.scrollTo(0, 0);
}




function setupEventListeners() {
    console.log("Configurando event listeners...");


    if (!dom.menuToggle) console.error("Elemento DOM 'menuToggle' não encontrado!");
    if (!dom.logo) console.error("Elemento DOM 'logo' não encontrado!");



    if (dom.menuToggle) dom.menuToggle.addEventListener('click', toggleSidebar);
    if (dom.logo) dom.logo.addEventListener('click', () => switchView('home'));
    if (dom.historyButton) dom.historyButton.addEventListener('click', openHistoryModal);


    if (dom.closeMenu) dom.closeMenu.addEventListener('click', closeSidebar);
    if (dom.menuOverlay) dom.menuOverlay.addEventListener('click', closeSidebar);
    if (dom.clanButtons) {
        dom.clanButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => switchView(button.dataset.clan));
            }
        });
    } else {
        console.error("Elementos DOM 'clanButtons' não encontrados!");
    }



    if (dom.exploreButton) {
        dom.exploreButton.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                toggleSidebar();
            } else {
                switchView('malefic');
            }
        });
    }
    if (dom.viewActiveButton) {
        dom.viewActiveButton.addEventListener('click', () => {
            if(dom.activePokemonsList) {
                 dom.activePokemonsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.error("Elemento 'activePokemonsList' não encontrado para scroll.");
            }
        });
    }
    if (dom.clanCards) {
        dom.clanCards.forEach(card => {
           if(card) card.addEventListener('click', () => switchView(card.dataset.clan));
        });
    }

    if(dom.activePokemonsList) {
        dom.activePokemonsList.addEventListener('click', (event) => {
            const returnButton = event.target.closest('.return-button[data-action="open-return-modal"]');
            if (returnButton) {
                handleOpenReturnModal(returnButton);
            }
        });
    } else {
         console.error("Container 'activePokemonsList' não encontrado para event delegation.");
    }



    if(dom.backToHome) dom.backToHome.addEventListener('click', () => switchView('home'));
    if(dom.selectEntireBagButton) dom.selectEntireBagButton.addEventListener('click', handleSelectEntireBag);
    if(dom.confirmSelectionButton) dom.confirmSelectionButton.addEventListener('click', handleConfirmSelection);

     if(dom.pokemonSelectionContainer) {
        dom.pokemonSelectionContainer.addEventListener('click', (event) => {
            const selectButton = event.target.closest('.select-button[data-action="toggle-select"]');
            const deleteButton = event.target.closest('.delete-button[data-action="delete-pokemon"]');

            if (selectButton) {
                handleTogglePokemonSelection(selectButton);
            } else if (deleteButton) {
                handleDeletePokemon(deleteButton);
            }
        });
     } else {
          console.error("Container 'pokemonSelectionContainer' não encontrado para event delegation.");
     }



    if(dom.addPokemonButton) dom.addPokemonButton.addEventListener('click', openAddPokemonModal);
    if(dom.addPokemonModal) {
        const closeBtn = dom.addPokemonModal.querySelector('.close-button');
        const overlay = dom.addPokemonModal.querySelector('.modal-overlay');
        const cancelBtn = dom.addPokemonModal.querySelector('.secondary-button[type="button"]');

        if(closeBtn) closeBtn.addEventListener('click', closeAddPokemonModal);
        if(overlay) overlay.addEventListener('click', closeAddPokemonModal);
        if(cancelBtn) cancelBtn.addEventListener('click', closeAddPokemonModal);
    } else {
        console.error("Modal 'addPokemonModal' não encontrado.");
    }
    if(dom.addPokemonForm) dom.addPokemonForm.addEventListener('submit', handleAddPokemonFormSubmit);



    if(dom.partialReturnModal) {
        const closeBtn = dom.partialReturnModal.querySelector('.close-button');
        if(closeBtn) closeBtn.addEventListener('click', closePartialReturnModal);

    } else {
         console.error("Modal 'partialReturnModal' não encontrado.");
    }
    if(dom.confirmPartialReturnButton) dom.confirmPartialReturnButton.addEventListener('click', handleConfirmPartialReturn);
    if(dom.partialReturnListContainer) {
        dom.partialReturnListContainer.addEventListener('change', (event) => {
            const checkbox = event.target.closest('input[type="checkbox"][data-action="toggle-partial-return"]');
            if (checkbox) { handleTogglePartialReturn(checkbox); }
        });
    } else {
        console.error("Container 'partialReturnListContainer' não encontrado.");
    }



    if(dom.historyModal) {
        const historyModalCloseButton = dom.historyModal.querySelector('.close-button');
        const historyModalOverlay = dom.historyModal.querySelector('.modal-overlay');


        if (historyModalCloseButton) {
             historyModalCloseButton.addEventListener('click', closeHistoryModal);
        } else {
             console.error("Botão de fechar do modal de histórico não encontrado.");
        }
        if (historyModalOverlay) {
             historyModalOverlay.addEventListener('click', closeHistoryModal);
        } else {
             console.error("Overlay do modal de histórico não encontrado.");
        }
    } else {
         console.error("Modal 'historyModal' não encontrado.");
    }

    if(dom.historySearchInput) dom.historySearchInput.addEventListener('input', filterAndRenderHistory);
    if(dom.historyFilterSelect) dom.historyFilterSelect.addEventListener('change', filterAndRenderHistory);
    if(dom.deleteAllHistoryButton) dom.deleteAllHistoryButton.addEventListener('click', handleDeleteAllHistory);
    if(dom.historyListContainer) {
         dom.historyListContainer.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.delete-button[data-action="delete-history-group"]');
            if (deleteButton) { handleDeleteHistoryGroup(deleteButton); }
         });
    } else {
         console.error("Container 'historyListContainer' não encontrado.");
    }


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
    setupEventListeners();
    checkScreenSize();
    switchView('home');

    console.log("Aplicação inicializada.");
}


initializeApp();