import {
  compareText,
  formatCurrency,
  formatDate,
  titleCase
} from "./utils.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const TYPE_ORDER = [
  "PREGÃO ELETRÔNICO",
  "PRORROGAÇÃO",
  "CONCORRÊNCIA ELETRÔNICA",
  "LOCAÇÃO",
  "CHAMADA PÚBLICA",
  "TOMADA DE PREÇOS",
  "CONCORRÊNCIA PRESENCIAL",
  "DISPENSA"
];

const TYPE_COLOR_VARS = {
  "PREGÃO ELETRÔNICO": { variable: "--chart-type-pregao", fallback: "#3B82F6" },
  "PRORROGAÇÃO": { variable: "--chart-type-prorrogacao", fallback: "#8B5CF6" },
  "CONCORRÊNCIA ELETRÔNICA": { variable: "--chart-type-concorrencia-eletronica", fallback: "#06B6D4" },
  "LOCAÇÃO": { variable: "--chart-type-locacao", fallback: "#10B981" },
  "CHAMADA PÚBLICA": { variable: "--chart-type-chamada-publica", fallback: "#F59E0B" },
  "TOMADA DE PREÇOS": { variable: "--chart-type-tomada-precos", fallback: "#EF4444" },
  "CONCORRÊNCIA PRESENCIAL": { variable: "--chart-type-concorrencia-presencial", fallback: "#EC4899" },
  "DISPENSA": { variable: "--chart-type-dispensa", fallback: "#6B7280" }
};

export function renderDonut(data, container, options) {
  const records = Array.isArray(data) ? data : [];
  const settings = Object.assign(
    {
      onTypeSelect: null,
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico."
    },
    options || {}
  );

  if (!container) {
    return;
  }

  clearContainer(container);

  const entries = buildTypeEntries(records);
  if (!entries.length) {
    container.appendChild(createEmptyChart(settings.emptyTitle, settings.emptyMessage));
    return;
  }

  const layout = createElement("div", "chart-donut-layout");
  const frame = createElement("div", "chart-frame chart-frame--donut");
  const legend = createElement("div", "chart-legend");
  const tooltip = createTooltip();
  const svg = createSvgElement("svg");
  const title = createSvgElement("title");
  const desc = createSvgElement("desc");
  const idBase = (container.id || "chart-donut") + "-svg";

  svg.setAttribute("viewBox", "0 0 320 320");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", idBase + "-title " + idBase + "-desc");
  title.id = idBase + "-title";
  desc.id = idBase + "-desc";
  title.textContent = "Distribuição de contratos por tipo";
  desc.textContent = "Gráfico de rosca com quantidade, percentual e valor total por tipo.";
  svg.append(title, desc);

  const track = createSvgElement("circle");
  track.setAttribute("cx", "160");
  track.setAttribute("cy", "160");
  track.setAttribute("r", "92");
  track.setAttribute("fill", "none");
  track.setAttribute("stroke-width", "32");
  track.setAttribute("class", "chart-svg__track");
  svg.appendChild(track);

  const total = records.length;
  const circumference = 2 * Math.PI * 92;
  let accumulated = 0;
  const animatedSegments = [];

  entries.forEach(function (entry) {
    const ratio = total ? entry.count / total : 0;
    const arcLength = circumference * ratio;
    const color = getTypeColor(entry.tipo, container);
    const segment = createSvgElement("circle");

    segment.setAttribute("cx", "160");
    segment.setAttribute("cy", "160");
    segment.setAttribute("r", "92");
    segment.setAttribute("fill", "none");
    segment.setAttribute("stroke", color);
    segment.setAttribute("stroke-width", "32");
    segment.setAttribute("stroke-linecap", "butt");
    segment.setAttribute("transform", "rotate(-90 160 160)");
    segment.setAttribute("class", "chart-arc");
    segment.style.strokeDasharray = "0 " + circumference;
    segment.style.strokeDashoffset = String(-accumulated * circumference);
    segment.dataset.tipo = entry.tipo;
    segment.setAttribute("tabindex", "0");
    segment.setAttribute("role", "button");
    segment.setAttribute("aria-label", titleCase(entry.tipo) + ": " + entry.count + " contratos");

    bindInteractiveShape(segment, {
      title: titleCase(entry.tipo),
      lines: [
        entry.count + " contrato(s) • " + formatPercent(ratio),
        formatCurrency(entry.value)
      ],
      container: container,
      tooltip: tooltip,
      onActivate: function () {
        if (typeof settings.onTypeSelect === "function") {
          settings.onTypeSelect(entry.tipo);
        }
      }
    });

    svg.appendChild(segment);
    animatedSegments.push({
      element: segment,
      dash: arcLength + " " + (circumference - arcLength),
      offset: String(-accumulated * circumference)
    });

    accumulated += ratio;

    const legendButton = createLegendButton(entry, color, ratio, function () {
      if (typeof settings.onTypeSelect === "function") {
        settings.onTypeSelect(entry.tipo);
      }
    });
    bindInteractiveShape(legendButton, {
      title: titleCase(entry.tipo),
      lines: [
        entry.count + " contrato(s) • " + formatPercent(ratio),
        formatCurrency(entry.value)
      ],
      container: container,
      tooltip: tooltip
    });
    legend.appendChild(legendButton);
  });

  const center = createElement("div", "chart-kpi");
  const centerValue = createElement("strong", "chart-kpi__value mono", String(total));
  const centerLabel = createElement("span", "chart-kpi__label", "contratos");
  center.append(centerValue, centerLabel);

  frame.append(svg, center);
  layout.append(frame, legend);
  container.append(layout, tooltip, createScreenReaderTable("Distribuição por tipo", ["Tipo", "Quantidade", "Percentual", "Valor total"], entries.map(function (entry) {
    return [
      titleCase(entry.tipo),
      String(entry.count),
      formatPercent(total ? entry.count / total : 0),
      formatCurrency(entry.value)
    ];
  })));

  window.requestAnimationFrame(function () {
    animatedSegments.forEach(function (segment) {
      segment.element.style.strokeDasharray = segment.dash;
      segment.element.style.strokeDashoffset = segment.offset;
    });
  });
}

