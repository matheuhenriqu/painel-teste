import {
  compareText,
  formatCurrency,
  formatDate,
  formatOptionalCurrency,
  hasProvidedNumber,
  normalizeText,
  slugify,
  titleCase
} from "./utils.js";

(function () {
  "use strict";
})();

const COLLAPSE_STORAGE_KEY = "iguape-painel-group-collapse-v2";
const PAGE_SIZE = 20;
const SVG_NS = "http://www.w3.org/2000/svg";
const tableCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const TYPE_ICONS = {
  "PREGÃO ELETRÔNICO": "PE",
  "PRORROGAÇÃO": "PR",
  "CONCORRÊNCIA ELETRÔNICA": "CE",
  "LOCAÇÃO": "LC",
  "CHAMADA PÚBLICA": "CH",
  "TOMADA DE PREÇOS": "TP",
  "CONCORRÊNCIA PRESENCIAL": "CP",
  "DISPENSA": "DI"
};

const TYPE_ACCENTS = {
  "PREGÃO ELETRÔNICO": "var(--chart-type-1)",
  "PRORROGAÇÃO": "var(--chart-type-2)",
  "CONCORRÊNCIA ELETRÔNICA": "var(--chart-type-3)",
  "LOCAÇÃO": "var(--chart-type-4)",
  "CHAMADA PÚBLICA": "var(--chart-type-5)",
  "TOMADA DE PREÇOS": "var(--chart-type-6)",
  "CONCORRÊNCIA PRESENCIAL": "var(--chart-type-7)",
  "DISPENSA": "var(--chart-type-8)",
  "SEM TIPO": "var(--color-primary)"
};

