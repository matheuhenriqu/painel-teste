import { formatCompactCurrency, formatCurrency } from "./utils.js";

export function computeIndicatorTotals(records) {
  const items = Array.isArray(records) ? records : [];

  return {
    total: items.length,
    valor: items.reduce(function (sum, record) {
      return sum + (record && record.valor ? record.valor : 0);
    }, 0),
    vence30: items.filter(function (record) {
      return record && record.situacao && record.situacao.key === "vence_30";
    }).length,
    vence90: items.filter(function (record) {
      return record && record.situacao && record.situacao.key === "vence_31_90";
    }).length,
    semVigencia: items.filter(function (record) {
      return record && record.situacao && record.situacao.key === "sem_vigencia";
    }).length,
    pendencias: items.filter(function (record) {
      return record && Array.isArray(record.campos_pendentes) && record.campos_pendentes.length > 0;
    }).length
  };
}

export function getDatasetTotalValue(dataset) {
  if (!dataset || !Array.isArray(dataset.contratos)) {
    return 0;
  }

  return dataset.contratos.reduce(function (sum, record) {
    return sum + (record && record.valor ? record.valor : 0);
  }, 0);
}

export function applyIndicators(config) {
  const settings = Object.assign(
    {
      totals: computeIndicatorTotals([]),
      dataset: null,
      kpis: null,
      cards: null,
      loadingController: null
    },
    config || {}
  );

  if (!settings.kpis || !settings.cards) {
    return settings.totals;
  }

  if (settings.loadingController) {
    settings.loadingController.animateValue(settings.kpis.total, settings.totals.total, "number");
    settings.loadingController.animateValue(settings.kpis.valor, settings.totals.valor, "compact_currency");
    settings.loadingController.animateValue(settings.kpis.vence30, settings.totals.vence30, "number");
    settings.loadingController.animateValue(settings.kpis.vence90, settings.totals.vence90, "number");
    settings.loadingController.animateValue(settings.kpis.semVigencia, settings.totals.semVigencia, "number");
    settings.loadingController.animateValue(settings.kpis.pendencias, settings.totals.pendencias, "number");
  } else {
    setStaticCount(settings.kpis.total, settings.totals.total);
    setStaticCount(settings.kpis.valor, settings.totals.valor, "compact_currency");
    setStaticCount(settings.kpis.vence30, settings.totals.vence30);
    setStaticCount(settings.kpis.vence90, settings.totals.vence90);
    setStaticCount(settings.kpis.semVigencia, settings.totals.semVigencia);
    setStaticCount(settings.kpis.pendencias, settings.totals.pendencias);
  }

  if (settings.kpis.valor) {
    settings.kpis.valor.title = formatCurrency(settings.totals.valor);
  }

  setKpiState(settings.cards.vence30, settings.totals.vence30);
  setKpiState(settings.cards.vence90, settings.totals.vence90);
  setKpiState(settings.cards.semVigencia, settings.totals.semVigencia);
  setKpiState(settings.cards.pendencias, settings.totals.pendencias);

  const datasetTotal = settings.dataset && settings.dataset.metadata
    ? (settings.dataset.metadata.total_registros || settings.totals.total)
    : settings.totals.total;

  setCardFill(settings.cards.total, settings.totals.total, datasetTotal);
  setCardFill(settings.cards.valor, settings.totals.valor, getDatasetTotalValue(settings.dataset));
  setCardFill(settings.cards.vence30, settings.totals.vence30, datasetTotal || 1);
  setCardFill(settings.cards.vence90, settings.totals.vence90, datasetTotal || 1);
  setCardFill(settings.cards.semVigencia, settings.totals.semVigencia, datasetTotal || 1);
  setCardFill(settings.cards.pendencias, settings.totals.pendencias, datasetTotal || 1);

  return settings.totals;
}

function setStaticCount(element, target, format) {
  if (!element) {
    return;
  }

  const targetValue = Number(target) || 0;
  element.dataset.currentValue = String(targetValue);
  if (format === "compact_currency") {
    element.textContent = formatCompactCurrency(targetValue);
    return;
  }
  if (format === "currency") {
    element.textContent = formatCurrency(targetValue);
    return;
  }
  element.textContent = new Intl.NumberFormat("pt-BR").format(Math.round(targetValue));
}

function setKpiState(card, value) {
  if (!card) {
    return;
  }

  card.classList.toggle("is-muted", Number(value) === 0);
  if (card.id === "kpi-vencem-30") {
    card.classList.toggle("kpi-card--alert-active", Number(value) > 0);
  }
}

function setCardFill(card, value, max) {
  if (!card) {
    return;
  }

  const ratio = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  card.style.setProperty("--card-fill", Math.min(100, ratio) + "%");
}
