# Painel de Contratos de Iguape

Painel estatico para consulta e acompanhamento de contratos administrativos da Prefeitura Municipal de Iguape/SP.

Todos os dados publicados no site sao gerados a partir de uma unica planilha Excel mantida fora do repositorio.

## Estrutura

- `index.html`: entrada usada pelo GitHub Pages.
- `painel_contratos.html`: pagina principal com a estrutura do painel.
- `styles/painel.css`: camada visual responsiva do painel.
- `scripts/painel.js`: logica de filtros, metricas, listagens e exportacao.
- `contratos-data.js`: base de dados gerada a partir da planilha Excel.
- `scripts/gerar-dados-contratos.py`: gerador oficial dos dados a partir do workbook consolidado.
- `scripts/gerar-dados-contratos.ps1`: gerador legado do layout antigo.
- `.gitignore`: impede o versionamento da planilha e de arquivos temporarios.

## Atualizar os dados

1. Atualize a planilha Excel consolidada de controle de prazos.
2. Gere o arquivo de dados informando explicitamente o workbook:

```bash
python3 scripts/gerar-dados-contratos.py --workbook "/caminho/para/CONTROLE_DE_PRAZOS_ORGANIZADO.xlsx"
```

3. Revise o arquivo `contratos-data.js`.
4. Publique as alteracoes no GitHub.

## O que o gerador faz

- Le a aba consolidada do workbook.
- Normaliza datas para `YYYY-MM-DD`.
- Preserva `status_excel` e `valor_texto` quando o valor original nao e numerico.
- Consolida gestor e fiscal em um unico campo textual.
- Deriva `tipo` automaticamente como `Ata` ou `Contrato`.
- Escreve `window.PAINEL_CONTRATOS_DATA = { ultimaAtualizacao, origemArquivo, contratos }`, expondo apenas o nome do arquivo de origem.

## Interface

- Hero com resumo executivo e metadados da base.
- Filtros globais com sincronizacao na URL.
- Indicadores do recorte atual.
- Radar de vencimentos, pendencias de vigencia e distribuicao por categoria.
- Tabelas por categoria com drawer de detalhes e exportacao em CSV.

## Publicacao

O projeto foi preparado para publicar no GitHub Pages pela branch `main`, usando a raiz do repositorio.

## Validacao recomendada

- Conferir a contagem total de registros gerados.
- Validar contratos criticos como `005/2025`, `ATA 20/2025`, `037/2025`, `005/2022`, `CE 003/2026`, `CE 009/2025` e `CE 008/2025`.
- Abrir `index.html` ou `painel_contratos.html` localmente para revisar filtros, cards e exportacao CSV.
