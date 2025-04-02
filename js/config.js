// TODOLISTPOKEMON/js/config.js
/**
 * Constantes e dados de configuração da aplicação frontend.
 *
 * Constantes Exportadas:
 * - API_BASE_URL: URL base para as chamadas à API backend.
 * - clanData: Objeto contendo informações estáticas sobre cada clã (elementos, cor).
 * - ADMIN_PASSWORD: Senha utilizada para operações destrutivas (deletar histórico, deletar Pokémon).
 * (ATENÇÃO: Manter senhas hardcoded no frontend não é seguro para produção).
 */


export const API_BASE_URL = 'https://poketrackerapi.onrender.com';


export const clanData = {
    malefic: {
        elements: 'Dark, Ghost, Venom',
        color: '#6b21a8',
    },
    wingeon: {
        elements: 'Flying, Dragon',
        color: '#0284c7',
    },
    ironhard: {
        elements: 'Metal, Crystal',
        color: '#64748b',
    },
    volcanic: {
        elements: 'Fire',
        color: '#dc2626',
    },
    seavell: {
        elements: 'Water, Ice',
        color: '#0891b2',
    },
    gardestrike: {
        elements: 'Fighting, Normal',
        color: '#b45309',
    },
    orebound: {
        elements: 'Rock, Earth',
        color: '#92400e',
    },
    naturia: {
        elements: 'Grass, Bug',
        color: '#16a34a',
    },
    psycraft: {
        elements: 'Psychic, Fairy',
        color: '#d946ef',
    },
    raibolt: {
        elements: 'Electric',
        color: '#facc15',
    }
};


export const ADMIN_PASSWORD = 'raito123';