export function renderTimeline(data, container, options) {
  const records = Array.isArray(data) ? data : [];
  const settings = Object.assign(
    {
      onContractSelect: null,
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para visualizar a timeline."
    },
    options || {}
  );

  if (!container) {
    return;
  }

  clearContainer(container);

  const urgent = records
    .filter(function (record) {
      return record.dias_para_vencimento != null &&
        record.dias_para_vencimento >= 0 &&
        record.dias_para_vencimento <= 90;
    })
    .slice()
    .sort(function (a, b) {
      return a.dias_para_vencimento - b.dias_para_vencimento || compareText(a.empresa, b.empresa);
    });

  if (!urgent.length) {
    container.appendChild(createEmptyChart(settings.emptyTitle, settings.emptyMessage));
    return;
  }

  const frame = createElement("div", "chart-frame chart-frame--timeline");
  const tooltip = createTooltip();
  const svg = createSvgElement("svg");
  const title = createSvgElement("title");
  const desc = createSvgElement("desc");
  const idBase = (container.id || "chart-timeline") + "-svg";
  const measuredWidth = Math.round(container.getBoundingClientRect().width || container.clientWidth || 0);
  const width = Math.max(320, measuredWidth || 920);
  const isCompact = width < 640;
  const padding = {
    top: isCompact ? 24 : 28,
    right: isCompact ? 18 : 28,
    bottom: isCompact ? 54 : 42,
    left: isCompact ? 18 : 32
  };
  const axisWidth = width - padding.left - padding.right;
  const laneCount = isCompact
    ? Math.max(4, Math.min(8, Math.ceil(urgent.length / 3)))
    : Math.max(3, Math.min(6, Math.ceil(urgent.length / 4)));
  const laneGap = isCompact ? 30 : 26;
  const laneTop = isCompact ? 66 : 68;
  const laneJitter = isCompact ? 10 : 8;
  const axisY = laneTop + (laneCount - 1) * laneGap + laneJitter + 24;
  const height = axisY + padding.bottom;
  const zoneY = laneTop - 28;
  const zoneHeight = axisY - laneTop + 42;
  const maxValue = Math.max.apply(null, urgent.map(function (record) {
    return record.valor || 0;
  }).concat([1]));
  const bubbles = [];

  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", idBase + "-title " + idBase + "-desc");
  title.id = idBase + "-title";
  desc.id = idBase + "-desc";
  title.textContent = "Timeline de vencimentos para os próximos noventa dias";
  desc.textContent = "Cada bolha representa um contrato com vencimento em até noventa dias. O tamanho indica o valor.";
  svg.append(title, desc);

  const immediateZone = createSvgElement("rect");
  immediateZone.setAttribute("x", String(padding.left));
  immediateZone.setAttribute("y", String(zoneY));
  immediateZone.setAttribute("width", String(axisWidth * (30 / 90)));
  immediateZone.setAttribute("height", String(zoneHeight));
  immediateZone.setAttribute("fill", "var(--danger)");
  immediateZone.setAttribute("class", "timeline-zone");

  const cautionZone = createSvgElement("rect");
  cautionZone.setAttribute("x", String(padding.left + axisWidth * (30 / 90)));
  cautionZone.setAttribute("y", String(zoneY));
  cautionZone.setAttribute("width", String(axisWidth * (30 / 90)));
  cautionZone.setAttribute("height", String(zoneHeight));
  cautionZone.setAttribute("fill", "var(--color-accent)");
  cautionZone.setAttribute("class", "timeline-zone");

  const attentionZone = createSvgElement("rect");
  attentionZone.setAttribute("x", String(padding.left + axisWidth * (60 / 90)));
  attentionZone.setAttribute("y", String(zoneY));
  attentionZone.setAttribute("width", String(axisWidth * (30 / 90)));
  attentionZone.setAttribute("height", String(zoneHeight));
  attentionZone.setAttribute("fill", "var(--color-warning)");
  attentionZone.setAttribute("class", "timeline-zone");

  const immediateLabel = createSvgElement("text");
  immediateLabel.setAttribute("x", String(padding.left + axisWidth * (15 / 90)));
  immediateLabel.setAttribute("y", String(laneTop - 10));
  immediateLabel.setAttribute("text-anchor", "middle");
  immediateLabel.setAttribute("class", "timeline-zone-label");
  immediateLabel.textContent = isCompact ? "0-30d" : "0-30 dias";

  const cautionLabel = createSvgElement("text");
  cautionLabel.setAttribute("x", String(padding.left + axisWidth * (45 / 90)));
  cautionLabel.setAttribute("y", String(laneTop - 10));
  cautionLabel.setAttribute("text-anchor", "middle");
  cautionLabel.setAttribute("class", "timeline-zone-label");
  cautionLabel.textContent = isCompact ? "31-60d" : "31-60 dias";

  const attentionLabel = createSvgElement("text");
  attentionLabel.setAttribute("x", String(padding.left + axisWidth * (75 / 90)));
  attentionLabel.setAttribute("y", String(laneTop - 10));
  attentionLabel.setAttribute("text-anchor", "middle");
  attentionLabel.setAttribute("class", "timeline-zone-label");
  attentionLabel.textContent = isCompact ? "61-90d" : "61-90 dias";

  svg.append(immediateZone, cautionZone, attentionZone, immediateLabel, cautionLabel, attentionLabel);

  [0, 30, 60, 90].forEach(function (tick) {
    const x = padding.left + (tick / 90) * axisWidth;
    const line = createSvgElement("line");
    line.setAttribute("x1", String(x));
    line.setAttribute("x2", String(x));
    line.setAttribute("y1", String(laneTop - 10));
    line.setAttribute("y2", String(axisY));
    line.setAttribute("class", tick === 0 ? "chart-axis" : "chart-grid-line");

    const label = createSvgElement("text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(axisY + 22));
    label.setAttribute("text-anchor", tick === 0 ? "start" : tick === 90 ? "end" : "middle");
    label.setAttribute("class", "chart-axis-label");
    label.textContent = tick === 0 ? "Hoje" : "+" + tick + "d";

    svg.append(line, label);
  });

  const axis = createSvgElement("line");
  axis.setAttribute("x1", String(padding.left));
  axis.setAttribute("x2", String(width - padding.right));
  axis.setAttribute("y1", String(axisY));
  axis.setAttribute("y2", String(axisY));
  axis.setAttribute("class", "chart-axis");
  svg.appendChild(axis);

  urgent.forEach(function (record, index) {
    const cx = padding.left + (record.dias_para_vencimento / 90) * axisWidth;
    const laneIndex = index % laneCount;
    const cy = laneTop + laneIndex * laneGap + (index % 2 === 0 ? 0 : laneJitter);
    const radius = (isCompact ? 4 : 5) + Math.sqrt((record.valor || 0) / maxValue) * (isCompact ? 14 : 18);
    const bubble = createSvgElement("circle");

    bubble.setAttribute("cx", String(cx));
    bubble.setAttribute("cy", String(cy));
    bubble.setAttribute("r", "0");
    bubble.setAttribute("fill", getTimelineBubbleColor(record.dias_para_vencimento));
    bubble.setAttribute("class", "timeline-bubble");
    bubble.dataset.contractId = String(record.id);
    bubble.setAttribute("tabindex", "0");
    bubble.setAttribute("role", "button");
    bubble.setAttribute("aria-label", (record.contrato || "Contrato") + " vence em " + record.dias_para_vencimento + " dias");

    bindInteractiveShape(bubble, {
      title: getDisplayText(record.empresa).toUpperCase(),
      lines: [
        truncateText(record.objeto || "Não informado", 70),
        formatCurrency(record.valor) + " • " + formatDate(record.vencimento)
      ],
      container: container,
      tooltip: tooltip,
      onActivate: function () {
        if (typeof settings.onContractSelect === "function") {
          settings.onContractSelect(record.id);
        }
      }
    });

    svg.appendChild(bubble);
    bubbles.push({
      element: bubble,
      radius: radius.toFixed(2)
    });
  });

  frame.append(svg);
  container.append(frame, tooltip, createScreenReaderTable("Timeline de vencimentos", ["Contrato", "Empresa", "Dias", "Vencimento", "Valor"], urgent.map(function (record) {
    return [
      getDisplayText(record.contrato),
      getDisplayText(record.empresa),
      String(record.dias_para_vencimento),
      formatDate(record.vencimento),
      formatCurrency(record.valor)
    ];
  })));

  window.requestAnimationFrame(function () {
    bubbles.forEach(function (bubble) {
      bubble.element.setAttribute("r", bubble.radius);
    });
  });
}

export function renderBars(data, container, options) {
  const records = Array.isArray(data) ? data : [];
  const settings = Object.assign(
    {
      onTypeSelect: null,
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico."
    },
    options || {}
  );

  if (!container) {
    return;
  }

  clearContainer(container);

  const years = buildYearEntries(records);
  if (!years.length) {
    container.appendChild(createEmptyChart(settings.emptyTitle, settings.emptyMessage));
    return;
  }

  const frame = createElement("div", "chart-frame chart-frame--bars");
  const tooltip = createTooltip();
  const svg = createSvgElement("svg");
  const title = createSvgElement("title");
  const desc = createSvgElement("desc");
  const idBase = (container.id || "chart-bars") + "-svg";
  const width = 920;
  const rowHeight = 26;
  const rowGap = 16;
  const height = 70 + years.length * (rowHeight + rowGap);
  const padding = { top: 24, right: 54, bottom: 20, left: 74 };
  const chartWidth = width - padding.left - padding.right;
  const maxTotal = Math.max.apply(null, years.map(function (year) {
    return year.total;
  }).concat([1]));

  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", idBase + "-title " + idBase + "-desc");
  title.id = idBase + "-title";
  desc.id = idBase + "-desc";
  title.textContent = "Contratos por ano";
  desc.textContent = "Barras horizontais empilhadas, segmentadas por tipo de contrato.";
  svg.append(title, desc);

  years.forEach(function (yearEntry, index) {
    const y = padding.top + index * (rowHeight + rowGap);
    const label = createSvgElement("text");
    label.setAttribute("x", String(padding.left - 12));
    label.setAttribute("y", String(y + rowHeight * 0.72));
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "chart-bar-label");
    label.textContent = String(yearEntry.ano);
    svg.appendChild(label);

    const track = createSvgElement("rect");
    track.setAttribute("x", String(padding.left));
    track.setAttribute("y", String(y));
    track.setAttribute("width", String(chartWidth));
    track.setAttribute("height", String(rowHeight));
    track.setAttribute("rx", "10");
    track.setAttribute("fill", "color-mix(in srgb, var(--surface-strong) 68%, transparent)");
    track.setAttribute("opacity", "0.18");
    svg.appendChild(track);

    let offset = padding.left;
    yearEntry.parts.forEach(function (part) {
      const partWidth = chartWidth * (part.count / maxTotal);
      if (partWidth <= 0) {
        return;
      }

      const rect = createSvgElement("rect");
      rect.setAttribute("x", String(offset));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(partWidth));
      rect.setAttribute("height", String(rowHeight));
      rect.setAttribute("rx", "10");
      rect.setAttribute("fill", getTypeColor(part.tipo, container));
      rect.setAttribute("class", "chart-bar-segment");
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute("aria-label", yearEntry.ano + ", " + titleCase(part.tipo) + ": " + part.count + " contratos");

      bindInteractiveShape(rect, {
        title: yearEntry.ano + " • " + titleCase(part.tipo),
        lines: [
          part.count + " contrato(s) no ano",
          "Total do ano: " + yearEntry.total
        ],
        container: container,
        tooltip: tooltip,
        onActivate: function () {
          if (typeof settings.onTypeSelect === "function") {
            settings.onTypeSelect(part.tipo);
          }
        }
      });

      svg.appendChild(rect);
      offset += partWidth;
    });

    const totalLabel = createSvgElement("text");
    totalLabel.setAttribute("x", String(padding.left + chartWidth + 8));
    totalLabel.setAttribute("y", String(y + rowHeight * 0.72));
    totalLabel.setAttribute("class", "chart-bar-total");
    totalLabel.textContent = String(yearEntry.total);
    svg.appendChild(totalLabel);
  });

  frame.append(svg);
  container.append(frame, tooltip, createScreenReaderTable("Contratos por ano", buildYearTableHeaders(), years.map(function (yearEntry) {
    const cells = [String(yearEntry.ano), String(yearEntry.total)];
    TYPE_ORDER.forEach(function (tipo) {
      const part = yearEntry.parts.find(function (entry) {
        return entry.tipo === tipo;
      });
      cells.push(String(part ? part.count : 0));
    });
    return cells;
  })));
}

