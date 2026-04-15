const CACHE_KEY = "iguape-contratos-cache-v1";
const CACHE_META_KEY = "iguape-contratos-cache-meta-v1";
const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const REQUIRED_FIELDS = ["id", "tipo", "objeto", "processo", "contrato", "empresa", "ano"];
const REQUIRED_NULLABLE_FIELDS = ["contrato", "valor", "empresa", "data_inicio", "vencimento", "gestor", "fiscal"];

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base"
});

const STATUS_SPECIAL_LABELS = {
  em_andamento: "Em andamento",
  nao_assinou: "Não assinou",
  nao_iniciou: "Não iniciou",
  publicado: "Publicado",
  iphan: "Aguardando IPHAN"
};

const SITUATION_LABELS = {
  vigente_regular: "Vigente",
  vence_30: "Vence em ≤30d",
  vence_31_90: "Vence em 31-90 dias",
  encerrado: "Encerrado",
  sem_vigencia: "Sem vigência",
  em_andamento: "Em andamento",
  nao_assinou: "Não assinou"
};

const SITUATION_BADGES = {
  vigente_regular: "status-badge--vigente",
  vence_30: "status-badge--urgente",
  vence_31_90: "status-badge--atencao",
  encerrado: "status-badge--encerrado",
  sem_vigencia: "status-badge--sem-vigencia",
  em_andamento: "status-badge--andamento",
  nao_assinou: "status-badge--pendente"
};

const RISK_ORDER = {
  vence_30: 0,
  vence_31_90: 1,
  vigente_regular: 2,
  em_andamento: 3,
  nao_assinou: 4,
  sem_vigencia: 5,
  encerrado: 6
};

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s/(-])([\p{L}])/gu, function (_, start, letter) {
      return start + letter.toLocaleUpperCase("pt-BR");
    });
}

export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "Não informado";
  }

  return moneyFormatter.format(Number(value));
}

export function parseIsoDate(value) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  parsed.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatDate(value) {
  const parsed = value instanceof Date ? value : parseIsoDate(value);
  return parsed ? dateFormatter.format(parsed) : "Sem data";
}

export function formatDateTime(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? dateTimeFormatter.format(parsed) : "Sem data";
}

export function getStatusBadgeClass(situationKey) {
  return SITUATION_BADGES[situationKey] || "status-badge--sem-vigencia";
}

export function getSituationLabel(situationKey) {
  return SITUATION_LABELS[situationKey] || "Sem vigência";
}

export function getSpecialStatusLabel(statusKey) {
  return STATUS_SPECIAL_LABELS[normalizeStatusKey(statusKey)] || "";
}

export function compareText(a, b) {
  return collator.compare(String(a || ""), String(b || ""));
}

export function startOfToday(referenceDate) {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function renderLoadMessage(container, options) {
  if (!container) {
    return null;
  }

  const config = Object.assign(
    {
      type: "info",
      title: "",
      message: "",
      actionLabel: "",
      actionId: ""
    },
    options || {}
  );

  container.className = "load-banner";
  container.classList.add("load-banner--" + config.type);
  container.classList.remove("is-hidden");
  container.setAttribute("role", config.type === "error" ? "alert" : "status");
  container.setAttribute("aria-live", config.type === "error" ? "assertive" : "polite");
  container.setAttribute("aria-atomic", "true");
  container.replaceChildren();

  const content = document.createElement("div");
  content.className = "load-banner__content";

  const title = document.createElement("p");
  title.className = "load-banner__title";
  title.textContent = config.title;

  const message = document.createElement("p");
  message.className = "load-banner__message";
  message.textContent = config.message;

  content.append(title, message);
  container.appendChild(content);

  if (config.actionLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toolbar-button";
    button.id = config.actionId || "";
    button.textContent = config.actionLabel;
    container.appendChild(button);
    return button;
  }

  return null;
}

export function clearLoadMessage(container) {
  if (!container) {
    return;
  }

  container.className = "load-banner is-hidden";
  container.setAttribute("role", "status");
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  container.replaceChildren();
}

export function setKpiLoading(root) {
  const scope = root || document;
  const cards = scope.querySelectorAll(".kpi-card");
  cards.forEach(function (card) {
    card.classList.add("is-loading");
  });

  return cards;
}

export function clearKpiLoading(root) {
  const scope = root || document;
  scope.querySelectorAll(".kpi-card.is-loading").forEach(function (card) {
    card.classList.remove("is-loading");
  });
}

function safeSessionStorage(method, key, value) {
  try {
    return window.sessionStorage[method](key, value);
  } catch (error) {
    return null;
  }
}

function wait(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, ms);
  });
}

