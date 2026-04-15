# Painel de Contratos de Iguape

Painel publico de contratos administrativos da Prefeitura Municipal de Iguape/SP, publicado como site estatico no GitHub Pages.

Os dados exibidos em `painel_contratos.html` sao lidos de `contratos.json` via `fetch()`. Nao ha backend nem dependencias pesadas, o que mantem a hospedagem simples e compativel com a raiz da branch `main`.

## Estrutura

- `index.html`: redireciona para a pagina principal do painel.
- `painel_contratos.html`: shell HTML publicada no GitHub Pages.
- `contratos.json`: base normalizada consumida pelo front-end.
- `assets/`: identidade visual, logo institucional e favicon.
- `styles/`: tokens, base visual, layout, componentes, graficos e responsividade.
- `scripts/main.js`: ponto de entrada do painel.
- `scripts/data.js`: carga, validacao, cache e normalizacao dos contratos.
- `scripts/filters.js`: estado dos filtros, URL sync, chips ativos e orquestracao da interface.
- `scripts/indicators.js`: calculo e renderizacao dos cards de indicadores.
- `scripts/charts.js`: renderizacao dos graficos SVG.
- `scripts/contracts-list.js`: cards, tabelas e agrupamentos da listagem.
- `scripts/modal.js`: detalhes do contrato, foco e interacoes de teclado.
- `scripts/export.js`: exportacao CSV e impressao.
- `scripts/utils.js`: formatadores e helpers puros reutilizaveis.
- `tools/excel-to-json.py`: conversao da planilha Excel para `contratos.json`.

## Atualizar os dados

1. Atualize a planilha Excel consolidada fora do repositorio.
2. Gere a nova base JSON:

```bash
python tools/excel-to-json.py --input "/caminho/para/CONTROLE_DE_PRAZOS_ORGANIZADO.xlsx"
```

3. Revise `contratos.json` e, se desejar, o relatorio textual gerado.
4. Publique as alteracoes no GitHub.

## Publicacao

O painel foi preparado para funcionar diretamente no GitHub Pages usando a raiz do repositorio. A pagina publicada fica em:

- [https://matheuhenriqu.github.io/painel-teste/painel_contratos.html](https://matheuhenriqu.github.io/painel-teste/painel_contratos.html)

## Manutencao

- O front-end usa `type="module"` com `import/export` nativos.
- Os estilos foram separados em folhas dedicadas para facilitar evolucao e dark mode.
- Campos ausentes em `contratos.json` sao tratados em `scripts/data.js` por `normalizeContract(raw)`.
- Funcoes puras compartilhadas ficam em `scripts/utils.js`.