export function renderGauge(value, container, options) {
  const percent = clamp(Number(value) || 0, 0, 100);
  const settings = Object.assign(
    {
      completeCount: 0,
      totalCount: 0,
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico."
    },
    options || {}
  );

  if (!container) {
    return;
  }

  clearContainer(container);

  if (!settings.totalCount) {
    container.appendChild(createEmptyChart(settings.emptyTitle, settings.emptyMessage));
    return;
  }

  const frame = createElement("div", "chart-frame chart-frame--gauge");
  const svg = createSvgElement("svg");
  const title = createSvgElement("title");
  const desc = createSvgElement("desc");
  const idBase = (container.id || "chart-gauge") + "-svg";
  const pathLength = Math.PI * 88;
  const gaugeColor = percent < 50 ? "var(--danger)" : percent < 80 ? "var(--warning)" : "var(--success)";

  svg.setAttribute("viewBox", "0 0 260 180");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", idBase + "-title " + idBase + "-desc");
  title.id = idBase + "-title";
  desc.id = idBase + "-desc";
  title.textContent = "Indicador de completude dos contratos";
  desc.textContent = percent.toFixed(0) + " por cento dos contratos do recorte não têm pendências.";
  svg.append(title, desc);

  const track = createSvgElement("path");
  track.setAttribute("d", "M42 132 A88 88 0 0 1 218 132");
  track.setAttribute("stroke-width", "18");
  track.setAttribute("class", "gauge-track");

  const gauge = createSvgElement("path");
  gauge.setAttribute("d", "M42 132 A88 88 0 0 1 218 132");
  gauge.setAttribute("stroke-width", "18");
  gauge.setAttribute("stroke", gaugeColor);
  gauge.setAttribute("class", "gauge-value");
  gauge.style.strokeDasharray = "0 " + pathLength;

  svg.append(track, gauge);

  const center = createElement("div", "gauge-center");
  center.append(
    createElement("strong", "gauge-center__value mono", Math.round(percent) + "%"),
    createElement("span", "gauge-center__label", "completos")
  );

  frame.append(svg, center);
  container.append(frame, createScreenReaderTable("Completude cadastral", ["Indicador", "Valor"], [[
    "Percentual completo",
    Math.round(percent) + "% (" + settings.completeCount + " de " + settings.totalCount + ")"
  ]]));

  window.requestAnimationFrame(function () {
    gauge.style.strokeDasharray = (pathLength * (percent / 100)).toFixed(2) + " " + pathLength.toFixed(2);
  });
}