export function createTableRenderer(options) {
  const config = Object.assign(
    {
      mainContainer: null,
      endedSection: null,
      endedCounter: null,
      endedContainer: null,
      onContractSelect: function () {},
      onClearAllFilters: function () {},
      onRemoveFilter: function () {}
    },
    options || {}
  );

  const visibleCountState = new Map();
  let latestPayload = null;

  bindContainer(config.mainContainer, "ativos");
  bindContainer(config.endedContainer, "encerrados");

  return {
    render: render,
    clear: clear,
    renderForPrint: renderForPrint,
    restoreLatest: restoreLatest
  };

  function render(payload) {
    const settings = Object.assign(
      {
        records: [],
        order: "risco",
        searchQuery: "",
        emptySuggestion: null,
        disablePagination: false,
        expandAll: false
      },
      payload || {}
    );
    latestPayload = settings;

    const activeRecords = settings.records.filter(function (record) {
      return record && record.situacao && record.situacao.key !== "encerrado";
    });
    const endedRecords = settings.records.filter(function (record) {
      return record && record.situacao && record.situacao.key === "encerrado";
    });

    renderCollection(config.mainContainer, activeRecords, {
      collectionKey: "ativos",
      order: settings.order,
      searchQuery: settings.searchQuery,
      emptySuggestion: settings.emptySuggestion,
      emptyTitle: "Nenhum contrato encontrado com esses filtros.",
      emptyText: "Ajuste os filtros aplicados ou limpe todos para voltar a exibir a listagem."
    });

    if (config.endedCounter) {
      config.endedCounter.textContent = String(endedRecords.length);
    }

    if (config.endedSection) {
      config.endedSection.hidden = false;
      config.endedSection.classList.toggle("is-empty", endedRecords.length === 0);
      if (endedRecords.length === 0) {
        config.endedSection.open = false;
      }
    }

    renderCollection(config.endedContainer, endedRecords, {
      collectionKey: "encerrados",
      order: settings.order,
      searchQuery: settings.searchQuery,
      emptySuggestion: null,
      emptyTitle: "Nenhum contrato encerrado no recorte",
      emptyText: "Os contratos encerrados aparecem aqui quando estiverem incluídos no recorte atual."
    });
  }

  function clear() {
    latestPayload = null;
    visibleCountState.clear();
    [config.mainContainer, config.endedContainer].forEach(function (container) {
      if (container) {
        container.replaceChildren();
      }
    });
    if (config.endedCounter) {
      config.endedCounter.textContent = "0";
    }
    if (config.endedSection) {
      config.endedSection.hidden = false;
      config.endedSection.classList.add("is-empty");
      config.endedSection.open = false;
    }
  }

  function renderForPrint() {
    if (!latestPayload) {
      return;
    }

    render(Object.assign({}, latestPayload, {
      disablePagination: true,
      expandAll: true
    }));
  }

  function restoreLatest() {
    if (!latestPayload) {
      return;
    }

    render(Object.assign({}, latestPayload, {
      disablePagination: false,
      expandAll: false
    }));
  }

  function bindContainer(container, collectionKey) {
    if (!container) {
      return;
    }

    container.addEventListener("click", function (event) {
      const toggle = event.target.closest("[data-group-toggle]");
      if (toggle) {
        handleToggle(toggle);
        return;
      }

      const loadMoreButton = event.target.closest("[data-load-more]");
      if (loadMoreButton) {
        handleLoadMore(loadMoreButton, container);
        return;
      }

      const suggestion = event.target.closest("[data-empty-suggest]");
      if (suggestion) {
        config.onRemoveFilter(suggestion.dataset.filterKey || "");
        return;
      }

      const clearButton = event.target.closest("[data-empty-clear]");
      if (clearButton) {
        config.onClearAllFilters();
        return;
      }

      const contractNode = event.target.closest("[data-contract-id]");
      if (contractNode) {
        const contractId = Number(contractNode.dataset.contractId);
        if (Number.isInteger(contractId)) {
          config.onContractSelect(contractId);
        }
      }
    });

    container.addEventListener("keydown", function (event) {
      const contractNode = event.target.closest("[data-contract-id]");
      if (contractNode && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        const contractId = Number(contractNode.dataset.contractId);
        if (Number.isInteger(contractId)) {
          config.onContractSelect(contractId);
        }
        return;
      }

      const suggestion = event.target.closest("[data-empty-suggest]");
      if (suggestion && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        config.onRemoveFilter(suggestion.dataset.filterKey || "");
      }

      const clearButton = event.target.closest("[data-empty-clear]");
      if (clearButton && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        config.onClearAllFilters();
      }
    });

    container.dataset.collectionKey = collectionKey;
  }

  function handleToggle(button) {
    const panelId = button.getAttribute("aria-controls");
    const body = panelId ? document.getElementById(panelId) : null;
    const expanded = button.getAttribute("aria-expanded") === "true";
    const nextExpanded = !expanded;
    const chevron = button.querySelector("[data-chevron]");

    button.setAttribute("aria-expanded", String(nextExpanded));
    if (body) {
      body.hidden = !nextExpanded;
    }
    if (chevron) {
      chevron.textContent = nextExpanded ? "▼" : "▶";
    }

    writeCollapsedState(button.dataset.groupToggle || "", nextExpanded);
  }

  function handleLoadMore(button, container) {
    const groupKey = button.dataset.groupKey || "";
    const totalItems = Number(button.dataset.totalItems || 0);
    const storageKey = buildGroupStateKey(container, groupKey);
    const currentVisible = visibleCountState.get(storageKey) || PAGE_SIZE;
    const nextVisible = Math.min(totalItems, currentVisible + PAGE_SIZE);

    if (nextVisible === currentVisible) {
      return;
    }

    visibleCountState.set(storageKey, nextVisible);
    if (latestPayload) {
      render(latestPayload);
    }

    const scrollTarget = container.querySelector('[data-group-id="' + cssEscape(groupKey) + '"]') ||
      button.closest(".contract-group");
    if (scrollTarget) {
      window.requestAnimationFrame(function () {
        scrollTarget.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  }

  function renderCollection(container, records, options) {
    if (!container) {
      return;
    }

    const settings = Object.assign(
      {
        collectionKey: "ativos",
        order: "risco",
        searchQuery: "",
        emptySuggestion: null,
        emptyTitle: "",
        emptyText: "",
        disablePagination: false,
        expandAll: false
      },
      options || {}
    );

    container.replaceChildren();

    if (!records.length) {
      container.appendChild(
        createEmptyState(settings.emptyTitle, settings.emptyText, settings.emptySuggestion)
      );
      return;
    }

    const groups = groupRecords(records);
    groups.forEach(function (entry, index) {
      container.appendChild(
        createGroup(entry, {
          index: index,
          collectionKey: settings.collectionKey,
          order: settings.order,
          searchQuery: settings.searchQuery,
          disablePagination: settings.disablePagination,
          expandAll: settings.expandAll
        }, container)
      );
    });
  }

  function groupRecords(records) {
    const grouped = new Map();

    records.forEach(function (record) {
      const key = String(record.tipo || "SEM TIPO").trim() || "SEM TIPO";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(record);
    });

    return Array.from(grouped.entries())
      .map(function (entry) {
        return {
          tipo: entry[0],
          records: entry[1]
        };
      })
      .sort(function (a, b) {
        if (b.records.length !== a.records.length) {
          return b.records.length - a.records.length;
        }
        const valueA = sumValues(a.records);
        const valueB = sumValues(b.records);
        if (valueB !== valueA) {
          return valueB - valueA;
        }
        return compareText(a.tipo, b.tipo);
      });
  }

  function createGroup(entry, context, container) {
    const article = document.createElement("article");
    const typeSlug = slugify(entry.tipo || "sem-tipo");
    const groupStorageKey = context.collectionKey + "::" + typeSlug;
    const expanded = context.expandAll ? true : readCollapsedState(groupStorageKey, context.index === 0);
    const totalValue = sumValues(entry.records);
    const groupId = "grupo-" + context.collectionKey + "-" + typeSlug;
    const groupStateKey = buildGroupStateKey(container, groupStorageKey);
    const visibleCount = context.disablePagination
      ? entry.records.length
      : clamp(visibleCountState.get(groupStateKey) || PAGE_SIZE, PAGE_SIZE, entry.records.length);
    const pageRecords = context.disablePagination
      ? entry.records.slice()
      : entry.records.slice(0, visibleCount);

    visibleCountState.set(groupStateKey, visibleCount);

    article.className = "contract-group";
    article.dataset.groupId = groupStorageKey;
    article.style.setProperty("--group-accent", TYPE_ACCENTS[entry.tipo] || TYPE_ACCENTS["SEM TIPO"]);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "contract-group__toggle";
    toggle.dataset.groupToggle = groupStorageKey;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-controls", groupId);

    const main = document.createElement("span");
    main.className = "contract-group__main";

    const icon = document.createElement("span");
    icon.className = "contract-group__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = TYPE_ICONS[entry.tipo] || "CT";

    const titleWrap = document.createElement("span");
    const title = document.createElement("h3");
    title.className = "contract-group__title";
    title.textContent = titleCase(entry.tipo || "Sem tipo");

    const subtitle = document.createElement("p");
    subtitle.className = "contract-group__subtitle";
    subtitle.textContent = "agrupamento por tipo";

    titleWrap.append(title, subtitle);
    main.append(icon, titleWrap);

    const meta = document.createElement("span");
    meta.className = "contract-group__meta";

    const summaryText = document.createElement("span");
    summaryText.className = "contract-group__summary-text mono";
    summaryText.textContent =
      formatCount(entry.records.length) + " \u00b7 " + formatCompactCurrency(totalValue);

    const chevron = document.createElement("span");
    chevron.className = "contract-group__chevron mono";
    chevron.dataset.chevron = "true";
    chevron.textContent = expanded ? "▼" : "▶";

    meta.append(summaryText, chevron);
    toggle.append(main, meta);

    const body = document.createElement("div");
    body.className = "contract-group__body";
    body.id = groupId;
    body.hidden = !expanded;

    body.appendChild(createDesktopTable(entry.tipo, pageRecords, context.order, context.searchQuery));
    body.appendChild(createMobileCards(pageRecords, context.searchQuery));

    if (!context.disablePagination && entry.records.length > visibleCount) {
      body.appendChild(
        createLoadMore({
          groupKey: groupStorageKey,
          totalItems: entry.records.length,
          visibleItems: visibleCount
        })
      );
    }

    article.append(toggle, body);
    return article;
  }

  function createDesktopTable(tipo, records, order, searchQuery) {
    const wrap = document.createElement("div");
    wrap.className = "contract-group__table-wrap";

    const table = document.createElement("table");
    table.className = "table contracts-table";

    const caption = document.createElement("caption");
    caption.className = "sr-only";
    caption.textContent = titleCase(tipo || "Sem tipo") + " — contratos do recorte atual";
    table.appendChild(caption);

    const colgroup = document.createElement("colgroup");
    for (let index = 0; index < 7; index += 1) {
      colgroup.appendChild(document.createElement("col"));
    }
    table.appendChild(colgroup);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const sortMeta = getSortMetadata(order);

    [
      { label: "Contrato", key: "contrato" },
      { label: "Empresa", key: "empresa" },
      { label: "Objeto", key: "objeto" },
      { label: "Valor", key: "valor" },
      { label: "Vencimento", key: "vencimento" },
      { label: "Dias", key: "dias" },
      { label: "Status", key: "status" }
    ].forEach(function (column) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = column.label;
      if (sortMeta.column === column.key) {
        th.setAttribute("aria-sort", sortMeta.direction);
      }
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    records.forEach(function (record) {
      tbody.appendChild(createTableRow(record, searchQuery));
    });
    table.appendChild(tbody);

    wrap.appendChild(table);
    return wrap;
  }

  function createTableRow(record, searchQuery) {
    const row = document.createElement("tr");
    row.dataset.clickable = "true";
    row.dataset.contractId = String(record.id);
    row.dataset.riskLevel = isCriticalUrgency(record) ? "critical" : record && record.situacao ? record.situacao.key : "";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", "Abrir detalhes do contrato " + (record.contrato || record.id));
    if (isHighRisk(record)) {
      row.classList.add("contracts-table__row--risk");
    }
    if (isCriticalUrgency(record)) {
      row.classList.add("contracts-table__row--critical");
    }

    const contractCell = document.createElement("td");
    contractCell.className = "contracts-table__cell contracts-table__cell--contract mono";
    contractCell.dataset.label = "Contrato";
    contractCell.textContent = getDisplayText(record.contrato);

    const companyCell = document.createElement("td");
    companyCell.className = "contracts-table__cell contracts-table__cell--company";
    companyCell.dataset.label = "Empresa";
    setHighlightedContent(companyCell, uppercaseText(getDisplayText(record.empresa)), searchQuery);

    const objectCell = document.createElement("td");
    objectCell.className = "contracts-table__cell contracts-table__cell--object";
    objectCell.dataset.label = "Objeto";
    objectCell.title = getDisplayText(record.objeto);
    setHighlightedContent(
      objectCell,
      truncateText(getDisplayText(record.objeto), 50),
      searchQuery
    );

    const valueCell = document.createElement("td");
    valueCell.className = "contracts-table__cell contracts-table__cell--value mono";
    valueCell.dataset.label = "Valor";
    valueCell.textContent = formatTableCurrency(record.valor, record.valor_informado);
    valueCell.title = hasProvidedNumber(record.valor, record.valor_informado)
      ? "Valor completo: " + formatCurrency(record.valor)
      : "Valor não informado";

    const dueCell = document.createElement("td");
    dueCell.className = "contracts-table__cell contracts-table__cell--vencimento";
    dueCell.dataset.label = "Vencimento";
    dueCell.textContent = record.vencimento ? formatDate(record.vencimento) : "Sem data";

    const daysCell = document.createElement("td");
    daysCell.className = "contracts-table__cell contracts-table__cell--dias mono";
    daysCell.dataset.label = "Dias";
    const daysBadge = document.createElement("span");
    const daysInfo = getDaysDisplay(record);
    daysBadge.className = "days-chip mono " + daysInfo.className;
    daysBadge.textContent = daysInfo.label;
    daysCell.appendChild(daysBadge);

    const statusCell = document.createElement("td");
    statusCell.className = "contracts-table__cell contracts-table__cell--status";
    statusCell.dataset.label = "Status";
    const statusBadge = document.createElement("span");
    statusBadge.className = "status-badge " + (record.situacao ? record.situacao.badgeClass : "");
    if (isCriticalUrgency(record)) {
      statusBadge.classList.add("status-badge--critical");
    }
    statusBadge.textContent = getBadgeLabel(record);
    statusBadge.title = getStatusTooltip(record);
    statusCell.appendChild(statusBadge);

    row.append(
      contractCell,
      companyCell,
      objectCell,
      valueCell,
      dueCell,
      daysCell,
      statusCell
    );

    return row;
  }

  function createMobileCards(records, searchQuery) {
    const wrap = document.createElement("div");
    wrap.className = "contract-group__cards";

    records.forEach(function (record) {
      const card = document.createElement("article");
      card.className = "contract-card";
      card.dataset.contractId = String(record.id);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Abrir detalhes do contrato " + (record.contrato || record.id));

      const top = document.createElement("div");
      top.className = "contract-card__top";

      const status = document.createElement("span");
      status.className = "status-badge " + (record.situacao ? record.situacao.badgeClass : "");
      if (isCriticalUrgency(record)) {
        status.classList.add("status-badge--critical");
      }
      status.textContent = getBadgeLabel(record);
      status.title = getStatusTooltip(record);

      const contract = document.createElement("span");
      contract.className = "contract-card__contract mono";
      contract.textContent = getDisplayText(record.contrato);
      top.append(contract, status);

      const company = document.createElement("p");
      company.className = "contract-card__company";
      setHighlightedContent(company, uppercaseText(getDisplayText(record.empresa)), searchQuery);

      const object = document.createElement("p");
      object.className = "contract-card__object";
      object.title = getDisplayText(record.objeto);
      setHighlightedContent(object, getDisplayText(record.objeto), searchQuery);

      const footer = document.createElement("div");
      footer.className = "contract-card__footer";

      const value = document.createElement("span");
      value.className = "contract-card__value mono";
      value.textContent = formatOptionalCurrency(record.valor, record.valor_informado, "—");
      value.title = hasProvidedNumber(record.valor, record.valor_informado)
        ? "Valor completo: " + formatCurrency(record.valor)
        : "Valor não informado";

      const dueInfo = getDaysDisplay(record);
      const due = document.createElement("span");
      due.className = "contract-card__due " + dueInfo.className;
      due.textContent = getMobileDueLabel(record);

      card.classList.add(getCardToneClass(record));
      if (isCriticalUrgency(record)) {
        card.classList.add("contract-card--critical");
      }
      footer.append(value, due);
      card.append(top, company, object, footer);
      wrap.appendChild(card);
    });

    return wrap;
  }

  function createLoadMore(info) {
    const wrapper = document.createElement("div");
    wrapper.className = "group-pagination";

    const text = document.createElement("p");
    text.className = "group-pagination__info";
    text.textContent = "Mostrando " + info.visibleItems + " de " + info.totalItems;

    const actions = document.createElement("div");
    actions.className = "group-pagination__actions";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "group-pagination__button";
    next.dataset.loadMore = "true";
    next.dataset.groupKey = info.groupKey;
    next.dataset.totalItems = String(info.totalItems);
    next.textContent = "Mostrar mais";

    actions.append(next);
    wrapper.append(text, actions);
    return wrapper;
  }

  function createEmptyState(title, message, suggestion) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state empty-state--search";
    wrapper.setAttribute("role", "status");
    wrapper.setAttribute("aria-live", "polite");

    const icon = document.createElement("div");
    icon.className = "empty-state__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(createSearchSvg());

    const titleElement = document.createElement("p");
    titleElement.className = "empty-state__title";
    titleElement.textContent = title;

    const text = document.createElement("p");
    text.className = "empty-state__text";
    text.textContent = message;

    const suggestionLine = document.createElement("p");
    suggestionLine.className = "empty-state__suggestion";

    if (suggestion && suggestion.key && suggestion.label) {
      suggestionLine.appendChild(document.createTextNode('Tente remover o filtro "'));
      const suggestionButton = document.createElement("button");
      suggestionButton.type = "button";
      suggestionButton.className = "empty-state__link";
      suggestionButton.dataset.emptySuggest = "true";
      suggestionButton.dataset.filterKey = suggestion.key;
      suggestionButton.textContent = suggestion.label;
      suggestionLine.appendChild(suggestionButton);
      suggestionLine.appendChild(document.createTextNode('" ou limpar todos os filtros.'));
    } else {
      suggestionLine.textContent = "Tente remover um filtro ativo ou ampliar a busca para encontrar mais contratos.";
    }

    const actions = document.createElement("div");
    actions.className = "empty-state__actions";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "toolbar-button toolbar-button--ghost";
    clearButton.dataset.emptyClear = "true";
    clearButton.textContent = "Limpar filtros";
    actions.appendChild(clearButton);

    wrapper.append(icon, titleElement, text, suggestionLine, actions);
    return wrapper;
  }

  function createSearchSvg() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("width", "80");
    svg.setAttribute("height", "80");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "3");

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "27");
    circle.setAttribute("cy", "27");
    circle.setAttribute("r", "16");

    const handle = document.createElementNS(SVG_NS, "path");
    handle.setAttribute("d", "M39 39 L53 53");
    handle.setAttribute("stroke-linecap", "round");

    const dash = document.createElementNS(SVG_NS, "path");
    dash.setAttribute("d", "M19 27 H35");
    dash.setAttribute("stroke-linecap", "round");

    svg.append(circle, handle, dash);
    return svg;
  }
}

