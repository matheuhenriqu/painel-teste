import {
  clearKpiLoading,
  clearLoadMessage,
  getSituationLabel,
  loadContracts,
  renderLoadMessage,
  setKpiLoading
} from "./data.js";
import {
  renderBars,
  renderDonut,
  renderGauge,
  renderTimeline
} from "./charts.js";
import { applyIndicators } from "./indicators.js";
import { createExportController } from "./export.js";
import { createLoadingController } from "./loading.js";
import { createShortcutsController } from "./shortcuts.js";
import { createTableRenderer } from "./contracts-list.js";
import { createModalController } from "./modal.js";
import { createThemeController } from "./theme.js";
import {
  compareText,
  formatCurrency,
  formatDateTime,
  formatOptionalCurrency,
  hasProvidedNumber,
  normalizeText,
  slugify,
  titleCase
} from "./utils.js";

(function () {
  "use strict";

  const COLLAPSIBLE_KEY = "iguape-painel-collapsible-v1";
  const RESULTS_VIEW_STORAGE_KEY = "iguape-painel-results-view-v1";
  const MOBILE_COLLAPSED_SECTION_IDS = [
    "secao-radar-vencimentos",
    "secao-distribuicao"
  ];
  const DEFAULT_FILTERS = {
    tipo: "",
    ano: "",
    gestor: "",
    situacao: "",
    ordenacao: "vigencia",
    busca: "",
    pendencias: ""
  };

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

  const SITUATION_OPTIONS = [
    { value: "", param: "", label: "Todas as situações" },
    { value: "vigentes", param: "vigentes", label: "Vigentes" },
    { value: "vence_30", param: "vence-30", label: "Vence em 30 dias" },
    { value: "vence_31_90", param: "vence-31-90", label: "Vence em 31-90 dias" },
    { value: "vigente_regular", param: "vigente-regular", label: "Vigente" },
    { value: "encerrado", param: "encerrado", label: "Encerrado" },
    { value: "sem_vigencia", param: "sem-vigencia", label: "Sem vigência" },
    { value: "em_andamento", param: "em-andamento", label: "Em andamento" },
    { value: "nao_assinou", param: "nao-assinou", label: "Não assinou" }
  ];

  const ORDER_OPTIONS = [
    { value: "risco", param: "risco", label: "Maior urgência" },
    { value: "vigencia", param: "vigencia", label: "Vencimento mais próximo" },
    { value: "maior_valor", param: "maior-valor", label: "Maior valor" },
    { value: "menor_valor", param: "menor-valor", label: "Menor valor" },
    { value: "fornecedor", param: "fornecedor", label: "Empresa A-Z" },
    { value: "ano_desc", param: "ano-desc", label: "Ano mais recente" }
  ];

  const ACTIVE_SITUATION_KEYS = ["vigente_regular", "vence_30", "vence_31_90"];
  const KPI_TOTAL_KEY = "kpi-total-contratos";
  const KPI_VALUE_KEY = "kpi-valor-total";
  const KPI_30_KEY = "kpi-vencem-30";
  const KPI_90_KEY = "kpi-vencem-90";
  const KPI_NO_DUE_KEY = "kpi-sem-vigencia";
  const KPI_PENDING_KEY = "kpi-dados-pendentes";

  const DOM = {
    html: document.documentElement,
    loadMessage: document.getElementById("mensagem-carga"),
    baseBadge: document.getElementById("badge-base-publicada"),
    dataBadge: document.getElementById("badge-status-dados"),
    helpButton: document.getElementById("abrir-atalhos"),
    footerDate: document.getElementById("footer-data-atualizacao"),
    contextTotalContracts: document.getElementById("contexto-total-contratos"),
    contextTotalValue: document.getElementById("contexto-valor-total"),
    contextTotalValueWrap: document.getElementById("contexto-valor-total-wrap"),
    contextRelativeUpdate: document.getElementById("contexto-atualizacao-relativa"),
    urgentAlerts: document.getElementById("alertas-urgentes"),
    badgeResultados: document.getElementById("badge-resultados"),
    contagemResultados: document.getElementById("contagem-resultados"),
    exportButton: document.getElementById("exportar-csv"),
    shareButton: document.getElementById("compartilhar-link"),
    themeToggle: document.getElementById("theme-toggle"),
    toast: document.getElementById("toast-feedback"),
    scrollProgressBar: document.getElementById("barra-progresso-scroll"),
    filtersForm: document.getElementById("form-filtros"),
    filtersDesktopSlot: document.getElementById("filtros-desktop-slot"),
    filtersGrid: document.getElementById("filtros-grid"),
    filtersStickySentinel: document.getElementById("marcador-sticky-filtros"),
    mobileFiltersToggle: document.getElementById("abrir-filtros-mobile"),
    mobileFiltersCount: document.getElementById("contador-filtros-mobile"),
    mobileFiltersOverlay: document.getElementById("filtros-overlays"),
    mobileFiltersSheet: document.getElementById("filtros-mobile-sheet"),
    mobileFiltersSheetBody: document.getElementById("filtros-mobile-sheet-body"),
    mobileFiltersBackdrop: document.getElementById("filtros-mobile-backdrop"),
    mobileFiltersClose: document.getElementById("fechar-filtros-mobile"),
    mobileFiltersApply: document.getElementById("aplicar-filtros-mobile"),
    filterTipo: document.getElementById("filtro-tipo"),
    filterAno: document.getElementById("filtro-ano"),
    filterGestor: document.getElementById("filtro-gestor"),
    filterSituacao: document.getElementById("filtro-situacao"),
    filterOrdenacao: document.getElementById("filtro-ordenacao"),
    filterBusca: document.getElementById("filtro-busca"),
    searchShell: document.getElementById("campo-busca-shell"),
    searchClear: document.getElementById("limpar-busca"),
    chips: document.getElementById("filtros-ativos"),
    chipPlaceholder: document.getElementById("chip-sem-filtros"),
    clearFilters: document.getElementById("limpar-filtros"),
    kpiCards: document.querySelectorAll(".kpi-card"),
    kpiUrgentAlert: document.getElementById("alerta-kpi-vencem-30"),
    printSummary: document.getElementById("resumo-impressao"),
    printFilters: document.getElementById("print-filtros-resumo"),
    printTotalRecords: document.getElementById("print-total-registros"),
    printUpdatedAt: document.getElementById("print-data-atualizacao"),
    printExportedAt: document.getElementById("print-exportado-em"),
    printUrl: document.getElementById("print-url-atual"),
    printKpis: {
      total: document.getElementById("print-kpi-total"),
      valor: document.getElementById("print-kpi-valor"),
      vence30: document.getElementById("print-kpi-vence30"),
      vence90: document.getElementById("print-kpi-vence90"),
      semVigencia: document.getElementById("print-kpi-sem-vigencia"),
      pendencias: document.getElementById("print-kpi-pendencias")
    },
    kpis: {
      total: document.querySelector("#" + KPI_TOTAL_KEY + " .js-countup"),
      valor: document.querySelector("#" + KPI_VALUE_KEY + " .js-countup"),
      vence30: document.querySelector("#" + KPI_30_KEY + " .js-countup"),
      vence90: document.querySelector("#" + KPI_90_KEY + " .js-countup"),
      semVigencia: document.querySelector("#" + KPI_NO_DUE_KEY + " .js-countup"),
      pendencias: document.querySelector("#" + KPI_PENDING_KEY + " .js-countup")
    },
    kpiCardElements: {
      total: document.getElementById(KPI_TOTAL_KEY),
      valor: document.getElementById(KPI_VALUE_KEY),
      vence30: document.getElementById(KPI_30_KEY),
      vence90: document.getElementById(KPI_90_KEY),
      semVigencia: document.getElementById(KPI_NO_DUE_KEY),
      pendencias: document.getElementById(KPI_PENDING_KEY)
    },
    radarSection: document.getElementById("secao-radar-vencimentos"),
    radarCounter: document.getElementById("contador-radar-urgentes"),
    radarTimeline: document.getElementById("grafico-timeline-vencimentos"),
    radarList: document.getElementById("lista-radar-vencimentos"),
    pendenciasSection: document.getElementById("secao-pendencias"),
    pendenciasCounter: document.getElementById("contador-pendencias"),
    pendenciasList: document.getElementById("lista-pendencias"),
    distribuicaoSection: document.getElementById("secao-distribuicao"),
    distribuicaoCounter: document.getElementById("contador-distribuicao-tipos"),
    donutChart: document.getElementById("grafico-donut-tipo"),
    gaugeChart: document.getElementById("grafico-gauge-completude"),
    barsChart: document.getElementById("grafico-barras-ano"),
    distribuicaoTable: document.getElementById("tabela-distribuicao"),
    filtersShell: document.querySelector(".filters-shell"),
    resultsSection: document.getElementById("secao-listagem-principal"),
    resultsCounter: document.getElementById("contador-listagem-principal"),
    gruposTipo: document.getElementById("lista-grupos-tipo"),
    resultsViewButtons: document.querySelectorAll("[data-results-view]"),
    encerradosSection: document.getElementById("secao-encerrados"),
    encerradosCounter: document.getElementById("contador-encerrados"),
    gruposEncerrados: document.getElementById("lista-grupos-encerrados"),
    modal: document.getElementById("modal-contrato"),
    modalTitle: document.getElementById("modal-titulo"),
    modalSubtitle: document.getElementById("modal-subtitulo"),
    modalStatus: document.getElementById("modal-status"),
    modalTipo: document.getElementById("modal-tipo"),
    modalModalidade: document.getElementById("modal-modalidade"),
    modalProcesso: document.getElementById("modal-processo"),
    modalAno: document.getElementById("modal-ano"),
    modalEmpresa: document.getElementById("modal-empresa"),
    modalObjeto: document.getElementById("modal-objeto"),
    modalValor: document.getElementById("modal-valor"),
    modalGestor: document.getElementById("modal-gestor"),
    modalFiscal: document.getElementById("modal-fiscal"),
    modalDataInicio: document.getElementById("modal-data-inicio"),
    modalDataVencimento: document.getElementById("modal-data-vencimento"),
    modalDataHoje: document.getElementById("modal-data-hoje"),
    modalPendencias: document.getElementById("modal-pendencias"),
    modalObservacoes: document.getElementById("modal-observacoes"),
    modalCopy: document.getElementById("modal-copiar-link"),
    modalPrint: document.getElementById("modal-imprimir"),
    modalClose: document.getElementById("modal-fechar"),
    modalCloseTop: document.getElementById("modal-fechar-topo"),
    modalFeedback: document.getElementById("modal-feedback"),
    modalVigenciaResumo: document.getElementById("modal-vigencia-resumo"),
    modalVigenciaInicioLabel: document.getElementById("modal-vigencia-inicio-label"),
    modalVigenciaFimLabel: document.getElementById("modal-vigencia-fim-label"),
    progressFill: document.querySelector(".progress-track__fill"),
    progressToday: document.querySelector(".progress-track__today"),
    shortcutsDialog: document.getElementById("atalhos-overlay"),
    shortcutsClose: document.getElementById("atalhos-fechar"),
    scrollTopButton: document.getElementById("botao-topo"),
    templates: {
      chip: document.getElementById("template-chip-filtro"),
      radarCard: document.getElementById("template-radar-card"),
      pendenciaItem: document.getElementById("template-pendencia-item")
    }
  };

  const state = {
    dataset: null,
    filters: Object.assign({}, DEFAULT_FILTERS),
    urlHydrated: false,
    renderFrame: 0,
    searchTimer: 0,
    filterCache: new Map(),
    latestFiltered: [],
    tableRenderer: null,
    modalController: null,
    exportController: null,
    loadingController: null,
    shortcutsController: null,
    themeController: null,
    lastUrgentAnnouncement: "",
    visibleSections: new Set(),
    lazyObserver: null,
    stickyObserver: null,
    isPrinting: false,
    prePrintEndedOpen: null,
    mobileFiltersOpen: false,
    mobileFiltersScrollY: 0,
    mobileFiltersHideTimer: 0,
    mobileFiltersReturnFocus: null,
    bodyLockStyles: null,
    resizeRenderTimer: 0,
    resultsViewMode: readResultsViewMode(),
    viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
    viewportMetricsFrame: 0,
    stickyFallbackBound: false
  };

  init();

  function init() {
    bindStaticEvents();
    syncMobileViewportMetrics();
    syncFiltersLayoutForViewport();
    syncFiltersShellMetrics();
    bindCollapsiblePersistence();
    applyResponsiveSectionDefaults();
    applyResultsViewMode();
    initStickyFiltersObserver();
    initLazySections();
    initModules();
    bootstrap();
  }

  function initModules() {
    state.themeController = createThemeController({
      root: DOM.html,
      button: DOM.themeToggle
    });

    state.loadingController = createLoadingController({
      body: document.body,
      scrollProgressBar: DOM.scrollProgressBar,
      mainResultsContainer: DOM.gruposTipo,
      endedResultsContainer: DOM.gruposEncerrados,
      radarTimeline: DOM.radarTimeline,
      radarList: DOM.radarList,
      pendingList: DOM.pendenciasList,
      donutChart: DOM.donutChart,
      gaugeChart: DOM.gaugeChart,
      barsChart: DOM.barsChart
    });

    state.tableRenderer = createTableRenderer({
      mainContainer: DOM.gruposTipo,
      endedSection: DOM.encerradosSection,
      endedCounter: DOM.encerradosCounter,
      endedContainer: DOM.gruposEncerrados,
      onContractSelect: function (contractId) {
        if (state.modalController) {
          state.modalController.openById(contractId, {
            syncUrl: true,
            replaceUrl: false
          });
        }
      },
      onClearAllFilters: clearAllFilters,
      onRemoveFilter: removeFilterByKey
    });

    state.modalController = createModalController({
      root: DOM.modal,
      closeButton: DOM.modalClose,
      closeTopButton: DOM.modalCloseTop,
      copyButton: DOM.modalCopy,
      printButton: DOM.modalPrint,
      feedback: DOM.modalFeedback,
      toast: DOM.toast,
      title: DOM.modalTitle,
      subtitle: DOM.modalSubtitle,
      status: DOM.modalStatus,
      tipo: DOM.modalTipo,
      modalidade: DOM.modalModalidade,
      processo: DOM.modalProcesso,
      ano: DOM.modalAno,
      empresa: DOM.modalEmpresa,
      objeto: DOM.modalObjeto,
      valor: DOM.modalValor,
      gestor: DOM.modalGestor,
      fiscal: DOM.modalFiscal,
      dataInicio: DOM.modalDataInicio,
      dataVencimento: DOM.modalDataVencimento,
      dataHoje: DOM.modalDataHoje,
      pendencias: DOM.modalPendencias,
      observacoes: DOM.modalObservacoes,
      vigenciaResumo: DOM.modalVigenciaResumo,
      vigenciaInicioLabel: DOM.modalVigenciaInicioLabel,
      vigenciaFimLabel: DOM.modalVigenciaFimLabel,
      progressFill: DOM.progressFill,
      progressToday: DOM.progressToday,
      getRecordById: function (id) {
        return state.dataset ? state.dataset.indices.byId.get(Number(id)) || null : null;
      },
      getRecordByParam: findRecordByContractParam,
      getShareUrl: function (record) {
        return window.location.origin + buildUrl(record);
      },
      onStateChange: function (payload) {
        syncUrl({
          replaceUrl: payload.replaceUrl,
          contractRecord: payload.record || null
        });
      }
    });

    state.exportController = createExportController({
      exportButton: DOM.exportButton,
      shareButton: DOM.shareButton,
      toast: DOM.toast,
      getRecords: function () {
        return state.latestFiltered.slice();
      },
      getFilters: function () {
        return Object.assign({}, state.filters);
      },
      getFilterSummary: getFilterSummary,
      getMetadata: function () {
        return state.dataset ? {
          metadata: state.dataset.metadata,
          cache: state.dataset.cache
        } : null;
      },
      getShareUrl: function () {
        return window.location.href;
      },
      onBeforePrint: handleBeforePrint,
      onAfterPrint: handleAfterPrint
    });

    state.shortcutsController = createShortcutsController({
      searchInput: DOM.filterBusca,
      helpTrigger: DOM.helpButton,
      helpDialog: DOM.shortcutsDialog,
      helpCloseButton: DOM.shortcutsClose,
      scrollTopButton: DOM.scrollTopButton,
      isModalOpen: function () {
        return Boolean(DOM.modal && DOM.modal.open);
      },
      closeModal: function () {
        if (state.modalController) {
          state.modalController.close();
        }
      },
      clearSearch: clearSearchFilter,
      exportCsv: function () {
        if (state.exportController) {
          state.exportController.exportCsv();
        }
      }
    });
  }

  async function bootstrap() {
    disableControls(true);
    setKpiLoading(document);
    if (state.loadingController) {
      state.loadingController.startInitialLoad();
    }

    clearLoadMessage(DOM.loadMessage);
    renderLoadMessage(DOM.loadMessage, {
      type: "info",
      title: "Carregando contratos",
      message: "Lendo contratos.json e preparando os filtros e a listagem."
    });

    try {
      const dataset = await loadContracts({
        url: "contratos.json",
        onRetry: function (info) {
          renderLoadMessage(DOM.loadMessage, {
            type: "info",
            title: "Tentando novamente",
            message: "A tentativa " + info.attempt + " falhou. Nova tentativa em " + Math.round(info.delay / 1000) + "s."
          });
        }
      });

      state.dataset = dataset;
      state.filterCache.clear();
      hydrateFiltersFromUrl();
      syncMetadata(dataset);
      populateStaticOrderSelect();
      applyFiltersToControls();
      refreshAllSelects();
      scheduleRender({
        replaceUrl: true,
        syncModalFromUrl: true
      });
      clearKpiLoading(document);
      disableControls(false);
      if (state.loadingController) {
        window.requestAnimationFrame(function () {
          state.loadingController.finishInitialLoad({
            clearTables: false
          });
        });
      }

      if (dataset.cache.used) {
        renderLoadMessage(DOM.loadMessage, {
          type: dataset.cache.reason === "offline" ? "warning" : "info",
          title: "Dados em cache",
          message: dataset.cache.reason === "offline"
            ? "Você está offline. O painel foi carregado com os dados salvos na sessão."
            : "A rede falhou e o painel foi montado com dados em cache."
        });
      } else {
        clearLoadMessage(DOM.loadMessage);
      }
    } catch (error) {
      const loadFailure = getLoadFailureState(error);
      state.dataset = null;
      state.latestFiltered = [];
      state.filterCache.clear();
      clearKpiLoading(document);
      disableControls(true);
      if (state.loadingController) {
        state.loadingController.finishInitialLoad({
          clearTables: true
        });
      }
      renderLoadFailureView(loadFailure);
      const retryButton = renderLoadMessage(DOM.loadMessage, {
        type: "error",
        title: "Não foi possível carregar os dados.",
        message: "Verifique a conexão e tente novamente.",
        actionLabel: "Tentar novamente",
        actionId: "retry-carregar-dados",
        title: loadFailure.bannerTitle,
        message: loadFailure.bannerMessage,
        linkLabel: loadFailure.linkLabel,
        linkHref: loadFailure.linkHref
      });

      if (retryButton) {
        retryButton.addEventListener("click", function () {
          bootstrap();
        });
      }
    }
  }

  function bindStaticEvents() {
    if (DOM.filtersForm) {
      DOM.filtersForm.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }

    [DOM.filterTipo, DOM.filterAno, DOM.filterGestor, DOM.filterSituacao, DOM.filterOrdenacao]
      .filter(Boolean)
      .forEach(function (control) {
        control.addEventListener("change", handleFilterChange);
      });

    if (DOM.filterBusca) {
      DOM.filterBusca.addEventListener("input", handleSearchInput);
      DOM.filterBusca.addEventListener("keydown", handleSearchKeydown);
    }

    if (DOM.searchClear) {
      DOM.searchClear.addEventListener("click", function () {
        clearSearchFilter();
        if (DOM.filterBusca) {
          DOM.filterBusca.focus();
        }
      });
    }

    if (DOM.mobileFiltersToggle) {
      DOM.mobileFiltersToggle.addEventListener("click", function () {
        toggleMobileFilters(true);
      });
    }

    if (DOM.mobileFiltersClose) {
      DOM.mobileFiltersClose.addEventListener("click", function () {
        toggleMobileFilters(false);
      });
    }

    if (DOM.mobileFiltersBackdrop) {
      DOM.mobileFiltersBackdrop.addEventListener("click", function () {
        toggleMobileFilters(false);
      });
    }

    if (DOM.mobileFiltersApply) {
      DOM.mobileFiltersApply.addEventListener("click", function () {
        toggleMobileFilters(false);
      });
    }

    if (DOM.clearFilters) {
      DOM.clearFilters.addEventListener("click", clearAllFilters);
    }

    if (DOM.chips) {
      DOM.chips.addEventListener("click", handleChipClick);
      DOM.chips.addEventListener("keydown", handleChipKeydown);
    }

    DOM.kpiCards.forEach(function (card) {
      card.addEventListener("click", handleKpiClick);
    });

    DOM.resultsViewButtons.forEach(function (button) {
      button.addEventListener("click", handleResultsViewToggle);
    });

    bindOpenDetailsEvents(DOM.radarList, ".urgent-card[data-contract-id]");
    bindOpenDetailsEvents(DOM.pendenciasList, ".pending-item[data-contract-id]");

    window.addEventListener("popstate", function () {
      if (!state.dataset) {
        return;
      }
      hydrateFiltersFromUrl(true);
      applyFiltersToControls();
      refreshAllSelects();
      scheduleRender({
        syncUrl: false,
        syncModalFromUrl: true
      });
    });

    window.addEventListener("resize", function () {
      handleViewportChange();
    });

    window.addEventListener("orientationchange", function () {
      handleViewportChange();
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", requestViewportMetricsSync);
      window.visualViewport.addEventListener("scroll", requestViewportMetricsSync);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && state.mobileFiltersOpen) {
        event.preventDefault();
        toggleMobileFilters(false);
      }
    });

    if (DOM.mobileFiltersSheet && "inert" in DOM.mobileFiltersSheet) {
      DOM.mobileFiltersSheet.inert = true;
    }
  }

  function bindOpenDetailsEvents(container, selector) {
    if (!container) {
      return;
    }

    container.addEventListener("click", function (event) {
      const node = event.target.closest(selector);
      if (!node) {
        return;
      }

      const contractId = Number(node.dataset.contractId);
      if (Number.isInteger(contractId) && state.modalController) {
        state.modalController.openById(contractId, {
          syncUrl: true,
          replaceUrl: false
        });
      }
    });

    container.addEventListener("keydown", function (event) {
      const node = event.target.closest(selector);
      if (!node) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const contractId = Number(node.dataset.contractId);
        if (Number.isInteger(contractId) && state.modalController) {
          state.modalController.openById(contractId, {
            syncUrl: true,
            replaceUrl: false
          });
        }
      }
    });
  }

  function initStickyFiltersObserver() {
    if (!DOM.filtersShell || !DOM.filtersStickySentinel) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      if (!state.stickyFallbackBound) {
        window.addEventListener("scroll", updateStickyState, { passive: true });
        state.stickyFallbackBound = true;
      }
      updateStickyState();
      return;
    }

    const stickyTop = getStickyTopOffset();
    if (state.stickyObserver) {
      state.stickyObserver.disconnect();
    }

    state.stickyObserver = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      DOM.filtersShell.classList.toggle("is-stuck", !entry.isIntersecting);
    }, {
      threshold: 1,
      rootMargin: "-" + stickyTop + "px 0px 0px 0px"
    });

    state.stickyObserver.observe(DOM.filtersStickySentinel);
  }

  function updateStickyState() {
    if (!DOM.filtersShell || !DOM.filtersStickySentinel) {
      return;
    }

    const rect = DOM.filtersStickySentinel.getBoundingClientRect();
    DOM.filtersShell.classList.toggle("is-stuck", rect.top < getStickyTopOffset());
  }

  function getStickyTopOffset() {
    if (!DOM.filtersShell) {
      return 56;
    }

    const topValue = window.getComputedStyle(DOM.filtersShell).top;
    const parsed = Number.parseFloat(topValue);
    return Number.isFinite(parsed) ? parsed : 56;
  }

  function requestViewportMetricsSync() {
    if (state.viewportMetricsFrame) {
      return;
    }

    state.viewportMetricsFrame = window.requestAnimationFrame(function () {
      state.viewportMetricsFrame = 0;
      syncMobileViewportMetrics();
      syncFiltersShellMetrics();
      updateStickyState();
    });
  }

  function syncMobileViewportMetrics() {
    const rootStyle = document.documentElement.style;

    if (!isMobileViewport()) {
      rootStyle.removeProperty("--mobile-viewport-height");
      rootStyle.removeProperty("--mobile-overlay-offset-bottom");
      return;
    }

    let viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    let overlayOffsetBottom = 0;

    if (window.visualViewport) {
      viewportHeight = Math.round(window.visualViewport.height);
      overlayOffsetBottom = Math.max(
        0,
        Math.round(window.innerHeight - (window.visualViewport.height + window.visualViewport.offsetTop))
      );
    }

    if (viewportHeight > 0) {
      rootStyle.setProperty("--mobile-viewport-height", viewportHeight + "px");
    }
    rootStyle.setProperty("--mobile-overlay-offset-bottom", overlayOffsetBottom + "px");
  }

  function syncFiltersShellMetrics() {
    if (!DOM.filtersShell) {
      document.documentElement.style.removeProperty("--filters-shell-height");
      return;
    }

    const shellStyle = window.getComputedStyle(DOM.filtersShell);
    const marginBottom = Number.parseFloat(shellStyle.marginBottom) || 0;
    const height = Math.max(0, Math.ceil(DOM.filtersShell.getBoundingClientRect().height + marginBottom));

    document.documentElement.style.setProperty("--filters-shell-height", height + "px");
  }

  function syncMetadata(dataset) {
    const dateLabel = dataset.metadata.gerado_data_formatada || "Sem data";
    const dateTimeLabel = formatHumanDateTime(dataset.metadata.gerado_em_formatado || dateLabel);
    const relativeUpdate = formatRelativeUpdate(dataset.metadata.gerado_em);
    const footerLabel = dataset.cache.used
      ? dateTimeLabel + " (cache)"
      : dateTimeLabel;
    const strong = DOM.baseBadge ? DOM.baseBadge.querySelector("strong") : null;

    if (strong) {
      strong.textContent = dateLabel;
    }

    if (DOM.footerDate) {
      DOM.footerDate.textContent = footerLabel;
    }

    if (DOM.printUpdatedAt) {
      DOM.printUpdatedAt.textContent = "Dados atualizados em " + footerLabel;
    }

    if (DOM.printUrl) {
      DOM.printUrl.textContent = window.location.href;
    }

    if (DOM.printExportedAt) {
      DOM.printExportedAt.textContent = "Impresso em " + formatCompactDateTime(new Date());
    }

    if (DOM.contextRelativeUpdate) {
      DOM.contextRelativeUpdate.textContent = "Atualizado " + relativeUpdate + (dataset.cache.used ? " (cache)" : "");
    }

    if (DOM.dataBadge) {
      if (dataset.cache.used) {
        DOM.dataBadge.textContent = "Dados em cache";
        DOM.dataBadge.classList.remove("is-hidden");
      } else {
        DOM.dataBadge.textContent = "";
        DOM.dataBadge.classList.add("is-hidden");
      }
    }
  }

  function disableControls(disabled) {
    [
      DOM.filterTipo,
      DOM.filterAno,
      DOM.filterGestor,
      DOM.filterSituacao,
      DOM.filterOrdenacao,
      DOM.filterBusca,
      DOM.exportButton,
      DOM.shareButton,
      DOM.clearFilters
    ].forEach(function (element) {
      if (element) {
        element.disabled = Boolean(disabled);
      }
    });
  }

  function bindCollapsiblePersistence() {
    document.querySelectorAll(".js-collapsible").forEach(function (details) {
      details.dataset.initialOpen = details.hasAttribute("open") ? "true" : "false";
      const stored = readCollapsibleState(details.id);
      if (typeof stored === "boolean") {
        details.open = stored;
      }

      details.addEventListener("toggle", function () {
        if (details.dataset.responsiveDefaulting === "true") {
          details.dataset.responsiveDefaulting = "false";
          return;
        }

        writeCollapsibleState(details.id, details.open);

        if (details.open && details.dataset.lazySection && state.dataset) {
          window.requestAnimationFrame(function () {
            scheduleRender({
              syncUrl: false,
              replaceUrl: true,
              syncModalFromUrl: false
            });
          });
        }
      });
    });
  }

  function applyResponsiveSectionDefaults() {
    MOBILE_COLLAPSED_SECTION_IDS.forEach(function (sectionId) {
      const details = document.getElementById(sectionId);
      if (!details) {
        return;
      }

      if (typeof readCollapsibleState(sectionId) === "boolean") {
        return;
      }

      const shouldOpen = isMobileViewport()
        ? false
        : details.dataset.initialOpen !== "false";

      if (details.open === shouldOpen) {
        return;
      }

      details.dataset.responsiveDefaulting = "true";
      details.open = shouldOpen;
    });
  }

  function initLazySections() {
    const lazySections = [
      DOM.distribuicaoSection,
      DOM.resultsSection
    ].filter(Boolean);

    if (!lazySections.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      lazySections.forEach(function (section) {
        if (section.dataset.lazySection) {
          state.visibleSections.add(section.dataset.lazySection);
        }
      });
      return;
    }

    state.lazyObserver = new IntersectionObserver(function (entries) {
      let shouldRender = false;

      entries.forEach(function (entry) {
        if (!entry.isIntersecting || !entry.target.dataset.lazySection) {
          return;
        }

        state.visibleSections.add(entry.target.dataset.lazySection);
        state.lazyObserver.unobserve(entry.target);
        shouldRender = true;
      });

      if (shouldRender && state.dataset) {
        scheduleRender({
          syncUrl: false,
          replaceUrl: true,
          syncModalFromUrl: false
        });
      }
    }, {
      rootMargin: "160px 0px",
      threshold: 0.05
    });

    lazySections.forEach(function (section) {
      if (section.dataset.lazySection) {
        state.lazyObserver.observe(section);
      }
    });
  }

  function readCollapsibleState(id) {
    if (!id) {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(COLLAPSIBLE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return typeof parsed[id] === "boolean" ? parsed[id] : null;
    } catch (error) {
      return null;
    }
  }

  function writeCollapsibleState(id, open) {
    if (!id) {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(COLLAPSIBLE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[id] = Boolean(open);
      window.sessionStorage.setItem(COLLAPSIBLE_KEY, JSON.stringify(parsed));
    } catch (error) {
      return;
    }
  }

  function hydrateFiltersFromUrl(force) {
    if (state.urlHydrated && !force) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    state.filters = Object.assign({}, DEFAULT_FILTERS, {
      tipo: resolveSlugParam(params.get("tipo"), state.dataset ? state.dataset.lookups.tipoBySlug : null),
      ano: resolveYearParam(params.get("ano")),
      gestor: resolveSlugParam(params.get("gestor"), state.dataset ? state.dataset.lookups.gestorBySlug : null),
      situacao: resolveOptionParam(params.get("situacao"), SITUATION_OPTIONS),
      ordenacao: resolveOptionParam(params.get("ordenacao"), ORDER_OPTIONS) || DEFAULT_FILTERS.ordenacao,
      busca: sanitizeSearchInput(params.get("q")),
      pendencias: params.get("pendencias") === "sim" ? "com_pendencias" : ""
    });

    state.urlHydrated = true;
  }

  function resolveYearParam(value) {
    if (!value || !state.dataset) {
      return "";
    }

    const numeric = Number(value);
    return state.dataset.lookups.ano.includes(numeric) ? String(numeric) : "";
  }

  function resolveSlugParam(value, lookup) {
    if (!value || !lookup) {
      return "";
    }

    const cleaned = String(value).trim();
    if (lookup.has(cleaned)) {
      return lookup.get(cleaned) || "";
    }

    for (const entry of lookup.entries()) {
      if (entry[0].startsWith(cleaned) || cleaned.startsWith(entry[0])) {
        return entry[1];
      }
    }

    return "";
  }

  function resolveOptionParam(value, options) {
    if (!value) {
      return "";
    }

    const match = options.find(function (option) {
      return option.param === value;
    });
    return match ? match.value : "";
  }

  function applyFiltersToControls() {
    if (DOM.filterTipo) {
      DOM.filterTipo.value = slugify(state.filters.tipo);
    }
    if (DOM.filterAno) {
      DOM.filterAno.value = state.filters.ano;
    }
    if (DOM.filterGestor) {
      DOM.filterGestor.value = slugify(state.filters.gestor);
    }
    if (DOM.filterSituacao) {
      DOM.filterSituacao.value = state.filters.situacao;
    }
    if (DOM.filterOrdenacao) {
      DOM.filterOrdenacao.value = state.filters.ordenacao;
    }
    if (DOM.filterBusca) {
      DOM.filterBusca.value = sanitizeSearchInput(state.filters.busca);
    }
    syncSearchFieldState();
    syncMobileFilterCount();
  }

  function populateStaticOrderSelect() {
    populateSelect(DOM.filterOrdenacao, ORDER_OPTIONS, {
      placeholder: null,
      selected: state.filters.ordenacao,
      labelFormatter: function (option) {
        return option.label;
      }
    });
  }

  function refreshAllSelects() {
    populateDynamicSelect("tipo");
    populateDynamicSelect("ano");
    populateDynamicSelect("gestor");
    populateDynamicSelect("situacao");
    populateStaticOrderSelect();
  }

  function populateDynamicSelect(field) {
    const select = getSelectForField(field);
    if (!select || !state.dataset) {
      return;
    }

    const options = getOptionsForField(field);
    const counts = countOptions(field);
    const selectedValue = getFilterValue(field);

    const normalizedOptions = options.map(function (option) {
      const count = counts.get(option.value) || 0;
      return Object.assign({}, option, {
        count: count,
        disabled: count === 0 && option.value !== selectedValue
      });
    });

    populateSelect(select, normalizedOptions, {
      placeholder: getPlaceholderForField(field),
      selected: selectedValue,
      labelFormatter: function (option) {
        if (!option.value) {
          return option.label;
        }
        return option.label + " (" + option.count + ")";
      }
    });
  }

  function populateSelect(select, options, config) {
    const settings = Object.assign(
      {
        placeholder: "",
        selected: "",
        labelFormatter: function (option) {
          return option.label;
        }
      },
      config || {}
    );

    const fragment = document.createDocumentFragment();

    if (settings.placeholder !== null) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = settings.placeholder || "Todos";
      fragment.appendChild(placeholder);
    }

    options.forEach(function (option) {
      const element = document.createElement("option");
      element.value = option.value;
      element.disabled = Boolean(option.disabled);
      element.selected = option.value === settings.selected;
      element.textContent = settings.labelFormatter(option);
      fragment.appendChild(element);
    });

    select.replaceChildren(fragment);
  }

  function getSelectForField(field) {
    switch (field) {
      case "tipo":
        return DOM.filterTipo;
      case "ano":
        return DOM.filterAno;
      case "gestor":
        return DOM.filterGestor;
      case "situacao":
        return DOM.filterSituacao;
      default:
        return null;
    }
  }

  function getFilterValue(field) {
    switch (field) {
      case "tipo":
        return slugify(state.filters.tipo);
      case "ano":
        return state.filters.ano;
      case "gestor":
        return slugify(state.filters.gestor);
      case "situacao":
        return state.filters.situacao;
      default:
        return "";
    }
  }

  function getPlaceholderForField(field) {
    switch (field) {
      case "tipo":
        return "Todos os tipos";
      case "ano":
        return "Todos os anos";
      case "gestor":
        return "Todos os gestores";
      case "situacao":
        return "Todas as situações";
      default:
        return "Todos";
    }
  }

  function getOptionsForField(field) {
    switch (field) {
      case "tipo":
        return getTypeOptions();
      case "ano":
        return state.dataset.lookups.ano.map(function (year) {
          return { value: String(year), label: String(year) };
        });
      case "gestor":
        return state.dataset.lookups.gestor.map(function (value) {
          return { value: slugify(value), label: titleCase(value) };
        });
      case "situacao":
        return SITUATION_OPTIONS.filter(function (option) {
          return option.value !== "";
        }).map(function (option) {
          return { value: option.value, label: option.label };
        });
      default:
        return [];
    }
  }

  function getTypeOptions() {
    const known = new Set(TYPE_ORDER);
    const fromData = state.dataset.lookups.tipo.slice().sort(compareText);
    const ordered = TYPE_ORDER.filter(function (value) {
      return fromData.includes(value);
    }).concat(
      fromData.filter(function (value) {
        return !known.has(value);
      })
    );

    return ordered.map(function (value) {
      return { value: slugify(value), label: titleCase(value) };
    });
  }

  function countOptions(field) {
    const records = getFilteredRecords({
      filters: state.filters,
      excludeField: field,
      skipSort: true
    });

    const counts = new Map();

    records.forEach(function (record) {
      if (field === "tipo" && record.tipo) {
        incrementMap(counts, slugify(record.tipo));
      }
      if (field === "ano" && record.ano) {
        incrementMap(counts, String(record.ano));
      }
      if (field === "gestor" && record.gestor) {
        incrementMap(counts, slugify(record.gestor));
      }
      if (field === "situacao") {
        incrementMap(counts, record.situacao.key);
        if (ACTIVE_SITUATION_KEYS.includes(record.situacao.key)) {
          incrementMap(counts, "vigentes");
        }
      }
    });

    return counts;
  }

  function incrementMap(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
  }

  function handleFilterChange(event) {
    if (!state.dataset) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target === DOM.filterTipo) {
      state.filters.tipo = resolveSlugParam(target.value, state.dataset.lookups.tipoBySlug);
    }
    if (target === DOM.filterAno) {
      state.filters.ano = target.value || "";
    }
    if (target === DOM.filterGestor) {
      state.filters.gestor = resolveSlugParam(target.value, state.dataset.lookups.gestorBySlug);
    }
    if (target === DOM.filterSituacao) {
      state.filters.situacao = target.value || "";
    }
    if (target === DOM.filterOrdenacao) {
      state.filters.ordenacao = target.value || DEFAULT_FILTERS.ordenacao;
    }

    if (state.loadingController) {
      state.loadingController.flashField(target);
    }

    state.filterCache.clear();
    refreshAllSelects();
    scheduleRender();
  }

  function handleSearchInput(event) {
    window.clearTimeout(state.searchTimer);
    const input = event.target;
    const nextValue = sanitizeSearchInput(input.value);
    if (input.value !== nextValue) {
      input.value = nextValue;
    }
    syncSearchFieldState();

    state.searchTimer = window.setTimeout(function () {
      state.filters.busca = nextValue;
      state.filterCache.clear();
      refreshAllSelects();
      scheduleRender();
    }, 300);
  }

  function handleSearchKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (!DOM.filterBusca || !DOM.filterBusca.value) {
      return;
    }

    event.preventDefault();
    clearSearchFilter();
  }

  function handleChipClick(event) {
    const chip = event.target.closest(".filter-chip[data-filter-key]");
    if (!chip) {
      return;
    }

    removeFilterByKey(chip.dataset.filterKey || "");
  }

  function handleChipKeydown(event) {
    const currentChip = event.target.closest(".filter-chip[data-filter-key]");
    if (!currentChip || !DOM.chips) {
      return;
    }

    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) {
      return;
    }

    const chips = Array.from(DOM.chips.querySelectorAll(".filter-chip[data-filter-key]"));
    const currentIndex = chips.indexOf(currentChip);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;
    if (key === "ArrowLeft") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : chips.length - 1;
    }
    if (key === "ArrowRight") {
      nextIndex = currentIndex < chips.length - 1 ? currentIndex + 1 : 0;
    }
    if (key === "Home") {
      nextIndex = 0;
    }
    if (key === "End") {
      nextIndex = chips.length - 1;
    }

    if (chips[nextIndex]) {
      event.preventDefault();
      chips[nextIndex].focus();
    }
  }

  function clearAllFilters() {
    state.filters = Object.assign({}, DEFAULT_FILTERS);
    state.filterCache.clear();
    applyFiltersToControls();
    refreshAllSelects();
    scheduleRender();
  }

  function clearSearchFilter() {
    window.clearTimeout(state.searchTimer);
    if (DOM.filterBusca) {
      DOM.filterBusca.value = "";
    }
    if (state.loadingController && DOM.searchShell) {
      state.loadingController.flashField(DOM.searchShell);
    }
    state.filters.busca = "";
    syncSearchFieldState();
    state.filterCache.clear();
    refreshAllSelects();
    scheduleRender();
  }

  function removeFilterByKey(key) {
    if (!key) {
      return;
    }

    if (key === "pendencias") {
      state.filters.pendencias = "";
    } else if (key === "busca") {
      state.filters.busca = "";
    } else if (Object.prototype.hasOwnProperty.call(state.filters, key)) {
      state.filters[key] = "";
    }

    state.filterCache.clear();
    applyFiltersToControls();
    refreshAllSelects();
    scheduleRender();
  }

  function handleKpiClick(event) {
    const card = event.currentTarget;
    const filterKey = card.dataset.filterKey;
    const filterValue = card.dataset.filterValue;

    if (!filterKey) {
      return;
    }

    if (filterKey === "situacao") {
      state.filters.situacao = state.filters.situacao === filterValue || filterValue === "todos"
        ? ""
        : filterValue;
    }

    if (filterKey === "pendencias") {
      state.filters.pendencias = state.filters.pendencias === "com_pendencias"
        ? ""
        : "com_pendencias";
    }

    state.filterCache.clear();
    applyFiltersToControls();
    refreshAllSelects();
    scheduleRender();
    scrollToResults();
  }

  function handleViewportChange() {
    const nextViewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const shouldRefreshLayout = state.dataset && Math.abs(nextViewportWidth - state.viewportWidth) > 24;

    state.viewportWidth = nextViewportWidth;
    syncMobileViewportMetrics();

    if (!isMobileViewport()) {
      toggleMobileFilters(false, true);
    }
    syncFiltersLayoutForViewport();
    applyResponsiveSectionDefaults();
    initStickyFiltersObserver();

    if (shouldRefreshLayout) {
      window.clearTimeout(state.resizeRenderTimer);
      state.resizeRenderTimer = window.setTimeout(function () {
        state.resizeRenderTimer = 0;
        scheduleRender({
          syncUrl: false
        });
      }, 120);
    }
  }

  function handleResultsViewToggle(event) {
    const button = event.currentTarget;
    if (!button) {
      return;
    }

    const nextMode = button.dataset.resultsView === "table" ? "table" : "cards";
    if (state.resultsViewMode === nextMode) {
      return;
    }

    state.resultsViewMode = nextMode;
    writeResultsViewMode(nextMode);
    applyResultsViewMode();
  }

  function applyResultsViewMode() {
    const mode = state.resultsViewMode === "table" ? "table" : "cards";

    [DOM.resultsSection, DOM.encerradosSection, DOM.gruposTipo, DOM.gruposEncerrados]
      .filter(Boolean)
      .forEach(function (element) {
        element.dataset.viewMode = mode;
      });

    DOM.resultsViewButtons.forEach(function (button) {
      const isActive = button.dataset.resultsView === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function syncFiltersLayoutForViewport() {
    if (!DOM.filtersGrid || !DOM.filtersDesktopSlot || !DOM.mobileFiltersSheetBody) {
      return;
    }

    const nextParent = isMobileViewport()
      ? DOM.mobileFiltersSheetBody
      : DOM.filtersDesktopSlot;

    if (DOM.filtersGrid.parentElement !== nextParent) {
      nextParent.appendChild(DOM.filtersGrid);
    }

    syncFiltersShellMetrics();
  }

  function lockMobileFiltersScroll() {
    if (state.bodyLockStyles) {
      return;
    }

    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    state.mobileFiltersScrollY = scrollY;
    state.bodyLockStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight
    };

    body.style.position = "fixed";
    body.style.top = "-" + scrollY + "px";
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      body.style.paddingRight = scrollbarGap + "px";
    }
  }

  function unlockMobileFiltersScroll() {
    if (!state.bodyLockStyles) {
      return;
    }

    const body = document.body;
    const scrollY = state.mobileFiltersScrollY || 0;

    body.style.position = state.bodyLockStyles.position;
    body.style.top = state.bodyLockStyles.top;
    body.style.left = state.bodyLockStyles.left;
    body.style.right = state.bodyLockStyles.right;
    body.style.width = state.bodyLockStyles.width;
    body.style.overflow = state.bodyLockStyles.overflow;
    body.style.paddingRight = state.bodyLockStyles.paddingRight;

    state.bodyLockStyles = null;
    state.mobileFiltersScrollY = 0;

    window.requestAnimationFrame(function () {
      window.scrollTo(0, scrollY);
    });
  }

  function toggleMobileFilters(open, silent) {
    if (
      !DOM.filtersShell ||
      !DOM.mobileFiltersToggle ||
      !DOM.mobileFiltersBackdrop ||
      !DOM.mobileFiltersOverlay ||
      !DOM.mobileFiltersSheet
    ) {
      return;
    }

    const shouldOpen = Boolean(open);
    if (shouldOpen && !isMobileViewport()) {
      return;
    }

    if (shouldOpen) {
      syncFiltersLayoutForViewport();
      syncMobileViewportMetrics();
    }

    if (state.mobileFiltersOpen === shouldOpen) {
      return;
    }

    window.clearTimeout(state.mobileFiltersHideTimer);
    state.mobileFiltersHideTimer = 0;
    state.mobileFiltersOpen = shouldOpen;

    DOM.filtersShell.classList.toggle("is-sheet-open", shouldOpen);
    DOM.mobileFiltersOverlay.classList.toggle("is-open", shouldOpen);
    DOM.mobileFiltersOverlay.setAttribute("aria-hidden", String(!shouldOpen));
    DOM.mobileFiltersSheet.setAttribute("aria-hidden", String(!shouldOpen));
    DOM.mobileFiltersToggle.setAttribute("aria-expanded", String(shouldOpen));
    document.body.classList.toggle("has-filters-sheet-open", shouldOpen);

    if ("inert" in DOM.mobileFiltersSheet) {
      DOM.mobileFiltersSheet.inert = !shouldOpen;
    }

    if (shouldOpen) {
      state.mobileFiltersReturnFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : DOM.mobileFiltersToggle;
      DOM.mobileFiltersBackdrop.hidden = false;
      lockMobileFiltersScroll();
      requestViewportMetricsSync();

      window.requestAnimationFrame(function () {
        if (DOM.mobileFiltersClose) {
          DOM.mobileFiltersClose.focus();
        }
      });

      return;
    }

    unlockMobileFiltersScroll();
    requestViewportMetricsSync();
    state.mobileFiltersHideTimer = window.setTimeout(function () {
      DOM.mobileFiltersBackdrop.hidden = true;
      state.mobileFiltersHideTimer = 0;
    }, 260);

    if (!silent) {
      const returnFocus = state.mobileFiltersReturnFocus || DOM.mobileFiltersToggle;
      window.requestAnimationFrame(function () {
        if (returnFocus && typeof returnFocus.focus === "function") {
          returnFocus.focus();
        }
      });
    }

    state.mobileFiltersReturnFocus = null;
  }

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches;
  }

  function syncSearchFieldState() {
    const hasValue = Boolean(DOM.filterBusca && DOM.filterBusca.value.trim());
    if (DOM.searchShell) {
      DOM.searchShell.classList.toggle("has-value", hasValue);
    }
    if (DOM.searchClear) {
      DOM.searchClear.classList.toggle("is-hidden", !hasValue);
    }
  }

  function syncMobileFilterCount() {
    if (!DOM.mobileFiltersCount) {
      return;
    }
    DOM.mobileFiltersCount.textContent = String(getActiveFilterCount());
  }

  function getActiveFilterCount() {
    let count = 0;
    if (state.filters.tipo) { count += 1; }
    if (state.filters.ano) { count += 1; }
    if (state.filters.gestor) { count += 1; }
    if (state.filters.situacao) { count += 1; }
    if (state.filters.busca) { count += 1; }
    if (state.filters.pendencias) { count += 1; }
    return count;
  }

  function scheduleRender(options) {
    const settings = Object.assign(
      {
        syncUrl: true,
        replaceUrl: false,
        syncModalFromUrl: false
      },
      options || {}
    );

    if (state.renderFrame) {
      window.cancelAnimationFrame(state.renderFrame);
    }

    state.renderFrame = window.requestAnimationFrame(function () {
      state.renderFrame = 0;
      render(settings);
    });
  }

  function render(options) {
    const settings = Object.assign(
      {
        syncUrl: true,
        replaceUrl: false,
        syncModalFromUrl: false,
        printMode: state.isPrinting
      },
      options || {}
    );

    const records = getFilteredRecords({
      filters: state.filters
    });

    state.latestFiltered = records;

    updateResultBadge(records);
    renderChips();
    syncFiltersShellMetrics();
    renderKpis(records);
    if (!settings.printMode) {
      renderRadar(records);
      renderPendencias(records);
    }
    if (!settings.printMode && canRenderLazySection(DOM.distribuicaoSection)) {
      renderDistribuicao(records);
    }
    if (settings.printMode || canRenderLazySection(DOM.resultsSection)) {
      state.tableRenderer.render({
        records: records,
        order: state.filters.ordenacao,
        searchQuery: state.filters.busca,
        emptySuggestion: records.length ? null : getMostRestrictiveFilterSuggestion(),
        disablePagination: settings.printMode,
        expandAll: settings.printMode
      });
      applyResultsViewMode();
    }
    syncSummary(records);
    syncPrintContext(records);

    if (settings.syncUrl) {
      syncUrl({
        replaceUrl: settings.replaceUrl,
        contractRecord: state.modalController ? state.modalController.getActiveRecord() : null
      });
    }

    if (settings.syncModalFromUrl) {
      syncModalFromUrl();
    }
  }

  function getFilteredRecords(config) {
    if (!state.dataset) {
      return [];
    }

    const settings = Object.assign(
      {
        filters: state.filters,
        excludeField: "",
        skipSort: false
      },
      config || {}
    );

    const cacheKey = serializeFilterCacheKey(settings.filters, settings.excludeField);
    let ids = state.filterCache.get(cacheKey);

    if (!ids) {
      ids = computeFilteredIds(settings.filters, settings.excludeField);
      state.filterCache.set(cacheKey, ids);
    }

    let records = ids.map(function (id) {
      return state.dataset.indices.byId.get(id);
    }).filter(Boolean);

    if (!settings.skipSort) {
      records = sortRecords(records, settings.filters.ordenacao);
    }

    return records;
  }

  function serializeFilterCacheKey(filters, excludeField) {
    return [
      excludeField || "",
      excludeField === "tipo" ? "" : filters.tipo,
      excludeField === "ano" ? "" : filters.ano,
      excludeField === "gestor" ? "" : filters.gestor,
      excludeField === "situacao" ? "" : filters.situacao,
      excludeField === "pendencias" ? "" : filters.pendencias,
      normalizeText(filters.busca)
    ].join("|");
  }

  function computeFilteredIds(filters, excludeField) {
    const sets = [];

    if (filters.tipo && excludeField !== "tipo") {
      sets.push(state.dataset.indices.fields.tipo.get(slugify(filters.tipo)) || new Set());
    }
    if (filters.ano && excludeField !== "ano") {
      sets.push(state.dataset.indices.fields.ano.get(String(filters.ano)) || new Set());
    }
    if (filters.gestor && excludeField !== "gestor") {
      sets.push(state.dataset.indices.fields.gestor.get(slugify(filters.gestor)) || new Set());
    }
    if (filters.situacao && excludeField !== "situacao") {
      sets.push(getSituationFilterSet(filters.situacao));
    }
    if (filters.pendencias && excludeField !== "pendencias") {
      sets.push(state.dataset.indices.fields.pendencias.get("com_pendencias") || new Set());
    }

    let candidateIds = sets.length ? intersectSets(sets) : state.dataset.indices.allIds.slice();
    const searchTerm = normalizeText(filters.busca);

    if (searchTerm) {
      candidateIds = candidateIds.filter(function (id) {
        const record = state.dataset.indices.byId.get(id);
        return record && record.search_blob.includes(searchTerm);
      });
    }

    return candidateIds;
  }

  function intersectSets(sets) {
    const ordered = sets
      .filter(Boolean)
      .slice()
      .sort(function (a, b) {
        return a.size - b.size;
      });

    if (!ordered.length) {
      return [];
    }

    const result = new Set(ordered[0]);
    for (let index = 1; index < ordered.length; index += 1) {
      for (const value of result) {
        if (!ordered[index].has(value)) {
          result.delete(value);
        }
      }
    }

    return Array.from(result);
  }

  function getSituationFilterSet(filterValue) {
    const field = state.dataset.indices.fields.situacao;
    if (filterValue === "vigentes") {
      return unionSets([
        field.get("vigente_regular"),
        field.get("vence_30"),
        field.get("vence_31_90")
      ]);
    }
    return field.get(filterValue) || new Set();
  }

  function unionSets(sets) {
    const result = new Set();
    sets.filter(Boolean).forEach(function (set) {
      set.forEach(function (value) {
        result.add(value);
      });
    });
    return result;
  }

  function sortRecords(records, order) {
    const next = records.slice();

    switch (order) {
      case "vigencia":
        next.sort(compareByDueDate);
        break;
      case "maior_valor":
        next.sort(compareByHigherValue);
        break;
      case "menor_valor":
        next.sort(compareByLowerValue);
        break;
      case "fornecedor":
        next.sort(function (a, b) {
          return compareText(a.empresa, b.empresa);
        });
        break;
      case "ano_desc":
        next.sort(function (a, b) {
          if ((b.ano || 0) !== (a.ano || 0)) {
            return (b.ano || 0) - (a.ano || 0);
          }
          return compareText(a.empresa, b.empresa);
        });
        break;
      case "risco":
      default:
        next.sort(compareByRisk);
        break;
    }

    return next;
  }

  function compareByRisk(a, b) {
    if (a.situacao.order !== b.situacao.order) {
      return a.situacao.order - b.situacao.order;
    }
    if (coalesceNumber(a.dias_para_vencimento, Number.POSITIVE_INFINITY) !== coalesceNumber(b.dias_para_vencimento, Number.POSITIVE_INFINITY)) {
      return coalesceNumber(a.dias_para_vencimento, Number.POSITIVE_INFINITY) - coalesceNumber(b.dias_para_vencimento, Number.POSITIVE_INFINITY);
    }
    const valueComparison = compareValuePresenceThenAmount(a, b, "desc");
    if (valueComparison !== 0) {
      return valueComparison;
    }
    return compareText(a.empresa, b.empresa);
  }

  function compareByDueDate(a, b) {
    const dueA = a.vencimento ? new Date(a.vencimento) : null;
    const dueB = b.vencimento ? new Date(b.vencimento) : null;

    if (!dueA && !dueB) {
      return compareText(a.empresa, b.empresa);
    }
    if (!dueA) {
      return 1;
    }
    if (!dueB) {
      return -1;
    }
    return dueA.getTime() - dueB.getTime();
  }

  function compareByHigherValue(a, b) {
    const comparison = compareValuePresenceThenAmount(a, b, "desc");
    if (comparison !== 0) {
      return comparison;
    }
    return compareText(a.empresa, b.empresa);
  }

  function compareByLowerValue(a, b) {
    const comparison = compareValuePresenceThenAmount(a, b, "asc");
    if (comparison !== 0) {
      return comparison;
    }
    return compareText(a.empresa, b.empresa);
  }

  function compareValuePresenceThenAmount(a, b, direction) {
    const hasA = hasProvidedNumber(a && a.valor, a && a.valor_informado);
    const hasB = hasProvidedNumber(b && b.valor, b && b.valor_informado);

    if (hasA !== hasB) {
      return hasA ? -1 : 1;
    }

    if (!hasA && !hasB) {
      return 0;
    }

    if (a.valor === b.valor) {
      return 0;
    }

    return direction === "asc"
      ? a.valor - b.valor
      : b.valor - a.valor;
  }

  function updateResultBadge(records) {
    const count = records.length;
    const total = state.dataset && state.dataset.metadata
      ? Number(state.dataset.metadata.total_registros || state.dataset.contratos.length || 0)
      : count;
    if (DOM.badgeResultados) {
      let counter = DOM.contagemResultados;
      if (!counter || !DOM.badgeResultados.contains(counter)) {
        counter = document.createElement("span");
        counter.className = "mono";
        counter.id = "contagem-resultados";
        DOM.contagemResultados = counter;
      }

      if (count === 0) {
        DOM.badgeResultados.replaceChildren(document.createTextNode("0 de " + total + " contratos"));
      } else {
        DOM.badgeResultados.replaceChildren(
          counter,
          document.createTextNode(" de " + total + " contratos")
        );
        if (state.loadingController) {
          state.loadingController.animateValue(counter, count, "number");
        } else {
          counter.dataset.currentValue = String(count);
          counter.textContent = String(count);
        }
      }
    }
  }

  function renderLoadFailureView(failureState) {
    const loadFailure = failureState || getLoadFailureState();
    const buildFailureState = function (message, role) {
      return createMessageState({
        title: loadFailure.sectionTitle,
        message: message,
        role: role || "status",
        buttonLabel: role === "alert" ? "Tentar novamente" : "",
        onClick: role === "alert" ? bootstrap : null,
        linkLabel: loadFailure.linkLabel,
        linkHref: loadFailure.linkHref
      });
    };

    if (state.tableRenderer) {
      state.tableRenderer.clear();
    }

    if (DOM.gruposTipo) {
      DOM.gruposTipo.replaceChildren(
        buildFailureState(loadFailure.sectionMessage, "alert")
      );
    }

    if (DOM.gruposEncerrados) {
      DOM.gruposEncerrados.replaceChildren();
    }

    if (DOM.encerradosCounter) {
      DOM.encerradosCounter.textContent = "0";
    }

    if (DOM.radarTimeline) {
      DOM.radarTimeline.replaceChildren(
        buildFailureState("Tente recarregar a página para exibir a timeline de vencimentos.")
      );
    }

    if (DOM.radarList) {
      DOM.radarList.replaceChildren(
        buildFailureState("Tente recarregar a página para exibir os alertas de vencimento.")
      );
    }

    if (DOM.pendenciasList) {
      DOM.pendenciasList.replaceChildren(
        buildFailureState("Tente recarregar a página para exibir as pendências cadastrais.")
      );
    }

    [DOM.donutChart, DOM.gaugeChart, DOM.barsChart].forEach(function (container) {
      if (!container) {
        return;
      }

      container.replaceChildren(
        buildFailureState("Tente recarregar a página para exibir os gráficos analíticos.")
      );
    });

    if (DOM.distribuicaoTable) {
      const tbody = DOM.distribuicaoTable.querySelector("tbody");
      if (tbody) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.appendChild(
          buildFailureState("Tente recarregar a página para exibir o resumo por tipo.")
        );
        row.appendChild(cell);
        tbody.replaceChildren(row);
      }
    }

    resetSummaryForLoadFailure();
    return;

    if (DOM.gruposTipo) {
      DOM.gruposTipo.replaceChildren(
        createMessageState({
          title: "Não foi possível carregar os dados.",
          message: "Tente novamente para recarregar a listagem do painel.",
          buttonLabel: "Tentar novamente",
          role: "alert",
          onClick: bootstrap,
          title: loadFailure.sectionTitle,
          message: loadFailure.sectionMessage,
          linkLabel: loadFailure.linkLabel,
          linkHref: loadFailure.linkHref
        })
      );
    }

    if (DOM.gruposEncerrados) {
      DOM.gruposEncerrados.replaceChildren();
    }

    if (DOM.encerradosCounter) {
      DOM.encerradosCounter.textContent = "0";
    }

    if (DOM.radarTimeline) {
      DOM.radarTimeline.replaceChildren(
        createMessageState({
          title: "Não foi possível carregar os dados.",
          message: "Os gráficos serão exibidos assim que o carregamento funcionar novamente."
        })
      );
    }

    if (DOM.radarList) {
      DOM.radarList.replaceChildren(
        createMessageState({
          title: "Não foi possível carregar os dados.",
          message: "Os alertas de vencimento dependem do carregamento dos contratos."
        })
      );
    }

    if (DOM.pendenciasList) {
      DOM.pendenciasList.replaceChildren(
        createMessageState({
          title: "Não foi possível carregar os dados.",
          message: "As pendências cadastrais serão exibidas após um novo carregamento."
        })
      );
    }

    [DOM.donutChart, DOM.gaugeChart, DOM.barsChart].forEach(function (container) {
      if (container) {
        container.replaceChildren(
          createMessageState({
            title: "Não foi possível carregar os dados.",
            message: "Os gráficos analíticos serão renderizados após a próxima tentativa."
          })
        );
      }
    });

    if (DOM.distribuicaoTable) {
      const tbody = DOM.distribuicaoTable.querySelector("tbody");
      if (tbody) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.appendChild(
          createMessageState({
            title: "Não foi possível carregar os dados.",
            message: "O resumo tabular depende do carregamento do conjunto de contratos."
          })
        );
        row.appendChild(cell);
        tbody.replaceChildren(row);
      }
    }

    resetSummaryForLoadFailure();
  }

  function renderChips() {
    if (!DOM.chips || !DOM.templates.chip) {
      return;
    }

    DOM.chips.querySelectorAll(".filter-chip[data-filter-key]").forEach(function (chip) {
      chip.remove();
    });

    const chips = [];

    if (state.filters.tipo) {
      chips.push({ key: "tipo", label: "Tipo: " + titleCase(state.filters.tipo) });
    }
    if (state.filters.ano) {
      chips.push({ key: "ano", label: "Ano: " + state.filters.ano });
    }
    if (state.filters.gestor) {
      chips.push({ key: "gestor", label: "Gestor: " + titleCase(state.filters.gestor) });
    }
    if (state.filters.situacao) {
      chips.push({ key: "situacao", label: "Situação: " + getSituationFilterLabel(state.filters.situacao) });
    }
    if (state.filters.busca) {
      chips.push({ key: "busca", label: "Busca: " + state.filters.busca });
    }
    if (state.filters.pendencias) {
      chips.push({ key: "pendencias", label: "Pendências: com dados faltantes" });
    }

    chips.forEach(function (chipInfo) {
      const fragment = DOM.templates.chip.content.cloneNode(true);
      const button = fragment.querySelector("button");
      const label = fragment.querySelector(".filter-chip__label");
      button.style.setProperty("--chip-index", String(chips.indexOf(chipInfo)));
      button.dataset.filterKey = chipInfo.key;
      button.setAttribute("aria-label", "Remover filtro " + chipInfo.label);
      button.title = "Remover filtro " + chipInfo.label;
      label.textContent = chipInfo.label;
      DOM.chips.insertBefore(fragment, DOM.clearFilters);
    });

    if (DOM.chipPlaceholder) {
      DOM.chipPlaceholder.classList.toggle("is-hidden", chips.length > 0);
    }
    if (DOM.clearFilters) {
      DOM.clearFilters.classList.toggle("is-hidden", chips.length === 0);
    }
    syncMobileFilterCount();
  }

  function getSituationFilterLabel(value) {
    const option = SITUATION_OPTIONS.find(function (item) {
      return item.value === value;
    });
    return option ? option.label : "Situação";
  }

  function renderKpis(records) {
    const totals = applyIndicators({
      totals: {
        total: records.length,
        valor: records.reduce(function (sum, record) {
          return sum + (record.valor || 0);
        }, 0),
        vence30: records.filter(function (record) {
          return record.situacao.key === "vence_30";
        }).length,
        vence90: records.filter(function (record) {
          return record.situacao.key === "vence_31_90";
        }).length,
        semVigencia: records.filter(function (record) {
          return record.situacao.key === "sem_vigencia";
        }).length,
        pendencias: records.filter(function (record) {
          return record.campos_pendentes.length > 0;
        }).length
      },
      dataset: state.dataset,
      kpis: DOM.kpis,
      cards: DOM.kpiCardElements,
      loadingController: state.loadingController
    });

    syncPrintKpis(totals);
    syncContextStrip(totals);
    updateUrgentAnnouncements(totals.vence30);
  }

  function getDatasetTotalValue() {
    if (!state.dataset) {
      return 0;
    }
    return state.dataset.contratos.reduce(function (sum, record) {
      return sum + (record.valor || 0);
    }, 0);
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
    if (card) {
      card.classList.toggle("is-muted", Number(value) === 0);
      if (card.id === KPI_30_KEY) {
        card.classList.toggle("kpi-card--alert-active", Number(value) > 0);
      }
    }
  }

  function setCardFill(card, value, max) {
    if (!card) {
      return;
    }
    const ratio = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
    card.style.setProperty("--card-fill", Math.min(100, ratio) + "%");
  }

  function renderRadar(records) {
    if (!DOM.radarSection || !DOM.radarList || !DOM.templates.radarCard) {
      return;
    }

    const urgent = records
      .filter(function (record) {
        return record.dias_para_vencimento != null &&
          record.dias_para_vencimento >= 0 &&
          record.dias_para_vencimento <= 90;
      })
      .sort(compareByRisk)
      .slice(0, 6);

    setSectionEmptyState(DOM.radarSection, urgent.length === 0);
    if (DOM.radarCounter) {
      DOM.radarCounter.textContent = String(urgent.length);
    }

    renderTimeline(records, DOM.radarTimeline, {
      emptyTitle: records.length === 0
        ? "Nenhum contrato corresponde aos filtros selecionados."
        : "Nenhum vencimento nos próximos 90 dias.",
      emptyMessage: records.length === 0
        ? "Ajuste ou limpe os filtros para visualizar a timeline."
        : "Quando houver contratos nessa janela, a timeline mostrará os pontos de risco aqui.",
      onContractSelect: function (contractId) {
        if (state.modalController) {
          state.modalController.openById(contractId, {
            syncUrl: true,
            replaceUrl: false
          });
        }
      }
    });
    setChartSummary(DOM.radarTimeline, buildTimelineChartSummary(records, urgent));

    DOM.radarList.replaceChildren();

    if (!urgent.length) {
      DOM.radarList.appendChild(
        createMessageState({
          title: records.length === 0
            ? "Nenhum contrato corresponde aos filtros selecionados."
            : "Nenhum contrato com vencimento nos próximos 90 dias.",
          message: records.length === 0
            ? "Ajuste ou limpe os filtros para voltar a exibir os alertas."
            : "Quando houver contratos nessa janela, os alertas aparecerão aqui."
        })
      );
      return;
    }

    urgent.forEach(function (record) {
      const fragment = DOM.templates.radarCard.content.cloneNode(true);
      const card = fragment.querySelector(".urgent-card");
      const company = fragment.querySelector(".urgent-card__company");
      const status = fragment.querySelector(".status-badge");
      const object = fragment.querySelector(".urgent-card__object");
      const pills = fragment.querySelectorAll(".pill");
      const urgencyClass = record.dias_para_vencimento <= 15
        ? "urgent-card--critical"
        : record.dias_para_vencimento <= 45
          ? "urgent-card--warning"
          : "urgent-card--watch";

      card.classList.add(urgencyClass);
      card.dataset.contractId = String(record.id);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Abrir detalhes do contrato " + (record.contrato || record.id));

      setHighlightedContent(company, getDisplayText(record.empresa), state.filters.busca);
      status.className = "status-badge " + record.situacao.badgeClass;
      status.textContent = record.dias_para_vencimento + " dias";
      setHighlightedContent(object, truncateText(record.objeto || "Não informado", 84), state.filters.busca);

      if (pills[0]) {
        pills[0].textContent = record.valor == null ? "—" : formatCurrency(record.valor);
      }
      if (pills[0]) {
        pills[0].textContent = formatOptionalCurrency(record.valor, record.valor_informado, "—");
      }
      if (pills[1]) {
        pills[1].textContent = titleCase(record.tipo || "Sem tipo");
      }

      DOM.radarList.appendChild(fragment);
    });
  }

  function renderPendencias(records) {
    if (!DOM.pendenciasSection || !DOM.pendenciasList || !DOM.templates.pendenciaItem) {
      return;
    }

    const pendentes = records.filter(function (record) {
      return record.campos_pendentes.length > 0;
    });

    setSectionEmptyState(DOM.pendenciasSection, pendentes.length === 0);
    if (DOM.pendenciasCounter) {
      DOM.pendenciasCounter.textContent = String(pendentes.length);
    }
    DOM.pendenciasList.replaceChildren();

    if (!pendentes.length) {
      DOM.pendenciasList.appendChild(
        createMessageState({
          title: records.length === 0
            ? "Nenhum contrato corresponde aos filtros selecionados."
            : "Nenhum contrato com dados pendentes no recorte atual.",
          message: records.length === 0
            ? "Ajuste ou limpe os filtros para voltar a exibir esta lista."
            : "Quando houver pendências no recorte atual, elas serão exibidas aqui."
        })
      );
      return;
    }

    pendentes.forEach(function (record) {
      const fragment = DOM.templates.pendenciaItem.content.cloneNode(true);
      const item = fragment.querySelector(".pending-item");
      const title = fragment.querySelector(".pending-item__title");
      const badges = fragment.querySelector(".pending-item__badges");

      item.dataset.contractId = String(record.id);
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "Abrir detalhes do contrato " + (record.contrato || record.id));

      setHighlightedContent(
        title,
        getDisplayText(record.contrato) + " — " + getDisplayText(record.empresa),
        state.filters.busca
      );

      badges.replaceChildren();
      record.campos_pendentes.forEach(function (campo) {
        const badge = document.createElement("span");
        badge.className = "pending-badge";
        badge.textContent = campo;
        badges.appendChild(badge);
      });

      DOM.pendenciasList.appendChild(fragment);
    });
  }

  function renderDistribuicao(records) {
    if (!DOM.distribuicaoSection || !DOM.distribuicaoTable) {
      return;
    }

    const totals = new Map();
    const completeCount = records.filter(function (record) {
      return record.campos_pendentes.length === 0;
    }).length;
    records.forEach(function (record) {
      const key = record.tipo || "Sem tipo";
      if (!totals.has(key)) {
        totals.set(key, {
          quantidade: 0,
          valor: 0
        });
      }
      const bucket = totals.get(key);
      bucket.quantidade += 1;
      bucket.valor += record.valor || 0;
    });

    setSectionEmptyState(DOM.distribuicaoSection, records.length === 0);
    if (DOM.distribuicaoCounter) {
      DOM.distribuicaoCounter.textContent = String(totals.size);
    }

    renderDonut(records, DOM.donutChart, {
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico.",
      onTypeSelect: applyTypeFilter
    });
    renderBars(records, DOM.barsChart, {
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico.",
      onTypeSelect: applyTypeFilter
    });
    renderGauge(getCompletenessPercent(records), DOM.gaugeChart, {
      emptyTitle: "Nenhum contrato corresponde aos filtros selecionados.",
      emptyMessage: "Ajuste ou limpe os filtros para voltar a exibir este gráfico.",
      completeCount: completeCount,
      totalCount: records.length
    });

    const sortedTotals = Array.from(totals.entries())
      .sort(function (a, b) {
        return b[1].quantidade - a[1].quantidade || compareText(a[0], b[0]);
      });

    setChartSummary(DOM.donutChart, buildDistributionChartSummary(sortedTotals, records.length));
    setChartSummary(DOM.gaugeChart, buildGaugeChartSummary(completeCount, records.length));
    setChartSummary(DOM.barsChart, buildYearChartSummary(records));

    const tbody = DOM.distribuicaoTable.querySelector("tbody");
    tbody.replaceChildren();

    sortedTotals
      .forEach(function (entry) {
        const row = document.createElement("tr");

        const typeCell = document.createElement("td");
        typeCell.dataset.label = "Tipo";
        typeCell.textContent = titleCase(entry[0]);

        const countCell = document.createElement("td");
        countCell.dataset.label = "Qtd";
        countCell.className = "mono";
        countCell.textContent = String(entry[1].quantidade);

        const valueCell = document.createElement("td");
        valueCell.dataset.label = "Valor total";
        valueCell.className = "mono";
        valueCell.textContent = formatCurrency(entry[1].valor);

        const percentCell = document.createElement("td");
        percentCell.dataset.label = "%";
        percentCell.textContent = records.length
          ? ((entry[1].quantidade / records.length) * 100).toFixed(1).replace(".", ",") + "%"
          : "0,0%";

        row.append(typeCell, countCell, valueCell, percentCell);
        tbody.appendChild(row);
      });

    if (!tbody.children.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.dataset.label = "Tipo";
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.setAttribute("role", "status");
      empty.setAttribute("aria-live", "polite");
      empty.textContent = "Nenhum contrato corresponde aos filtros selecionados.";
      cell.appendChild(empty);
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }

  function getCompletenessPercent(records) {
    if (!records.length) {
      return 0;
    }

    const completeCount = records.filter(function (record) {
      return record.campos_pendentes.length === 0;
    }).length;

    return (completeCount / records.length) * 100;
  }

  function applyTypeFilter(tipo) {
    if (!tipo) {
      return;
    }

    state.filters.tipo = state.filters.tipo === tipo ? "" : tipo;
    if (state.loadingController && DOM.filterTipo) {
      state.loadingController.flashField(DOM.filterTipo);
    }
    state.filterCache.clear();
    applyFiltersToControls();
    refreshAllSelects();
    scheduleRender();
  }

  function syncSummary(records) {
    const activeCount = records.filter(function (record) {
      return record.situacao.key !== "encerrado";
    }).length;

    setSectionEmptyState(DOM.resultsSection, activeCount === 0);
    if (DOM.resultsCounter) {
      DOM.resultsCounter.textContent = String(activeCount);
    }
  }

  function setSectionEmptyState(section, isEmpty) {
    if (!section) {
      return;
    }
    section.classList.toggle("is-empty", Boolean(isEmpty));
    if (isEmpty) {
      section.open = false;
    }
  }

  function createMessageState(config) {
    const settings = Object.assign(
      {
        title: "",
        message: "",
        buttonLabel: "",
        role: "status",
        onClick: null,
        linkLabel: "",
        linkHref: ""
      },
      config || {}
    );

    const wrapper = document.createElement("div");
    wrapper.className = "empty-state empty-state--search";
    wrapper.setAttribute("role", settings.role);
    wrapper.setAttribute("aria-live", settings.role === "alert" ? "assertive" : "polite");

    const title = document.createElement("p");
    title.className = "empty-state__title";
    title.textContent = settings.title;

    const message = document.createElement("p");
    message.className = "empty-state__text";
    message.textContent = settings.message;

    wrapper.append(title, message);

    if (
      (settings.buttonLabel && typeof settings.onClick === "function") ||
      (settings.linkLabel && settings.linkHref)
    ) {
      const actions = document.createElement("div");
      actions.className = "empty-state__actions";

      if (settings.linkLabel && settings.linkHref) {
        const link = document.createElement("a");
        link.className = "toolbar-button toolbar-button--ghost";
        link.href = settings.linkHref;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = settings.linkLabel;
        actions.appendChild(link);
      }

      if (settings.buttonLabel && typeof settings.onClick === "function") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "toolbar-button toolbar-button--primary";
        button.textContent = settings.buttonLabel;
        button.addEventListener("click", settings.onClick);
        actions.appendChild(button);
      }

      wrapper.appendChild(actions);
    }

    return wrapper;
  }

  function getLoadFailureState(error) {
    const code = error && error.code ? String(error.code) : "";
    const rawJsonUrl = buildRawJsonUrl();
    const isProcessingError = code === "json_parse_failed" || code === "data_parse_failed";

    return {
      bannerTitle: isProcessingError
        ? "Erro ao processar os dados"
        : "Não foi possível carregar os dados",
      bannerMessage: isProcessingError
        ? "O arquivo contratos.json foi carregado, mas não pôde ser interpretado. Tente recarregar a página ou abra o JSON bruto."
        : "Tente recarregar a página. Se o problema continuar, abra o JSON bruto como alternativa.",
      sectionTitle: isProcessingError
        ? "Erro ao processar os dados do painel."
        : "Não foi possível carregar os dados do painel.",
      sectionMessage: isProcessingError
        ? "Tente recarregar a página para processar novamente o arquivo JSON."
        : "Tente recarregar a página para restaurar a listagem e os gráficos.",
      linkLabel: "Abrir JSON bruto",
      linkHref: rawJsonUrl
    };
  }

  function buildRawJsonUrl() {
    return new URL("contratos.json", window.location.href).href;
  }

  function resetSummaryForLoadFailure() {
    applyIndicators({
      totals: {
        total: 0,
        valor: 0,
        vence30: 0,
        vence90: 0,
        semVigencia: 0,
        pendencias: 0
      },
      dataset: null,
      kpis: DOM.kpis,
      cards: DOM.kpiCardElements,
      loadingController: null
    });

    updateResultBadge([]);
    if (DOM.resultsCounter) {
      DOM.resultsCounter.textContent = "0";
    }
    if (DOM.radarCounter) {
      DOM.radarCounter.textContent = "0";
    }
    if (DOM.pendenciasCounter) {
      DOM.pendenciasCounter.textContent = "0";
    }
    if (DOM.distribuicaoCounter) {
      DOM.distribuicaoCounter.textContent = "0";
    }
    syncContextStrip({
      total: 0,
      valor: 0,
      vence30: 0,
      vence90: 0,
      semVigencia: 0,
      pendencias: 0
    });
    syncPrintKpis({
      total: 0,
      valor: 0,
      vence30: 0,
      vence90: 0,
      semVigencia: 0,
      pendencias: 0
    });
    updateUrgentAnnouncements(0);
  }

  function syncContextStrip(totals) {
    if (DOM.contextTotalContracts) {
      DOM.contextTotalContracts.textContent = new Intl.NumberFormat("pt-BR").format(totals.total);
    }

    if (DOM.contextTotalValue) {
      DOM.contextTotalValue.textContent = formatCompactCurrency(totals.valor);
    }

    if (DOM.contextTotalValueWrap) {
      DOM.contextTotalValueWrap.title = formatCurrency(totals.valor);
    }
  }

  function syncPrintKpis(totals) {
    if (!DOM.printKpis.total) {
      return;
    }

    DOM.printKpis.total.textContent = String(totals.total);
    DOM.printKpis.valor.textContent = formatCurrency(totals.valor);
    DOM.printKpis.vence30.textContent = String(totals.vence30);
    DOM.printKpis.vence90.textContent = String(totals.vence90);
    DOM.printKpis.semVigencia.textContent = String(totals.semVigencia);
    DOM.printKpis.pendencias.textContent = String(totals.pendencias);
  }

  function syncPrintContext(records) {
    if (DOM.printFilters) {
      DOM.printFilters.textContent = "Filtros: " + getFilterSummary();
    }

    if (DOM.printTotalRecords) {
      DOM.printTotalRecords.textContent = String(records.length);
    }

    if (DOM.printUrl) {
      DOM.printUrl.textContent = window.location.href;
    }

    if (DOM.printExportedAt) {
      DOM.printExportedAt.textContent = "Impresso em " + formatCompactDateTime(new Date());
    }
  }

  function getFilterSummary() {
    const parts = [];

    if (state.filters.tipo) {
      parts.push("Tipo=" + titleCase(state.filters.tipo));
    }
    if (state.filters.ano) {
      parts.push("Ano=" + state.filters.ano);
    }
    if (state.filters.gestor) {
      parts.push("Gestor=" + titleCase(state.filters.gestor));
    }
    if (state.filters.situacao) {
      parts.push("Situação=" + getSituationFilterLabel(state.filters.situacao));
    }
    if (state.filters.busca) {
      parts.push("Busca=" + state.filters.busca);
    }
    if (state.filters.pendencias) {
      parts.push("Pendências=Sim");
    }

    return parts.length ? parts.join(", ") : "Sem filtros ativos";
  }

  function handleBeforePrint() {
    state.isPrinting = true;
    if (state.modalController && DOM.modal && DOM.modal.open) {
      state.modalController.close({
        syncUrl: false,
        immediate: true
      });
    }
    if (DOM.encerradosSection && !DOM.encerradosSection.hidden) {
      state.prePrintEndedOpen = DOM.encerradosSection.open;
      DOM.encerradosSection.open = true;
    }
    render({
      syncUrl: false,
      replaceUrl: true,
      syncModalFromUrl: false,
      printMode: true
    });
  }

  function handleAfterPrint() {
    state.isPrinting = false;
    if (DOM.encerradosSection && state.prePrintEndedOpen !== null) {
      DOM.encerradosSection.open = state.prePrintEndedOpen;
    }
    state.prePrintEndedOpen = null;
    render({
      syncUrl: false,
      replaceUrl: true,
      syncModalFromUrl: false,
      printMode: false
    });
  }

  function scrollToResults() {
    const target = DOM.filtersShell || DOM.resultsSection;
    if (!target || typeof target.scrollIntoView !== "function") {
      return;
    }

    window.requestAnimationFrame(function () {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function getMostRestrictiveFilterSuggestion() {
    const candidates = [
      { key: "tipo", label: "Tipo", active: Boolean(state.filters.tipo) },
      { key: "ano", label: "Ano", active: Boolean(state.filters.ano) },
      { key: "gestor", label: "Gestor", active: Boolean(state.filters.gestor) },
      { key: "situacao", label: "Situação", active: Boolean(state.filters.situacao) },
      { key: "busca", label: "Busca livre", active: Boolean(state.filters.busca) },
      { key: "pendencias", label: "Pendências", active: Boolean(state.filters.pendencias) }
    ].filter(function (candidate) {
      return candidate.active;
    });

    if (!candidates.length) {
      return null;
    }

    const currentCount = getFilteredRecords({
      filters: state.filters,
      skipSort: true
    }).length;

    const evaluated = candidates.map(function (candidate) {
      const nextFilters = Object.assign({}, state.filters);
      nextFilters[candidate.key] = "";
      const nextCount = getFilteredRecords({
        filters: nextFilters,
        skipSort: true
      }).length;

      return {
        key: candidate.key,
        label: candidate.label,
        gain: nextCount - currentCount,
        count: nextCount
      };
    }).sort(function (a, b) {
      if (b.gain !== a.gain) {
        return b.gain - a.gain;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return compareText(a.label, b.label);
    });

    return evaluated[0] || null;
  }

  function findRecordByContractParam(value) {
    if (!state.dataset || !value) {
      return null;
    }

    const raw = String(value).trim();
    const normalized = slugify(raw);

    for (const record of state.dataset.contratos) {
      if (String(record.contrato || "").trim() === raw) {
        return record;
      }
    }

    for (const record of state.dataset.contratos) {
      if (record.contrato && slugify(record.contrato) === normalized) {
        return record;
      }
    }

    if (/^\d+$/.test(raw)) {
      return state.dataset.indices.byId.get(Number(raw)) || null;
    }

    return null;
  }

  function syncModalFromUrl() {
    if (!state.modalController) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    state.modalController.syncFromParam(params.get("contrato") || "", {
      syncUrl: false,
      replaceUrl: true
    });
  }

  function buildUrl(contractRecord) {
    const params = new URLSearchParams();

    if (state.filters.tipo) {
      params.set("tipo", slugify(state.filters.tipo));
    }
    if (state.filters.ano) {
      params.set("ano", String(state.filters.ano));
    }
    if (state.filters.gestor) {
      params.set("gestor", slugify(state.filters.gestor));
    }
    if (state.filters.situacao) {
      const option = SITUATION_OPTIONS.find(function (item) {
        return item.value === state.filters.situacao;
      });
      params.set("situacao", option ? option.param : state.filters.situacao);
    }
    if (state.filters.busca) {
      params.set("q", sanitizeSearchInput(state.filters.busca));
    }
    if (state.filters.ordenacao && state.filters.ordenacao !== DEFAULT_FILTERS.ordenacao) {
      const option = ORDER_OPTIONS.find(function (item) {
        return item.value === state.filters.ordenacao;
      });
      params.set("ordenacao", option ? option.param : state.filters.ordenacao);
    }
    if (state.filters.pendencias) {
      params.set("pendencias", "sim");
    }
    if (contractRecord) {
      params.set("contrato", contractRecord.contrato || String(contractRecord.id));
    }

    const query = params.toString();
    return window.location.pathname + (query ? "?" + query : "");
  }

  function syncUrl(options) {
    const settings = Object.assign(
      {
        replaceUrl: false,
        contractRecord: null
      },
      options || {}
    );

    const url = buildUrl(settings.contractRecord);
    const method = settings.replaceUrl ? "replaceState" : "pushState";
    window.history[method]({ filters: state.filters }, "", url);
    if (DOM.printUrl) {
      DOM.printUrl.textContent = window.location.href;
    }
  }

  function truncateText(value, limit) {
    const text = String(value || "").trim();
    return text;
  }

  function sanitizeSearchInput(value) {
    return String(value || "")
      .normalize("NFC")
      .replace(/[<>]/g, " ")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  function formatHumanDateTime(value) {
    return String(value || "Sem data").replace(",", " às");
  }

  function formatCompactDateTime(value) {
    return formatDateTime(value).replace(",", "");
  }

  function formatCompactCurrency(value) {
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

  function formatRelativeUpdate(value) {
    if (!value) {
      return "há instantes";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "há instantes";
    }

    const diffMs = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.round(diffMs / 60000);

    if (minutes < 1) {
      return "agora";
    }
    if (minutes < 60) {
      return "há " + minutes + "min";
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return "há " + hours + "h";
    }

    const days = Math.round(hours / 24);
    return "há " + days + "d";
  }

  function canRenderLazySection(section) {
    if (!section || !section.dataset.lazySection) {
      return true;
    }

    if (state.isPrinting || !state.lazyObserver) {
      return true;
    }

    return state.visibleSections.has(section.dataset.lazySection);
  }

  function updateUrgentAnnouncements(urgentCount) {
    const message = urgentCount > 0
      ? urgentCount + (urgentCount === 1 ? " contrato vence em até 30 dias." : " contratos vencem em até 30 dias.")
      : "Nenhum contrato vence em até 30 dias.";

    if (DOM.kpiUrgentAlert) {
      DOM.kpiUrgentAlert.textContent = message;
    }

    if (DOM.urgentAlerts && state.lastUrgentAnnouncement !== message) {
      DOM.urgentAlerts.textContent = message;
      state.lastUrgentAnnouncement = message;
    }
  }

  function setChartSummaryLegacy(container, summary) {
    if (!container) {
      return;
    }

    container.setAttribute("role", "group");
    container.setAttribute("aria-label", summary || "GrÃ¡fico do painel");
  }

  function buildTimelineChartSummaryLegacy(records, urgent) {
    if (!records.length) {
      return "Timeline de vencimentos vazia. Nenhum contrato corresponde aos filtros selecionados.";
    }

    if (!urgent.length) {
      return "Timeline de vencimentos vazia. Nenhum contrato vence nos prÃ³ximos 90 dias dentro do recorte atual.";
    }

    const immediateCount = urgent.filter(function (record) {
      return record.dias_para_vencimento <= 30;
    }).length;
    const watchCount = urgent.length - immediateCount;
    const highlights = urgent.slice(0, 3).map(function (record) {
      return getDisplayText(record.contrato || record.id) + " em " + record.dias_para_vencimento + " dias";
    }).join("; ");

    return "Timeline de vencimentos com " + urgent.length + " contratos nos prÃ³ximos 90 dias. "
      + immediateCount + " vencem em atÃ© 30 dias e " + watchCount + " entre 31 e 90 dias. "
      + "Mais prÃ³ximos: " + highlights + ".";
  }

  function buildDistributionChartSummaryLegacy(sortedTotals, totalRecords) {
    if (!totalRecords) {
      return "GrÃ¡fico de distribuiÃ§Ã£o por tipo vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const highlights = (sortedTotals || []).slice(0, 3).map(function (entry) {
      return entry[1].quantidade + " por " + titleCase(entry[0]);
    }).join(", ");

    return "GrÃ¡fico de distribuiÃ§Ã£o por tipo com " + totalRecords + " contratos. "
      + (highlights ? "Destaques: " + highlights + "." : "");
  }

  function buildGaugeChartSummaryLegacy(completeCount, totalRecords) {
    if (!totalRecords) {
      return "Indicador de completude vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const percent = Math.round((completeCount / totalRecords) * 100);
    return "Indicador de completude cadastral em " + percent + " por cento. "
      + completeCount + " de " + totalRecords + " contratos estÃ£o sem pendÃªncias.";
  }

  function buildYearChartSummaryLegacy(records) {
    if (!records.length) {
      return "GrÃ¡fico de contratos por ano vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const totalsByYear = new Map();
    records.forEach(function (record) {
      const year = record.ano || "Sem ano";
      totalsByYear.set(year, (totalsByYear.get(year) || 0) + 1);
    });

    const highlights = Array.from(totalsByYear.entries())
      .sort(function (a, b) {
        return Number(b[0]) - Number(a[0]) || compareText(String(a[0]), String(b[0]));
      })
      .slice(0, 4)
      .map(function (entry) {
        return entry[0] + ": " + entry[1] + " contrato(s)";
      })
      .join("; ");

    return "GrÃ¡fico de contratos por ano. " + highlights + ".";
  }

  function setChartSummary(container, summary) {
    if (!container) {
      return;
    }

    container.setAttribute("role", "group");
    container.setAttribute("aria-label", summary || "Grafico do painel");
  }

  function buildTimelineChartSummary(records, urgent) {
    if (!records.length) {
      return "Timeline de vencimentos vazia. Nenhum contrato corresponde aos filtros selecionados.";
    }

    if (!urgent.length) {
      return "Timeline de vencimentos vazia. Nenhum contrato vence nos proximos 90 dias dentro do recorte atual.";
    }

    const immediateCount = urgent.filter(function (record) {
      return record.dias_para_vencimento <= 30;
    }).length;
    const watchCount = urgent.length - immediateCount;
    const highlights = urgent.slice(0, 3).map(function (record) {
      return getDisplayText(record.contrato || record.id) + " em " + record.dias_para_vencimento + " dias";
    }).join("; ");

    return "Timeline de vencimentos com " + urgent.length + " contratos nos proximos 90 dias. "
      + immediateCount + " vencem em ate 30 dias e " + watchCount + " entre 31 e 90 dias. "
      + "Mais proximos: " + highlights + ".";
  }

  function buildDistributionChartSummary(sortedTotals, totalRecords) {
    if (!totalRecords) {
      return "Grafico de distribuicao por tipo vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const highlights = (sortedTotals || []).slice(0, 3).map(function (entry) {
      return entry[1].quantidade + " por " + titleCase(entry[0]);
    }).join(", ");

    return "Grafico de distribuicao por tipo com " + totalRecords + " contratos. "
      + (highlights ? "Destaques: " + highlights + "." : "");
  }

  function buildGaugeChartSummary(completeCount, totalRecords) {
    if (!totalRecords) {
      return "Indicador de completude vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const percent = Math.round((completeCount / totalRecords) * 100);
    return "Indicador de completude cadastral em " + percent + " por cento. "
      + completeCount + " de " + totalRecords + " contratos estao sem pendencias.";
  }

  function buildYearChartSummary(records) {
    if (!records.length) {
      return "Grafico de contratos por ano vazio. Nenhum contrato corresponde aos filtros selecionados.";
    }

    const totalsByYear = new Map();
    records.forEach(function (record) {
      const year = record.ano || "Sem ano";
      totalsByYear.set(year, (totalsByYear.get(year) || 0) + 1);
    });

    const highlights = Array.from(totalsByYear.entries())
      .sort(function (a, b) {
        return Number(b[0]) - Number(a[0]) || compareText(String(a[0]), String(b[0]));
      })
      .slice(0, 4)
      .map(function (entry) {
        return entry[0] + ": " + entry[1] + " contrato(s)";
      })
      .join("; ");

    return "Grafico de contratos por ano. " + highlights + ".";
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

  function coalesceNumber(value, fallback) {
    return value == null ? fallback : value;
  }

  function getDisplayText(value) {
    const text = String(value || "").trim();
    return text || "Não informado";
  }

  function readResultsViewMode() {
    try {
      const value = window.localStorage.getItem(RESULTS_VIEW_STORAGE_KEY);
      return value === "table" ? "table" : "cards";
    } catch (error) {
      return "cards";
    }
  }

  function writeResultsViewMode(value) {
    try {
      window.localStorage.setItem(RESULTS_VIEW_STORAGE_KEY, value === "table" ? "table" : "cards");
    } catch (error) {
      return;
    }
  }
})();
