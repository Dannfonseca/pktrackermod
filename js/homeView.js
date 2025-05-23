// TODOLISTPOKEMON/js/homeView.js
/**
 * Gerencia a lógica e a renderização da visualização principal (Home).
 * Responsável por exibir o banner de boas-vindas, instruções, cards de clãs
 * e a lista de Pokémons atualmente em uso (ativos), buscando o nome do treinador,
 * o comentário do empréstimo e o item do Pokémon, e agrupando os Pokémons por clã
 * com cabeçalhos coloridos de acordo com o clã.
 * <<< MODIFICADO: Exibe o held_item do Pokémon ao lado do nome na lista de ativos. >>>
 *
 * Funções Principais:
 * - loadHomeView: Ativa a seção Home e chama a renderização dos Pokémons ativos.
 * - renderActivePokemons: Busca os dados dos empréstimos ativos, agrupa os Pokémons por clã
 * e cria os elementos HTML para exibir cada grupo de empréstimo na lista, incluindo o item.
 * - handleOpenReturnModal: Chamada quando o botão "Devolver" de um grupo ativo é clicado.
 */
import { dom } from './domElements.js';
import { fetchActiveHistory } from './api.js';
import { openPartialReturnModal } from './modals.js';
import { formatBrazilianDate, displayError } from './ui.js';
import { clanData } from './config.js';


export async function loadHomeView() {
    console.log("Carregando Home View...");
    if (!dom.homeSection || !dom.clanSection) {
        console.error("Seção Home ou Clã não encontrada no DOM.");
        displayError("Erro crítico: Elementos principais da página não encontrados.");
        return;
    }
    dom.homeSection.classList.remove('hidden');
    dom.clanSection.classList.add('hidden');
    await renderActivePokemons();
    console.log("Home View carregada.");
}


export async function renderActivePokemons() {
    console.log("Renderizando Pokémons ativos...");
    if (!dom.activePokemonsList) {
        console.error("Container 'activePokemonsList' não encontrado no DOM.");
        return;
    }
    dom.activePokemonsList.innerHTML = '';

    try {
        const activeGroups = await fetchActiveHistory();

        if (!activeGroups || activeGroups.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'Nenhum Pokémon em uso no momento.';
            dom.activePokemonsList.appendChild(emptyMessage);
            console.log("Nenhum Pokémon ativo encontrado.");
            return;
        }

        console.log("[Home View] Dados recebidos (API /history/active):", JSON.stringify(activeGroups, null, 2));

        activeGroups.forEach((group, index) => {
            if (!group || !group.pokemons || !Array.isArray(group.pokemons) || !group.trainer_name || !group.date) {
                console.warn(`Grupo ativo inválido no índice ${index}:`, group);
                return;
            }

            let groupClanClass = 'unknown-clan';
            if (group.pokemons.length > 0) {
                 const firstClan = group.pokemons[0].clan || 'unknown';
                  if(clanData[firstClan]) {
                     groupClanClass = firstClan;
                 }
            }

            console.log(`Grupo ${index} (Treinador: ${group.trainer_name}) - Classe CSS da Borda: ${groupClanClass}`);

            const item = document.createElement('div');
            item.className = `active-pokemon-item ${groupClanClass}`;

            const header = document.createElement('div');
            header.className = 'active-pokemon-header';

            const trainerInfo = document.createElement('div');
            trainerInfo.className = 'active-pokemon-trainer';
            trainerInfo.textContent = group.trainer_name;

            const dateInfo = document.createElement('div');
            dateInfo.className = 'active-pokemon-date';
            dateInfo.textContent = formatBrazilianDate(group.date);

            const returnButton = document.createElement('button');
            returnButton.className = 'return-button button';
            returnButton.textContent = 'Devolver';
            returnButton.dataset.action = 'open-return-modal';
            returnButton.dataset.groupIndex = index;

            header.appendChild(trainerInfo);
            header.appendChild(dateInfo);
            header.appendChild(returnButton);

            item.appendChild(header);

            // Mostra o comentário da TRANSAÇÃO (se existir)
            if (group.comment) {
                 const commentDiv = document.createElement('div');
                 commentDiv.className = 'active-pokemon-comment';
                 const safeComment = group.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 commentDiv.innerHTML = `<strong>Comentário:</strong> ${safeComment}`;
                 item.appendChild(commentDiv);
            }

            const pokemonListDiv = document.createElement('div');
            pokemonListDiv.className = 'active-pokemon-name-list';

            // Agrupa Pokémons por clã, guardando nome E item
            const pokemonsByClan = group.pokemons.reduce((acc, pokemon) => {
                const pokeName = pokemon?.name?.trim();
                const clanName = pokemon?.clan || 'unknown';
                const heldItem = pokemon?.held_item; // <<< Pega o item

                if (!pokeName) {
                    console.warn(`Nome de Pokémon vazio ou inválido no grupo ${index}. Pokémon:`, pokemon);
                    return acc;
                }

                if (!acc[clanName]) {
                    acc[clanName] = [];
                }
                // <<< Guarda objeto com nome e item >>>
                acc[clanName].push({ name: pokeName, held_item: heldItem });
                return acc;
            }, {});

            const sortedClans = Object.keys(pokemonsByClan).sort((a, b) => {
                 if (a === 'unknown') return 1;
                 if (b === 'unknown') return -1;
                 return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
            });

            sortedClans.forEach(clanName => {
                const clanHeader = document.createElement('h4');
                clanHeader.className = 'active-pokemon-clan-header';
                clanHeader.textContent = clanName === 'unknown' ? 'Clã Desconhecido' : (clanName.charAt(0).toUpperCase() + clanName.slice(1));

                const color = clanData[clanName]?.color || 'var(--text-medium)';
                clanHeader.style.color = color;

                const clanPokemonList = document.createElement('p');
                clanPokemonList.className = 'active-pokemon-clan-list';

                // <<< Formata a string para incluir o item >>>
                clanPokemonList.textContent = pokemonsByClan[clanName]
                    .map(p => `${p.name}${p.held_item ? ` (${p.held_item})` : ''}`) // Adiciona (Item) se existir
                    .join(', ');

                pokemonListDiv.appendChild(clanHeader);
                pokemonListDiv.appendChild(clanPokemonList);
            });

            item.appendChild(pokemonListDiv);

            dom.activePokemonsList.appendChild(item);
        });
        console.log("Pokémons ativos renderizados com item (se houver).");

    } catch (error) {
        console.error("Erro CRÍTICO ao renderizar Pokémons ativos:", error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Erro ao carregar a lista de Pokémons em uso. Verifique o console (F12) e tente recarregar.';
        if (dom.activePokemonsList) {
             dom.activePokemonsList.innerHTML = '';
             dom.activePokemonsList.appendChild(errorMessage);
        }
    }
}


export function handleOpenReturnModal(button) {
    const groupIndexStr = button.dataset.groupIndex;
    const groupIndex = parseInt(groupIndexStr, 10);
    console.log(`Botão Devolver clicado para grupo índice (string): '${groupIndexStr}', (int): ${groupIndex}`);
    if (groupIndexStr !== null && groupIndexStr !== undefined && !isNaN(groupIndex) && groupIndex >= 0) {
        openPartialReturnModal(groupIndex);
    } else {
        console.error("Índice do grupo inválido ou não encontrado no botão de devolução:", groupIndexStr);
        displayError("Não foi possível identificar qual grupo devolver. Tente recarregar a página.");
    }
}