function setHighlightedContent(target, text, query) {
  target.replaceChildren(buildHighlightedFragment(text, query));
}

function buildHighlightedFragment(text, query) {
  const source = String(text || "");
  const term = normalizeText(query);

  if (!source || !term) {
    return document.createTextNode(source);
  }

  const indexed = buildIndexedNormalizedText(source);
  const ranges = [];
  let searchFrom = 0;

  while (searchFrom < indexed.normalized.length) {
    const matchIndex = indexed.normalized.indexOf(term, searchFrom);
    if (matchIndex === -1) {
      break;
    }

    const start = indexed.map[matchIndex];
    const endIndex = matchIndex + term.length - 1;
    const end = (indexed.map[endIndex] || start) + 1;
    ranges.push([start, end]);
    searchFrom = matchIndex + term.length;
  }

  if (!ranges.length) {
    return document.createTextNode(source);
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  mergeRanges(ranges).forEach(function (range) {
    if (cursor < range[0]) {
      fragment.appendChild(document.createTextNode(source.slice(cursor, range[0])));
    }
    const mark = document.createElement("mark");
    mark.textContent = source.slice(range[0], range[1]);
    fragment.appendChild(mark);
    cursor = range[1];
  });

  if (cursor < source.length) {
    fragment.appendChild(document.createTextNode(source.slice(cursor)));
  }

  return fragment;
}

function buildIndexedNormalizedText(text) {
  let normalized = "";
  const map = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = text[index]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (let inner = 0; inner < normalizedChar.length; inner += 1) {
      normalized += normalizedChar[inner];
      map.push(index);
    }
  }

  return {
    normalized: normalized,
    map: map
  };
}

