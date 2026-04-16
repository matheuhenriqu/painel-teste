import {
  formatDate,
  formatDateTime
} from "./utils.js";
import { setBusyButtonState } from "./loading.js";

const CSV_COLUMNS = [
  { key: "id", label: "id" },
  { key: "tipo", label: "tipo" },
  { key: "modalidade", label: "modalidade" },
  { key: "objeto", label: "objeto" },
  { key: "processo", label: "processo" },
  { key: "contrato", label: "contrato" },
  { key: "valor", label: "valor" },
  { key: "empresa", label: "empresa" },
  { key: "data_inicio", label: "data_inicio" },
  { key: "vencimento", label: "vencimento" },
  { key: "observacoes", label: "observacoes" },
  { key: "gestor", label: "gestor" },
  { key: "fiscal", label: "fiscal" },
  { key: "status_especial", label: "status_especial" },
  { key: "ano", label: "ano" },
  { key: "area_referencia", label: "area_referencia" },
  { key: "campos_pendentes", label: "campos_pendentes" }
];

export function createExportController(options) {
  const config = Object.assign(
    {
      exportButton: null,
      shareButton: null,
      toast: null,
      getRecords: function () {
        return [];
      },
      getFilters: function () {
        return {};
      },
      getFilterSummary: function () {
        return "Sem filtros ativos";
      },
      getMetadata: function () {
        return null;
      },
      getShareUrl: function () {
        return window.location.href;
      },
      onBeforePrint: function () {},
      onAfterPrint: function () {}
    },
    options || {}
  );

  const state = {
    toastTimer: 0
  };

  bindEvents();

  return {
    exportCsv: exportCsv,
    shareCurrentView: shareCurrentView,
    showToast: showToast
  };

  function bindEvents() {
    if (config.exportButton) {
      config.exportButton.addEventListener("click", exportCsv);
    }

    if (config.shareButton) {
      config.shareButton.addEventListener("click", function () {
        shareCurrentView();
      });
    }

    window.addEventListener("beforeprint", function () {
      config.onBeforePrint();
    });

    window.addEventListener("afterprint", function () {
      config.onAfterPrint();
    });
  }

  async function exportCsv() {
    const records = config.getRecords();
    if (!records.length) {
      showToast("Não há contratos no recorte atual.");
      return false;
    }

    setBusyButtonState(config.exportButton, true, {
      label: "Exportando..."
    });

    try {
      await nextFrame();

      const exportedAt = new Date();
      const fileName = buildFilename(exportedAt);
      const lines = [
        CSV_COLUMNS.map(function (column) {
          return column.label;
        }).join(";")
      ];

      records.forEach(function (record) {
        lines.push(CSV_COLUMNS.map(function (column) {
          return escapeCsv(resolveCsvCell(record, column.key));
        }).join(";"));
      });

      const blob = new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/csv;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("✓ CSV exportado com " + records.length + " contratos");
      return true;
    } finally {
      setBusyButtonState(config.exportButton, false);
    }
  }

  async function shareCurrentView() {
    const url = config.getShareUrl();
    const isMobileViewport = window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches;

    if (navigator.share && isMobileViewport) {
      try {
        await navigator.share({
          title: "Painel de Contratos | Iguape/SP",
          text: "Recorte atual do painel de contratos da Prefeitura de Iguape/SP",
          url: url
        });
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return false;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("✓ Link copiado");
      return true;
    } catch (error) {
      showToast("Não foi possível copiar o link.");
      return false;
    }
  }

  function showToast(message) {
    if (!config.toast) {
      return;
    }

    window.clearTimeout(state.toastTimer);
    config.toast.textContent = String(message || "");
    config.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(function () {
      config.toast.classList.remove("is-visible");
      config.toast.textContent = "";
    }, 3000);
  }
}

function buildFilename(date) {
  const isoDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  return "contratos-iguape-" + isoDate + ".csv";
}

function escapeCsv(value) {
  const text = String(value == null ? "" : value);
  return /[;"\n\r]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
}

function formatTimestamp(value) {
  return formatDateTime(value).replace(",", "");
}

function resolveCsvCell(record, key) {
  switch (key) {
    case "valor":
      return formatRawNumber(record.valor, record.valor_informado);
    case "data_inicio":
      return record.data_inicio ? formatDate(record.data_inicio) : "";
    case "vencimento":
      return record.vencimento ? formatDate(record.vencimento) : "";
    case "campos_pendentes":
      return Array.isArray(record.campos_pendentes)
        ? record.campos_pendentes.join(", ")
        : "";
    default:
      return record[key] == null ? "" : record[key];
  }
}

function formatRawNumber(value, wasProvided) {
  if (!wasProvided && (value == null || Number(value) === 0)) {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return String(numeric);
}

function nextFrame() {
  return new Promise(function (resolve) {
    window.requestAnimationFrame(function () {
      resolve();
    });
  });
}
