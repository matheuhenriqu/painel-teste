const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function createLoadingController(options) {
  const config = Object.assign(
    {
      body: document.body,
      scrollProgressBar: null,
      mainResultsContainer: null,
      endedResultsContainer: null
    },
    options || {}
  );

  const state = {
    entranceTimer: 0,
    scrollFrame: 0
  };

  init();

  return {
    startInitialLoad: startInitialLoad,
    finishInitialLoad: finishInitialLoad,
    animateValue: animateValue,
    flashField: flashField,
    showSkeletons: showSkeletons,
    clearSkeletons: clearSkeletons
  };

  function init() {
    triggerEntranceAnimation();
    bindScrollProgress();
  }

  function startInitialLoad() {
    if (config.body) {
      config.body.classList.add("is-boot-loading");
    }
    showSkeletons();
  }

  function finishInitialLoad(options) {
    const settings = Object.assign(
      {
        clearTables: false
      },
      options || {}
    );

    if (config.body) {
      config.body.classList.remove("is-boot-loading");
    }

    if (settings.clearTables) {
      clearSkeletons();
      return;
    }

    [config.mainResultsContainer, config.endedResultsContainer].forEach(function (container) {
      if (container) {
        delete container.dataset.loadingSkeleton;
      }
    });
  }

  function showSkeletons() {
    showTableSkeleton(config.mainResultsContainer, 2);
    showTableSkeleton(config.endedResultsContainer, 1);
  }

  function clearSkeletons() {
    [config.mainResultsContainer, config.endedResultsContainer].forEach(function (container) {
      if (!container || container.dataset.loadingSkeleton !== "true") {
        return;
      }
      container.replaceChildren();
      delete container.dataset.loadingSkeleton;
    });
  }

  function animateValue(element, target, format) {
    if (!element) {
      return;
    }

    const targetValue = Number(target) || 0;
    const previousValue = Number(element.dataset.currentValue || 0);
    const hasAnimatedBefore = element.dataset.hasAnimated === "true";
    const hostCard = element.closest(".kpi-card");

    if (prefersReducedMotion()) {
      element.textContent = formatValue(targetValue, format);
      element.dataset.currentValue = String(targetValue);
      element.dataset.hasAnimated = "true";
      if (hostCard && hasAnimatedBefore) {
        flashCard(hostCard, targetValue > previousValue ? "up" : targetValue < previousValue ? "down" : "");
      }
      return;
    }

    const duration = 600;
    const startedAt = performance.now();

    window.requestAnimationFrame(function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = previousValue + (targetValue - previousValue) * eased;
      element.textContent = formatValue(currentValue, format);

      if (progress < 1) {
        window.requestAnimationFrame(frame);
        return;
      }

      element.textContent = formatValue(targetValue, format);
      element.dataset.currentValue = String(targetValue);
      element.dataset.hasAnimated = "true";

      if (hostCard && hasAnimatedBefore) {
        flashCard(hostCard, targetValue > previousValue ? "up" : targetValue < previousValue ? "down" : "");
      }
    });
  }

  function flashField(element) {
    const target = element && element.closest ? element.closest(".field") || element : element;
    if (!target) {
      return;
    }

    target.classList.remove("is-updated");
    void target.offsetWidth;
    target.classList.add("is-updated");
    window.setTimeout(function () {
      target.classList.remove("is-updated");
    }, 320);
  }

  function triggerEntranceAnimation() {
    if (!config.body || prefersReducedMotion()) {
      return;
    }

    config.body.classList.add("animando");
    window.clearTimeout(state.entranceTimer);
    state.entranceTimer = window.setTimeout(function () {
      config.body.classList.remove("animando");
    }, 1000);
  }

  function bindScrollProgress() {
    if (!config.scrollProgressBar) {
      return;
    }

    const requestUpdate = function () {
      if (state.scrollFrame) {
        return;
      }

      state.scrollFrame = window.requestAnimationFrame(function () {
        state.scrollFrame = 0;
        updateScrollProgress();
      });
    };

    updateScrollProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  }

  function updateScrollProgress() {
    if (!config.scrollProgressBar) {
      return;
    }

    if (window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches) {
      config.scrollProgressBar.style.transform = "scaleX(0)";
      return;
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    config.scrollProgressBar.style.transform = "scaleX(" + progress + ")";
  }
}

export function setBusyButtonState(button, busy, options) {
  if (!button) {
    return;
  }

  const settings = Object.assign(
    {
      label: "Carregando..."
    },
    options || {}
  );

  if (busy) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.getAttribute("aria-label") || "";
    }
    button.classList.add("is-busy");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.setAttribute("data-loading-label", settings.label);
    button.setAttribute("aria-label", settings.label);
    return;
  }

  button.classList.remove("is-busy");
  button.disabled = false;
  button.removeAttribute("aria-busy");
  button.removeAttribute("data-loading-label");
  if (button.dataset.originalLabel) {
    button.setAttribute("aria-label", button.dataset.originalLabel);
  }
}

function showTableSkeleton(container, groups) {
  if (!container) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const totalGroups = Math.max(1, groups || 1);

  for (let index = 0; index < totalGroups; index += 1) {
    const group = document.createElement("article");
    group.className = "contract-group table-skeleton";

    const header = document.createElement("div");
    header.className = "table-skeleton__group-header";

    const title = document.createElement("span");
    title.className = "table-skeleton__line table-skeleton__line--title";

    const meta = document.createElement("span");
    meta.className = "table-skeleton__line table-skeleton__line--meta";

    header.append(title, meta);
    group.appendChild(header);

    const table = document.createElement("div");
    table.className = "table-skeleton__table";

    for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "table-skeleton__row";

      for (let cellIndex = 0; cellIndex < 7; cellIndex += 1) {
        const cell = document.createElement("span");
        cell.className = "table-skeleton__cell table-skeleton__cell--" + (cellIndex + 1);
        row.appendChild(cell);
      }

      table.appendChild(row);
    }

    group.appendChild(table);
    fragment.appendChild(group);
  }

  container.replaceChildren(fragment);
  container.dataset.loadingSkeleton = "true";
}

function flashCard(card, direction) {
  if (!card || !direction) {
    return;
  }

  const className = direction === "up" ? "is-flash-up" : "is-flash-down";
  card.classList.remove("is-flash-up", "is-flash-down");
  void card.offsetWidth;
  card.classList.add(className);
  window.setTimeout(function () {
    card.classList.remove(className);
  }, 420);
}

function formatValue(value, format) {
  if (format === "currency") {
    return currencyFormatter.format(value);
  }

  if (format === "compact_currency") {
    return formatCompactCurrency(value);
  }

  return numberFormatter.format(Math.round(value));
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

  return currencyFormatter.format(amount);
}

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
