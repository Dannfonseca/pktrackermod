// TODOLISTPOKEMON/js/homeView.js
/**
 * Gerencia a lógica e a renderização da visualização principal (Home).
 * Responsável por exibir o banner de boas-vindas, instruções, cards de clãs
 * e, principalmente, a lista de Pokémons atualmente em uso (ativos).
 *
 * Funções Principais:
 * - loadHomeView: Ativa a seção Home e chama a renderização dos Pokémons ativos.
 * - renderActivePokemons: Busca os dados dos empréstimos ativos via API (/history/active)
 * e cria os elementos HTML para exibir cada grupo de empréstimo na lista.
 * Contém workaround para lidar com formato inesperado da API.
 * - handleOpenReturnModal: Chamada quando o botão "Devolver" de um grupo ativo é clicado,
 * abrindo o modal de devolução parcial (gerenciado em modals.js).
 */
import { dom } from './domElements.js';
import { fetchActiveHistory } from './api.js';
import { openPartialReturnModal } from './modals.js';
import { formatBrazilianDate } from './ui.js';

import { clanData } from './config.js';





export async function loadHomeView() {
    console.log("Carregando Home View...");
    if (!dom.homeSection || !dom.clanSection) {
        console.error("Seção Home ou Clã não encontrada no DOM.");
        return;
    }
    dom.homeSection.classList.remove('hidden');
    dom.clanSection.classList.add('hidden');
    await renderActivePokemons();
    console.log("Home View carregada.");
}


export async function renderActivePokemons() {
    console.log("Renderizando Pokémons ativos (com workaround)...");
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

        console.log("Dados recebidos (API /history/active - formato esperado incorreto):", JSON.stringify(activeGroups, null, 2));

        activeGroups.forEach((group, index) => {
            if (!group || !group.pokemons || !Array.isArray(group.pokemons) || !group.trainer || !group.date) {
                console.warn(`Grupo ativo inválido no índice ${index}:`, group);
                return;
            }



            const groupClan = 'unknown-clan';
            console.log(`Grupo ${index} (Treinador: ${group.trainer}) - Clã INDISPONÍVEL via /history/active.`);

            const item = document.createElement('div');
            item.className = 'active-pokemon-item';
            item.classList.add(groupClan);


            const header = document.createElement('div');
            header.className = 'active-pokemon-header';

            const trainerInfo = document.createElement('div');
            trainerInfo.className = 'active-pokemon-trainer';
            trainerInfo.textContent = group.trainer;

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


            const pokemonListDiv = document.createElement('div');
            pokemonListDiv.className = 'active-pokemon-name-list';



            const pokemonNames = group.pokemons.map((pokemonNameString, idx) => {

                if (!pokemonNameString || typeof pokemonNameString !== 'string' || pokemonNameString.trim() === '') {
                    console.warn(`Nome de Pokémon vazio ou inválido no grupo ${index}, índice ${idx}. Valor recebido:`, pokemonNameString);
                    return 'Nome Inválido/Vazio';
                }
                return pokemonNameString;
            });
            pokemonListDiv.textContent = pokemonNames.join(', ');


            item.appendChild(header);
            item.appendChild(pokemonListDiv);
            dom.activePokemonsList.appendChild(item);
        });
        console.log("Pokémons ativos renderizados (com workaround).");

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
        alert("Não foi possível identificar qual grupo devolver. Tente recarregar.");
    }
}