function mergeRanges(ranges) {
  return ranges.reduce(function (accumulator, range) {
    if (!accumulator.length) {
      accumulator.push(range.slice());
      return accumulator;
    }

    const last = accumulator[accumulator.length - 1];
    if (range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      accumulator.push(range.slice());
    }
    return accumulator;
  }, []);
}

function uppercaseText(value) {
  const text = String(value || "").trim();
  return text ? text.toLocaleUpperCase("pt-BR") : "";
}

function truncateText(value, limit) {
  const text = String(value || "").trim();
  return text;
}

function getDisplayText(value) {
  const text = String(value || "").trim();
  return text || "Não informado";
}

function getDaysDisplay(record) {
  if (record.dias_para_vencimento == null) {
    return {
      label: "—",
      className: "days-chip--muted"
    };
  }

  if (record.dias_para_vencimento < 0) {
    return {
      label: Math.abs(record.dias_para_vencimento) + "d",
      className: "days-chip--expired"
    };
  }

  if (record.dias_para_vencimento <= 30) {
    return {
      label: record.dias_para_vencimento + "d",
      className: "days-chip--urgent"
    };
  }

  if (record.dias_para_vencimento <= 90) {
    return {
      label: record.dias_para_vencimento + "d",
      className: "days-chip--warning"
    };
  }

  return {
    label: record.dias_para_vencimento + "d",
    className: "days-chip--regular"
  };
}