function normalizeStatusKey(value) {
  return normalizeText(value).replace(/-/g, "_");
}

function toFiniteNumber(value) {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
}

function toNullableText(value) {
  const text = String(value == null ? "" : value).trim();
  return text || null;
}

function toNullableYear(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
}

function buildPendingFields(record) {
  const pending = [];

  REQUIRED_NULLABLE_FIELDS.forEach(function (field) {
    const value = record[field];
    const isMissing = value == null || value === "";
    if (isMissing) {
      pending.push(field);
    }
  });

  return pending;
}

function getSearchableText(record) {
  return normalizeText([
    record.contrato,
    record.empresa,
    record.objeto,
    record.processo,
    record.gestor
  ].join(" "));
}

function deriveSituation(record, referenceDate) {
  const normalizedStatus = normalizeStatusKey(record.status_especial);
  const dueDate = parseIsoDate(record.vencimento);
  const today = startOfToday(referenceDate);
  const daysToDue = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)
    : null;

  let key = "sem_vigencia";

  if (!dueDate) {
    if (normalizedStatus === "em_andamento") {
      key = "em_andamento";
    } else if (normalizedStatus === "nao_assinou") {
      key = "nao_assinou";
    } else {
      key = "sem_vigencia";
    }
  } else if (daysToDue < 0) {
    key = "encerrado";
  } else if (daysToDue <= 30) {
    key = "vence_30";
  } else if (daysToDue <= 90) {
    key = "vence_31_90";
  } else {
    key = "vigente_regular";
  }

  return {
    key: key,
    label: getSituationLabel(key),
    badgeClass: getStatusBadgeClass(key),
    diasParaVencimento: daysToDue,
    order: RISK_ORDER[key] ?? 99
  };
}

function sanitizeContract(item, index, referenceDate) {
  const record = {
    id: Number.isInteger(Number(item.id)) ? Number(item.id) : index + 1,
    tipo: toNullableText(item.tipo),
    modalidade: toNullableText(item.modalidade),
    objeto: toNullableText(item.objeto),
    processo: toNullableText(item.processo),
    contrato: toNullableText(item.contrato),
    valor: toFiniteNumber(item.valor),
    empresa: toNullableText(item.empresa),
    data_inicio: parseIsoDate(item.data_inicio) ? String(item.data_inicio) : null,
    vencimento: parseIsoDate(item.vencimento) ? String(item.vencimento) : null,
    observacoes: toNullableText(item.observacoes),
    gestor: toNullableText(item.gestor),
    fiscal: toNullableText(item.fiscal),
    status_especial: toNullableText(item.status_especial),
    ano: toNullableYear(item.ano),
    area_referencia: toNullableText(item.area_referencia)
  };

  const pending = Array.isArray(item.campos_pendentes)
    ? item.campos_pendentes.filter(Boolean)
    : buildPendingFields(record);

  const situation = deriveSituation(record, referenceDate);
  const normalized = {
    tipo: slugify(record.tipo),
    gestor: slugify(record.gestor),
    ano: record.ano ? String(record.ano) : "",
    situacao: situation.key
  };

  const cleanedRecord = Object.assign({}, record, {
    campos_pendentes: pending,
    dias_para_vencimento: situation.diasParaVencimento,
    situacao: situation,
    search_blob: getSearchableText(record),
    normalized: normalized
  });

  const hasRequiredGaps = REQUIRED_FIELDS.some(function (field) {
    return cleanedRecord[field] == null || cleanedRecord[field] === "";
  });

  if (hasRequiredGaps || pending.length) {
    console.warn("[painel] Contrato com dados incompletos:", cleanedRecord.id, {
      contrato: cleanedRecord.contrato,
      empresa: cleanedRecord.empresa,
      campos_pendentes: pending
    });
  }

  return cleanedRecord;
}

