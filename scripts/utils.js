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

export function hasProvidedNumber(value, wasProvided) {
  if (typeof wasProvided === "boolean") {
    return wasProvided;
  }

  return value != null && Number.isFinite(Number(value));
}

export function formatOptionalCurrency(value, wasProvided, emptyLabel) {
  return hasProvidedNumber(value, wasProvided)
    ? formatCurrency(value)
    : (emptyLabel || "—");
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

export function compareText(a, b) {
  return collator.compare(String(a || ""), String(b || ""));
}

export function startOfToday(referenceDate) {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function daysBetween(a, b) {
  const start = a instanceof Date ? new Date(a) : parseIsoDate(a);
  const end = b instanceof Date ? new Date(b) : parseIsoDate(b);

  if (!start || !end) {
    return null;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

export function isExpiringSoon(contract, days) {
  const safeDays = Number.isFinite(Number(days)) ? Number(days) : 30;
  if (!contract || !contract.vencimento) {
    return false;
  }

  const remaining = daysBetween(startOfToday(), contract.vencimento);
  return remaining != null && remaining >= 0 && remaining <= safeDays;
}

export function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  let divisor = 1;
  let suffix = "";

  if (abs >= 1000000000) {
    divisor = 1000000000;
    suffix = "B";
  } else if (abs >= 1000000) {
    divisor = 1000000;
    suffix = "M";
  } else if (abs >= 1000) {
    divisor = 1000;
    suffix = "K";
  }

  if (!suffix) {
    return formatCurrency(amount);
  }

  const compact = (amount / divisor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });

  return "R$ " + compact + suffix;
}