function getMobileDueLabel(record) {
  if (record.dias_para_vencimento == null) {
    return record.situacao && record.situacao.key === "em_andamento"
      ? "Em andamento"
      : record.situacao && record.situacao.key === "nao_assinou"
        ? "Não assinou"
        : "Sem vigência";
  }

  if (record.dias_para_vencimento < 0) {
    return "Encerrado há " + Math.abs(record.dias_para_vencimento) + "d";
  }

  return "Vence em " + record.dias_para_vencimento + " dias";
}

function getCardToneClass(record) {
  const situation = record && record.situacao ? record.situacao.key : "";
  switch (situation) {
    case "vence_30":
      return "contract-card--urgent";
    case "vence_31_90":
      return "contract-card--warning";
    case "vigente_regular":
      return "contract-card--regular";
    case "encerrado":
      return "contract-card--expired";
    case "em_andamento":
      return "contract-card--info";
    case "nao_assinou":
      return "contract-card--pending";
    case "sem_vigencia":
    default:
      return "contract-card--muted";
  }
}

function isHighRisk(record) {
  return Boolean(
    record &&
    typeof record.dias_para_vencimento === "number" &&
    record.dias_para_vencimento >= 0 &&
    record.dias_para_vencimento <= 30
  );
}

function isCriticalUrgency(record) {
  return Boolean(
    record &&
    typeof record.dias_para_vencimento === "number" &&
    record.dias_para_vencimento >= 0 &&
    record.dias_para_vencimento <= 7
  );
}