export function normalizeContract(raw, options) {
  const settings = Object.assign(
    {
      index: 0,
      referenceDate: undefined
    },
    options || {}
  );

  return sanitizeContract(raw, settings.index, settings.referenceDate);
}

function buildIndices(contracts) {
  const byId = new Map();
  const allIds = [];
  const fieldIndices = {
    tipo: new Map(),
    ano: new Map(),
    gestor: new Map(),
    situacao: new Map(),
    pendencias: new Map([["com_pendencias", new Set()]])
  };

  contracts.forEach(function (contract) {
    const id = contract.id;
    byId.set(id, contract);
    allIds.push(id);

    indexValue(fieldIndices.tipo, contract.normalized.tipo, id);
    indexValue(fieldIndices.ano, contract.normalized.ano, id);
    indexValue(fieldIndices.gestor, contract.normalized.gestor, id);
    indexValue(fieldIndices.situacao, contract.situacao.key, id);

    if (contract.campos_pendentes.length) {
      fieldIndices.pendencias.get("com_pendencias").add(id);
    }
  });

  return {
    byId: byId,
    allIds: allIds,
    fields: fieldIndices
  };
}

function indexValue(store, key, id) {
  if (!key) {
    return;
  }

  if (!store.has(key)) {
    store.set(key, new Set());
  }

  store.get(key).add(id);
}

function buildLookups(contracts, metadata) {
  const types = new Set();
  const years = new Set();
  const managers = new Set();

  contracts.forEach(function (contract) {
    if (contract.tipo) {
      types.add(contract.tipo);
    }
    if (contract.ano) {
      years.add(contract.ano);
    }
    if (contract.gestor) {
      managers.add(contract.gestor);
    }
  });

  const typeValues = Array.from(types).sort(compareText);
  const managerValues = Array.from(managers).sort(compareText);
  const yearValues = Array.from(years).sort(function (a, b) {
    return Number(b) - Number(a);
  });

  return {
    metadata: metadata,
    tipo: typeValues,
    ano: yearValues,
    gestor: managerValues,
    tipoBySlug: new Map(typeValues.map(function (value) { return [slugify(value), value]; })),
    gestorBySlug: new Map(managerValues.map(function (value) { return [slugify(value), value]; }))
  };
}

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("O arquivo contratos.json não contém um objeto JSON válido.");
  }

  if (!payload.metadata || typeof payload.metadata !== "object") {
    throw new Error("A propriedade metadata está ausente em contratos.json.");
  }

  if (!Array.isArray(payload.contratos)) {
    throw new Error("A propriedade contratos precisa ser um array.");
  }
}

function normalizeMetadata(metadata, total) {
  const generatedAt = toNullableText(metadata.gerado_em);
  return {
    gerado_em: generatedAt,
    gerado_em_formatado: generatedAt ? formatDateTime(generatedAt) : "Sem data",
    gerado_data_formatada: generatedAt ? formatDate(generatedAt.slice(0, 10)) : "Sem data",
    total_registros: Number.isInteger(Number(metadata.total_registros))
      ? Number(metadata.total_registros)
      : total,
    fonte: toNullableText(metadata.fonte) || "contratos.json",
    versao: toNullableText(metadata.versao) || "1.0"
  };
}

