// TODOLISTPOKEMON/js/favoritesView.js
/**
 * Gerencia a lógica e a renderização da visualização de Listas Favoritas.
 * Responsável por buscar as listas da API, exibi-las e, futuramente,
 * gerenciar a criação, edição, exclusão e uso dessas listas.
 * Adicionada verificação para garantir que list.id e list.name existam.
 */
import { dom } from './domElements.js';
import { fetchFavoriteLists } from './api.js'; // Usaremos as funções da api.js
import { showSpinner, hideSpinner, displayError } from './ui.js';

/**
 * Carrega as listas favoritas da API e inicia a renderização.
 */
export async function loadFavoritesView() {
    console.log("Carregando View de Listas Favoritas...");
    if (!dom.favoriteListsContainer) {
        console.error("Container 'favoriteListsContainer' não encontrado.");
        return;
    }

    dom.favoriteListsContainer.innerHTML = '<p class="loading-message">Carregando listas...</p>'; // Mensagem de carregamento
    // showSpinner(); // O spinner global pode já estar ativo pela troca de view

    try {
        const lists = await fetchFavoriteLists();
        renderFavoriteLists(lists);
    } catch (error) {
        console.error("Erro ao carregar listas favoritas:", error);
        // displayError já é chamado na API
        dom.favoriteListsContainer.innerHTML = '<p class="error-message">Erro ao carregar listas. Tente novamente.</p>';
    } finally {
        // hideSpinner(); // Esconder spinner global se necessário
    }
}

/**
 * Renderiza a lista de listas favoritas no container apropriado.
 * @param {Array} lists - Array de objetos de lista (vindo da API, ex: [{id, name, updated_at}])
 */
function renderFavoriteLists(lists) {
    if (!dom.favoriteListsContainer) return;
    dom.favoriteListsContainer.innerHTML = ''; // Limpa o container

    if (!lists || lists.length === 0) {
        dom.favoriteListsContainer.innerHTML = '<p class="empty-message">Nenhuma lista favorita criada ainda.</p>';
        return;
    }

    lists.forEach((list, index) => {
        // <<< CORREÇÃO: Verifica se 'list', 'list.id' e 'list.name' existem >>>
        if (!list || typeof list.id !== 'string' || typeof list.name !== 'string') {
            console.warn(`Item de lista inválido ou incompleto no índice ${index}:`, list);
            return; // Pula este item inválido para não quebrar a renderização
        }

        const item = document.createElement('div');
        item.className = 'favorite-list-item';
        item.dataset.listId = list.id; // Guarda o ID para referência futura

        // Cabeçalho do Item (Nome e botão delete)
        const header = document.createElement('div');
        header.className = 'favorite-list-item-header';

        const nameH3 = document.createElement('h3');
        nameH3.textContent = list.name; // Agora seguro usar list.name
        header.appendChild(nameH3);

        // Botão Deletar (ainda sem funcionalidade completa no listener)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-list-button';
        deleteButton.setAttribute('aria-label', `Deletar lista ${list.name}`);
        deleteButton.title = `Deletar lista ${list.name}`;
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        header.appendChild(deleteButton);

        // Ações do Item (Ver/Editar e Usar)
        const actions = document.createElement('div');
        actions.className = 'favorite-list-item-actions';

        const viewEditButton = document.createElement('button');
        viewEditButton.className = 'button view-edit-button';
        viewEditButton.textContent = 'Ver / Editar';
        actions.appendChild(viewEditButton);

        const borrowButton = document.createElement('button');
        borrowButton.className = 'button borrow-list-button';
        borrowButton.textContent = 'Usar Lista';
        actions.appendChild(borrowButton);

        // Adiciona header e actions ao item principal
        item.appendChild(header);
        item.appendChild(actions);

        dom.favoriteListsContainer.appendChild(item);
    });

     console.log(`${lists.length} listas favoritas renderizadas.`);
}

// --- Funções futuras para Modais e Ações ---
// export function openCreateListModal() { ... }
// export function handleCreateListSubmit() { ... }
// export function openViewEditListModal(listId) { ... }
// export function handleUpdateListSubmit() { ... }
// export function handleDeleteListClick(listId) { ... }
// export function handleBorrowListClick(listId, listName) { ... }
// export function handleConfirmBorrowList(listId) { ... }