function buildTypeEntries(records) {
  const totals = new Map();

  records.forEach(function (record) {
    const key = record.tipo || "SEM TIPO";
    if (!totals.has(key)) {
      totals.set(key, {
        tipo: key,
        count: 0,
        value: 0
      });
    }
    const bucket = totals.get(key);
    bucket.count += 1;
    bucket.value += record.valor || 0;
  });

  return TYPE_ORDER.filter(function (tipo) {
    return totals.has(tipo);
  }).concat(
    Array.from(totals.keys()).filter(function (tipo) {
      return !TYPE_ORDER.includes(tipo);
    }).sort(compareText)
  ).map(function (tipo) {
    return totals.get(tipo);
  });
}

function buildYearEntries(records) {
  const years = new Map();

  records.forEach(function (record) {
    const ano = record.ano || "Sem ano";
    if (!years.has(ano)) {
      years.set(ano, {
        ano: ano,
        total: 0,
        byType: new Map()
      });
    }

    const entry = years.get(ano);
    entry.total += 1;
    entry.byType.set(record.tipo || "SEM TIPO", (entry.byType.get(record.tipo || "SEM TIPO") || 0) + 1);
  });

  return Array.from(years.values())
    .sort(function (a, b) {
      return parseYearValue(b.ano) - parseYearValue(a.ano);
    })
    .map(function (yearEntry) {
      return {
        ano: yearEntry.ano,
        total: yearEntry.total,
        parts: buildTypeEntriesFromCountMap(yearEntry.byType)
      };
    });
}