function parseDataset(payload, referenceDate) {
  validatePayloadShape(payload);

  const contracts = payload.contratos.map(function (item, index) {
    return normalizeContract(item, {
      index: index,
      referenceDate: referenceDate
    });
  });

  const metadata = normalizeMetadata(payload.metadata, contracts.length);
  const indices = buildIndices(contracts);
  const lookups = buildLookups(contracts, metadata);

  return {
    metadata: metadata,
    contratos: contracts,
    indices: indices,
    lookups: lookups
  };
}

function readCache(referenceDate) {
  const payloadText = safeSessionStorage("getItem", CACHE_KEY);
  if (!payloadText) {
    return null;
  }

  try {
    const cachedPayload = JSON.parse(payloadText);
    const parsed = parseDataset(cachedPayload, referenceDate);
    const metaText = safeSessionStorage("getItem", CACHE_META_KEY);
    const cacheMeta = metaText ? JSON.parse(metaText) : {};
    return Object.assign(parsed, {
      source: "cache",
      cache: {
        used: true,
        savedAt: cacheMeta.savedAt || null,
        reason: cacheMeta.reason || "fallback"
      }
    });
  } catch (error) {
    console.warn("[painel] Cache inválido ignorado:", error);
    safeSessionStorage("removeItem", CACHE_KEY);
    safeSessionStorage("removeItem", CACHE_META_KEY);
    return null;
  }
}

function writeCache(payload, reason) {
  safeSessionStorage("setItem", CACHE_KEY, JSON.stringify(payload));
  safeSessionStorage(
    "setItem",
    CACHE_META_KEY,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      reason: reason || "network"
    })
  );
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status + " ao carregar contratos.json.");
    }

    return await response.json();
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao carregar contratos.json.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchWithRetry(url, options) {
  const config = Object.assign(
    {
      timeoutMs: FETCH_TIMEOUT_MS,
      retries: MAX_RETRIES,
      onRetry: null
    },
    options || {}
  );

  let lastError = null;

  for (let attempt = 0; attempt <= config.retries; attempt += 1) {
    try {
      return await fetchJsonWithTimeout(url, config.timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt >= config.retries) {
        break;
      }

      const delay = RETRY_DELAYS_MS[attempt] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      if (typeof config.onRetry === "function") {
        config.onRetry({
          attempt: attempt + 1,
          nextAttempt: attempt + 2,
          delay: delay,
          error: error
        });
      }
      await wait(delay);
    }
  }

  throw lastError || new Error("Falha desconhecida ao carregar contratos.json.");
}

export async function loadContracts(options) {
  const config = Object.assign(
    {
      url: "contratos.json",
      timeoutMs: FETCH_TIMEOUT_MS,
      retries: MAX_RETRIES,
      referenceDate: startOfToday(),
      onRetry: null
    },
    options || {}
  );

  const cachedData = readCache(config.referenceDate);
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  if (isOffline && cachedData) {
    return Object.assign({}, cachedData, {
      cache: Object.assign({}, cachedData.cache, {
        used: true,
        reason: "offline"
      })
    });
  }

  try {
    const payload = await fetchWithRetry(config.url, {
      timeoutMs: config.timeoutMs,
      retries: config.retries,
      onRetry: config.onRetry
    });

    writeCache(payload, "network");

    const parsed = parseDataset(payload, config.referenceDate);
    return Object.assign(parsed, {
      source: "network",
      cache: {
        used: false,
        savedAt: new Date().toISOString(),
        reason: "network"
      }
    });
  } catch (error) {
    if (cachedData) {
      return Object.assign({}, cachedData, {
        cache: Object.assign({}, cachedData.cache, {
          used: true,
          reason: isOffline ? "offline" : "fallback",
          fallbackError: error.message
        })
      });
    }

    throw error;
  }
}

export {
  CACHE_KEY,
  CACHE_META_KEY,
  FETCH_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAYS_MS,
  REQUIRED_FIELDS,
  REQUIRED_NULLABLE_FIELDS,
  STATUS_SPECIAL_LABELS,
  SITUATION_LABELS,
  SITUATION_BADGES,
  RISK_ORDER
};
