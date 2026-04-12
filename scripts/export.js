import {
  formatCurrency,
  formatDate,
  formatDateTime,
  slugify
} from "./data-loader.js";
import { setBusyButtonState } from "./loading.js";

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
      const fileName = buildFilename(exportedAt, config.getFilters());
      const lines = [
        "# Painel de Contratos - Prefeitura de Iguape/SP",
        "# Exportado em: " + formatTimestamp(exportedAt),
        "# Filtros: " + config.getFilterSummary(),
        "# Total de registros: " + records.length,
        [
          "Contrato",
          "Tipo",
          "Modalidade",
          "Objeto",
          "Processo",
          "Valor",
          "Empresa",
          "Data Início",
          "Vencimento",
          "Dias Restantes",
          "Situação",
          "Gestor",
          "Fiscal",
          "Observações"
        ].join(";")
      ];

      records.forEach(function (record) {
        lines.push([
          record.contrato || "",
          record.tipo || "",
          record.modalidade || "",
          record.objeto || "",
          record.processo || "",
          record.valor == null ? "" : formatCurrency(record.valor),
          record.empresa || "",
          record.data_inicio ? formatDate(record.data_inicio) : "",
          record.vencimento ? formatDate(record.vencimento) : "",
          record.dias_para_vencimento == null ? "" : String(record.dias_para_vencimento),
          record.situacao ? record.situacao.label : "",
          record.gestor || "",
          record.fiscal || "",
          buildObservationText(record)
        ].map(escapeCsv).join(";"));
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
      showToast("CSV exportado com sucesso.");
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
      showToast("Link copiado para a área de transferência.");
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
    }, 2000);
  }
}

function buildFilename(date, filters) {
  const isoDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  const filterToken = resolveFilenameToken(filters);
  return "contratos_iguape_" + isoDate + "_" + filterToken + ".csv";
}

function resolveFilenameToken(filters) {
  if (filters && filters.situacao) {
    return slugify(filters.situacao) || "recorte";
  }
  if (filters && filters.tipo) {
    return slugify(filters.tipo) || "recorte";
  }
  if (filters && filters.ano) {
    return "ano-" + slugify(filters.ano);
  }
  if (filters && filters.busca) {
    return "busca";
  }
  return "recorte";
}

function buildObservationText(record) {
  const items = [];
  if (record.observacoes) {
    items.push(record.observacoes);
  }
  if (record.campos_pendentes && record.campos_pendentes.length) {
    items.push("Pendências: " + record.campos_pendentes.join(", "));
  }
  return items.join(" | ");
}

function escapeCsv(value) {
  const text = String(value == null ? "" : value);
  return /[;"\n\r]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
}

function formatTimestamp(value) {
  return formatDateTime(value).replace(",", "");
}

function nextFrame() {
  return new Promise(function (resolve) {
    window.requestAnimationFrame(function () {
      resolve();
    });
  });
}
