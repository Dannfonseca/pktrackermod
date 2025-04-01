# Pokes da House - Sistema de Gerenciamento de Pokémons

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

## Visão Geral

"Pokes da House" é um sistema web simples projetado para gerenciar o empréstimo e devolução de Pokémons organizados por "Clãs" dentro de um grupo específico (originalmente, a "mansão do Raito"). Ele permite que os treinadores vejam quais Pokémons estão disponíveis em cada clã, peguem emprestado os que precisam e os devolvam quando terminarem, mantendo um histórico de uso.

O sistema é composto por um frontend (HTML, CSS, JavaScript modular) e um backend (Node.js/Express com banco de dados SQLite).

## Funcionalidades

* **Visualização de Clãs:** Exibe uma lista de Clãs Pokémon com seus elementos associados.
* **Navegação por Clã:** Permite visualizar os Pokémons pertencentes a um clã específico.
* **Status de Disponibilidade:** Mostra se cada Pokémon está "Disponível" ou "Emprestado".
* **Seleção para Empréstimo:** Permite selecionar um ou mais Pokémons disponíveis de um clã.
    * Opção de selecionar/desselecionar todos os disponíveis de uma vez ("Adicionar Tudo" / "Retirar Tudo").
* **Registro de Empréstimo:** Registra o empréstimo dos Pokémons selecionados associando-os ao nome do treinador e à data/hora.
* **Visualização de Empréstimos Ativos:** Exibe na página inicial uma lista de todos os Pokémons atualmente em uso, agrupados por treinador e data.
* **Devolução:**
    * Inicia o processo de devolução para um grupo de Pokémons emprestados.
    * Permite selecionar Pokémons específicos para devolução parcial.
    * Confirma a devolução, atualizando o status dos Pokémons para "Disponível" e registrando a data de devolução no histórico.
* **Histórico Completo:**
    * Acesso a um histórico de todos os empréstimos (ativos e devolvidos).
    * Filtro do histórico por status (Todos, Em uso, Devolvidos).
    * Busca no histórico por nome do treinador ou nome do Pokémon.
* **Gerenciamento de Pokémons (Admin):**
    * Adicionar novos Pokémons ao sistema (nome, item opcional, clã).
    * Deletar Pokémons individualmente (requer senha).
* **Gerenciamento de Histórico (Admin):**
    * Deletar registros específicos do histórico (agrupados por treinador/data) (requer senha).
    * Deletar todo o histórico (requer senha).

## Tecnologias Utilizadas

* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript (Vanilla, ES6 Modules)
* **Backend:**
    * Node.js
    * Express.js
    * SQLite3 (para armazenamento de dados)
    * CORS
    * UUID

## Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado:

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (que inclui o npm)
* Opcional (para servidor frontend): [Python](https://www.python.org/)

## Como Clonar

Abra seu terminal e execute o seguinte comando:

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <NOME_DA_PASTA_DO_PROJETO>
