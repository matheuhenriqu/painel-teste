import {
  formatCurrency,
  formatDate,
  getSpecialStatusLabel,
  parseIsoDate,
  startOfToday,
  titleCase
} from "./data-loader.js";

const CLOSE_ANIMATION_MS = 220;

export function createModalController(options) {
  const config = Object.assign(
    {
      root: null,
      closeButton: null,
      closeTopButton: null,
      copyButton: null,
      feedback: null,
      title: null,
      subtitle: null,
      status: null,
      tipo: null,
      modalidade: null,
      processo: null,
      ano: null,
      empresa: null,
      objeto: null,
      valor: null,
      gestor: null,
      fiscal: null,
      dataInicio: null,
      dataVencimento: null,
      dataHoje: null,
      pendencias: null,
      observacoes: null,
      vigenciaResumo: null,
      vigenciaInicioLabel: null,
      vigenciaFimLabel: null,
      progressFill: null,
      progressToday: null,
      getRecordById: function () {
        return null;
      },
      getRecordByParam: function () {
        return null;
      },
      getShareUrl: function () {
        return window.location.href;
      },
      onStateChange: function () {}
    },
    options || {}
  );

  const state = {
    activeRecord: null,
    isClosing: false,
    focusBeforeOpen: null,
    feedbackTimer: 0,
    bodyLockStyles: null,
    scrollY: 0
  };

  bindEvents();

  return {
    openById: openById,
    openByParam: openByParam,
    close: close,
    syncFromParam: syncFromParam,
    getActiveRecord: function () {
      return state.activeRecord;
    }
  };

  function bindEvents() {
    if (!config.root) {
      return;
    }

    if (config.closeButton) {
      config.closeButton.addEventListener("click", function () {
        close();
      });
    }

    if (config.closeTopButton) {
      config.closeTopButton.addEventListener("click", function () {
        close();
      });
    }

    if (config.copyButton) {
      config.copyButton.addEventListener("click", copyLink);
    }

    config.root.addEventListener("cancel", function (event) {
      event.preventDefault();
      close();
    });

    config.root.addEventListener("keydown", handleKeydown);

    config.root.addEventListener("click", function (event) {
      if (clickedOutside(event)) {
        close();
      }
    });
  }

  function openById(contractId, options) {
    const record = config.getRecordById(Number(contractId));
    if (!record) {
      return false;
    }

    return openRecord(record, options);
  }

  function openByParam(contractParam, options) {
    const record = config.getRecordByParam(contractParam);
    if (!record) {
      return false;
    }

    return openRecord(record, options);
  }

  function syncFromParam(contractParam, options) {
    const value = String(contractParam || "").trim();

    if (!value) {
      close(Object.assign({ syncUrl: false, immediate: true }, options || {}));
      return false;
    }

    return openByParam(value, Object.assign({ syncUrl: false, replaceUrl: true }, options || {}));
  }

  function openRecord(record, options) {
    if (!config.root || !record) {
      return false;
    }

    const settings = Object.assign(
      {
        syncUrl: true,
        replaceUrl: false,
        restoreFocus: false
      },
      options || {}
    );

    window.clearTimeout(state.feedbackTimer);
    state.focusBeforeOpen = settings.restoreFocus ? state.focusBeforeOpen : document.activeElement;
    state.activeRecord = record;
    state.isClosing = false;
    config.root.classList.remove("is-closing");

    fillModal(record);
    lockPageScroll();

    if (typeof config.root.showModal === "function" && !config.root.open) {
      config.root.showModal();
    } else {
      config.root.setAttribute("open", "open");
    }

    window.requestAnimationFrame(function () {
      const focusables = getFocusableElements();
      const focusTarget = focusables[0] || config.closeTopButton || config.closeButton || config.copyButton || config.root;
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus();
      }
    });

    if (settings.syncUrl) {
      config.onStateChange({
        record: record,
        replaceUrl: settings.replaceUrl
      });
    }

    return true;
  }

  function close(options) {
    if (!config.root) {
      return;
    }

    const settings = Object.assign(
      {
        syncUrl: true,
        replaceUrl: true,
        immediate: false
      },
      options || {}
    );

    if (!config.root.open && !state.activeRecord) {
      return;
    }

    const activeRecord = state.activeRecord;
    state.activeRecord = null;

    if (settings.syncUrl) {
      config.onStateChange({
        record: null,
        previousRecord: activeRecord,
        replaceUrl: settings.replaceUrl
      });
    }

    const finish = function () {
      config.root.classList.remove("is-closing");
      state.isClosing = false;
      if (typeof config.root.close === "function" && config.root.open) {
        config.root.close();
      } else {
        config.root.removeAttribute("open");
      }
      clearFeedback();
      unlockPageScroll();

      if (state.focusBeforeOpen && typeof state.focusBeforeOpen.focus === "function") {
        state.focusBeforeOpen.focus();
      }
    };

    if (settings.immediate || !config.root.open) {
      finish();
      return;
    }

    if (state.isClosing) {
      return;
    }

    state.isClosing = true;
    config.root.classList.add("is-closing");
    window.setTimeout(finish, CLOSE_ANIMATION_MS);
  }

  function lockPageScroll() {
    if (state.bodyLockStyles) {
      return;
    }

    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    state.scrollY = scrollY;
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

  function unlockPageScroll() {
    if (!state.bodyLockStyles) {
      return;
    }

    const body = document.body;
    const scrollY = state.scrollY || 0;

    body.style.position = state.bodyLockStyles.position;
    body.style.top = state.bodyLockStyles.top;
    body.style.left = state.bodyLockStyles.left;
    body.style.right = state.bodyLockStyles.right;
    body.style.width = state.bodyLockStyles.width;
    body.style.overflow = state.bodyLockStyles.overflow;
    body.style.paddingRight = state.bodyLockStyles.paddingRight;

    state.bodyLockStyles = null;
    state.scrollY = 0;

    window.requestAnimationFrame(function () {
      window.scrollTo(0, scrollY);
    });
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables = getFocusableElements();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getFocusableElements() {
    if (!config.root) {
      return [];
    }

    return Array.from(
      config.root.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (element) {
      return element.offsetParent !== null || element === document.activeElement;
    });
  }

  function clickedOutside(event) {
    const rect = config.root.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    return !(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  }

  async function copyLink() {
    if (!state.activeRecord) {
      return;
    }

    const url = config.getShareUrl(state.activeRecord);

    try {
      await navigator.clipboard.writeText(url);
      showFeedback("Link copiado ✓");
    } catch (error) {
      showFeedback("Não foi possível copiar o link");
    }
  }

  function showFeedback(message) {
    if (!config.feedback) {
      return;
    }

    window.clearTimeout(state.feedbackTimer);
    config.feedback.textContent = message;
    state.feedbackTimer = window.setTimeout(function () {
      clearFeedback();
    }, 2000);
  }

  function clearFeedback() {
    if (config.feedback) {
      config.feedback.textContent = "";
    }
  }

  function fillModal(record) {
    const specialStatus = getSpecialStatusLabel(record.status_especial);
    const pendenciasSection = config.root ? config.root.querySelector('[data-modal-section="pendencias"]') : null;
    const vigenciaSection = config.root ? config.root.querySelector('[data-modal-section="vigencia"]') : null;

    setText(config.title, "Contrato " + (record.contrato || record.id));
    setText(
      config.subtitle,
      [titleCase(record.tipo || "Não informado"), record.modalidade || "Não informado"]
        .filter(Boolean)
        .join(" • ")
    );
    setText(config.tipo, titleCase(record.tipo || "Não informado"));
    setText(config.modalidade, record.modalidade || "Não informado");
    setText(config.processo, record.processo || "Não informado");
    setText(config.ano, record.ano || "Não informado");
    setText(config.empresa, record.empresa || "Não informado");
    setText(config.objeto, record.objeto || "Não informado");
    setText(config.valor, record.valor == null ? "—" : formatCurrency(record.valor));
    setText(config.gestor, record.gestor || "Não informado");
    setText(config.fiscal, record.fiscal || (record.campos_pendentes.includes("fiscal") ? "Não informado (pendente)" : "Não informado"));
    setText(config.dataInicio, record.data_inicio ? formatDate(record.data_inicio) : "Sem data");
    setText(
      config.dataVencimento,
      record.vencimento ? formatDate(record.vencimento) : (specialStatus || "Sem data")
    );
    setText(config.dataHoje, formatDate(startOfToday()));
    setText(
      config.observacoes,
      record.observacoes || (specialStatus ? "Status especial: " + specialStatus : "Não informado")
    );

    if (config.status) {
      config.status.className = "status-badge " + (record.situacao ? record.situacao.badgeClass : "status-badge--sem-vigencia");
      config.status.textContent = getModalBadgeLabel(record);
    }

    fillPendencias(record, pendenciasSection);
    fillProgress(record, specialStatus, vigenciaSection);
  }

  function fillPendencias(record, section) {
    if (!config.pendencias) {
      return;
    }

    config.pendencias.replaceChildren();

    if (!record.campos_pendentes.length) {
      if (section) {
        section.hidden = true;
      }
      return;
    }

    if (section) {
      section.hidden = false;
    }

    record.campos_pendentes.forEach(function (field) {
      const badge = document.createElement("span");
      badge.className = "pending-badge";
      badge.textContent = field;
      config.pendencias.appendChild(badge);
    });
  }

  function fillProgress(record, specialStatus, section) {
    const start = parseIsoDate(record.data_inicio);
    const end = parseIsoDate(record.vencimento);
    const today = startOfToday();
    const tone = getProgressTone(record);

    setText(config.vigenciaInicioLabel, "Início da vigência");
    setText(config.vigenciaFimLabel, "Fim da vigência");

    if (config.progressFill) {
      config.progressFill.className = "progress-track__fill progress-track__fill--" + tone;
    }
    if (config.progressToday) {
      config.progressToday.className = "progress-track__today progress-track__today--" + tone;
    }
    if (section) {
      section.classList.toggle("is-unavailable", !start || !end || end.getTime() <= start.getTime());
    }

    if (!start || !end || end.getTime() <= start.getTime()) {
      if (config.progressFill) {
        config.progressFill.style.width = "0%";
      }
      if (config.progressToday) {
        config.progressToday.style.left = "0%";
      }
      setText(config.vigenciaResumo, specialStatus || "⚠ Vigência não informada");
      setText(config.vigenciaInicioLabel, record.data_inicio ? "Início informado" : "Início pendente");
      setText(config.vigenciaFimLabel, record.vencimento ? "Vencimento informado" : "Vencimento pendente");
      return;
    }

    const total = end.getTime() - start.getTime();
    const elapsed = clamp(today.getTime() - start.getTime(), 0, total);
    const progress = Math.round((elapsed / total) * 100);
    const remaining = record.dias_para_vencimento;

    if (config.progressFill) {
      config.progressFill.style.width = "0%";
    }
    if (config.progressToday) {
      config.progressToday.style.left = "0%";
    }
    window.requestAnimationFrame(function () {
      if (config.progressFill) {
        config.progressFill.style.width = progress + "%";
      }
      if (config.progressToday) {
        config.progressToday.style.left = progress + "%";
      }
    });

    if (remaining == null) {
      setText(config.vigenciaResumo, "Hoje dentro do ciclo");
      return;
    }

    if (remaining < 0) {
      setText(config.vigenciaResumo, Math.abs(remaining) + " dias após o vencimento");
      return;
    }

    setText(config.vigenciaResumo, remaining + " dias restantes");
  }
}

function setText(element, value) {
  if (element) {
    element.textContent = String(value == null ? "" : value);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getModalBadgeLabel(record) {
  if (!record || !record.situacao) {
    return "Pendente";
  }

  switch (record.situacao.key) {
    case "vigente_regular":
      return "Regular";
    case "vence_30":
      return "Urgente";
    case "vence_31_90":
      return "Atenção";
    case "encerrado":
      return "Vencido";
    case "em_andamento":
      return "Em andamento";
    case "nao_assinou":
      return "Pendente";
    case "sem_vigencia":
    default:
      return "Pendente";
  }
}

function getProgressTone(record) {
  if (!record || !record.situacao) {
    return "muted";
  }

  switch (record.situacao.key) {
    case "vence_30":
      return "urgent";
    case "vence_31_90":
      return "warning";
    case "vigente_regular":
      return "regular";
    case "encerrado":
      return "expired";
    default:
      return "muted";
  }
}