function buildTypeEntriesFromCountMap(byType) {
  return TYPE_ORDER.filter(function (tipo) {
    return byType.has(tipo);
  }).concat(
    Array.from(byType.keys()).filter(function (tipo) {
      return !TYPE_ORDER.includes(tipo);
    }).sort(compareText)
  ).map(function (tipo) {
    return {
      tipo: tipo,
      count: byType.get(tipo) || 0
    };
  });
}

function buildYearTableHeaders() {
  return ["Ano", "Total"].concat(TYPE_ORDER.map(function (tipo) {
    return titleCase(tipo);
  }));
}

function createLegendButton(entry, color, ratio, onClick) {
  const button = createElement("button", "chart-legend__button");
  button.type = "button";

  const swatch = createElement("span", "chart-legend__swatch");
  swatch.style.background = color;

  const middle = document.createElement("span");
  const title = createElement("span", "chart-legend__title", titleCase(entry.tipo));
  const meta = createElement("span", "chart-legend__meta", entry.count + " contrato(s) • " + formatPercent(ratio));
  middle.append(title, meta);

  const value = createElement("span", "chart-legend__value mono", formatCurrency(entry.value));

  button.append(swatch, middle, value);
  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }
  return button;
}

function createScreenReaderTable(captionText, headers, rows) {
  const table = createElement("table", "sr-only");
  const caption = document.createElement("caption");
  caption.textContent = captionText;
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headers.forEach(function (header) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = header;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(caption);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(function (rowValues) {
    const row = document.createElement("tr");
    rowValues.forEach(function (value) {
      const td = document.createElement("td");
      td.textContent = String(value == null ? "" : value);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

function createEmptyChart(title, message) {
  const wrapper = createElement("div", "chart-empty");
  const inner = document.createElement("div");
  inner.append(
    createElement("strong", "", title),
    document.createTextNode(message)
  );
  wrapper.appendChild(inner);
  return wrapper;
}

function createTooltip() {
  return createElement("div", "chart-tooltip");
}

function bindInteractiveShape(element, config) {
  const settings = Object.assign(
    {
      title: "",
      lines: [],
      container: null,
      tooltip: null,
      onActivate: null
    },
    config || {}
  );

  const show = function (event) {
    if (!settings.tooltip || !settings.container) {
      return;
    }
    populateTooltip(settings.tooltip, settings.title, settings.lines);
    positionTooltip(settings.tooltip, settings.container, event);
    settings.tooltip.classList.add("is-visible");
    element.classList.add("is-active");
  };

  const move = function (event) {
    if (settings.tooltip && settings.container) {
      positionTooltip(settings.tooltip, settings.container, event);
    }
  };

  const hide = function () {
    if (settings.tooltip) {
      settings.tooltip.classList.remove("is-visible");
    }
    element.classList.remove("is-active");
  };

  element.addEventListener("mouseenter", show);
  element.addEventListener("mousemove", move);
  element.addEventListener("mouseleave", hide);
  element.addEventListener("focus", function (event) {
    show(event);
  });
  element.addEventListener("blur", hide);
  element.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (typeof settings.onActivate === "function") {
        settings.onActivate();
      }
    }
  });

  if (typeof settings.onActivate === "function") {
    element.addEventListener("click", function () {
      settings.onActivate();
    });
  }
}

function populateTooltip(tooltip, title, lines) {
  tooltip.replaceChildren();
  tooltip.appendChild(createElement("p", "chart-tooltip__title", title));
  (lines || []).forEach(function (line) {
    tooltip.appendChild(createElement("p", "chart-tooltip__line", line));
  });
}

function positionTooltip(tooltip, container, event) {
  if (!tooltip || !container) {
    return;
  }

  const rect = container.getBoundingClientRect();
  const x = (event && typeof event.clientX === "number") ? event.clientX : rect.left + rect.width / 2;
  const y = (event && typeof event.clientY === "number") ? event.clientY : rect.top + rect.height / 2;
  const tooltipWidth = tooltip.offsetWidth || 220;
  const offsetX = x - rect.left + 12;
  const offsetY = y - rect.top - 12;
  const maxLeft = Math.max(12, rect.width - tooltipWidth - 12);

  tooltip.style.left = Math.min(maxLeft, Math.max(12, offsetX)) + "px";
  tooltip.style.top = Math.max(12, offsetY) + "px";
}

function clearContainer(container) {
  container.replaceChildren();
}

function getTypeColor(tipo, element) {
  const entry = TYPE_COLOR_VARS[tipo] || TYPE_COLOR_VARS.DISPENSA;
  const style = window.getComputedStyle(element);
  const value = style.getPropertyValue(entry.variable).trim();
  return value || entry.fallback;
}

function getTimelineBubbleColor(days) {
  if (days <= 30) {
    return "var(--color-danger)";
  }
  if (days <= 60) {
    return "var(--color-accent)";
  }
  return "var(--color-warning)";
}

function formatPercent(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseYearValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : -1;
}

function truncateText(value, limit) {
  const text = String(value || "").trim();
  return text;
}

function getDisplayText(value) {
  const text = String(value || "").trim();
  return text || "Não informado";
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (typeof text !== "undefined") {
    element.textContent = text;
  }
  return element;
}

function createSvgElement(tag) {
  return document.createElementNS(SVG_NS, tag);
}