function getBadgeLabel(record) {
  if (!record || !record.situacao) {
    return "Sem vigência";
  }

  switch (record.situacao.key) {
    case "vigente_regular":
      return "Vigente";
    case "vence_30":
      return "⚠️ Vence em ≤30d";
    case "vence_31_90":
      return "Vence 31-90d";
    case "encerrado":
      return "Encerrado";
    case "em_andamento":
      return "Em andamento";
    case "nao_assinou":
      return "Não assinou";
    case "sem_vigencia":
    default:
      return "Sem vigência";
  }
}

function getStatusTooltip(record) {
  if (!record || !record.situacao) {
    return "Situação pendente de classificação";
  }

  if (record.dias_para_vencimento == null) {
    if (record.situacao.key === "em_andamento") {
      return "Contrato em andamento sem data final informada";
    }
    if (record.situacao.key === "nao_assinou") {
      return "Contrato ainda não assinado";
    }
    return "Vigência não informada";
  }

  if (record.dias_para_vencimento < 0) {
    return "Encerrado há " + Math.abs(record.dias_para_vencimento) + " dias";
  }

  if (isCriticalUrgency(record)) {
    return "Atenção crítica: vence em " + record.dias_para_vencimento + " dias" +
      (record.vencimento ? " (" + formatDate(record.vencimento) + ")" : "");
  }

  return "Vence em " + record.dias_para_vencimento + " dias" +
    (record.vencimento ? " (" + formatDate(record.vencimento) + ")" : "");
}

function formatTableCurrency(value, wasProvided) {
  if (!hasProvidedNumber(value, wasProvided)) {
    return "—";
  }
  return tableCurrencyFormatter.format(Number(value));
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  if (amount >= 1000000000) {
    return "R$ " + (amount / 1000000000).toFixed(1).replace(".", ",") + " bi";
  }
  if (amount >= 1000000) {
    return "R$ " + (amount / 1000000).toFixed(1).replace(".", ",") + "M";
  }
  if (amount >= 1000) {
    return "R$ " + (amount / 1000).toFixed(1).replace(".", ",") + " mil";
  }
  return formatTableCurrency(amount);
}

function getSortMetadata(order) {
  switch (order) {
    case "vigencia":
      return { column: "vencimento", direction: "ascending" };
    case "maior_valor":
      return { column: "valor", direction: "descending" };
    case "menor_valor":
      return { column: "valor", direction: "ascending" };
    case "fornecedor":
      return { column: "empresa", direction: "ascending" };
    case "ano_desc":
      return { column: "contrato", direction: "descending" };
    case "risco":
    default:
      return { column: "dias", direction: "ascending" };
  }
}

function getDominantSituation(records) {
  return records
    .slice()
    .sort(function (a, b) {
      if ((a.situacao ? a.situacao.order : 99) !== (b.situacao ? b.situacao.order : 99)) {
        return (a.situacao ? a.situacao.order : 99) - (b.situacao ? b.situacao.order : 99);
      }
      return compareText(a.empresa, b.empresa);
    })[0].situacao.key;
}

function sumValues(records) {
  return records.reduce(function (total, record) {
    return total + (record.valor || 0);
  }, 0);
}

function formatCount(count) {
  return count + (count === 1 ? " contrato" : " contratos");
}

function buildGroupStateKey(container, groupKey) {
  return (container ? container.id : "grupo") + "::" + groupKey;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return String(value || "").replace(/"/g, '\\"');
}

function readCollapsedState(key, fallback) {
  if (!key) {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(COLLAPSE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (typeof parsed[key] === "boolean") {
      return parsed[key];
    }
  } catch (error) {
    return fallback;
  }

  return fallback;
}

function writeCollapsedState(key, expanded) {
  if (!key) {
    return;
  }

  try {
    const raw = window.sessionStorage.getItem(COLLAPSE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = Boolean(expanded);
    window.sessionStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    return;
  }
}
