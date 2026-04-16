export function createShortcutsController(options) {
  const config = Object.assign(
    {
      searchInput: null,
      helpTrigger: null,
      helpDialog: null,
      helpCloseButton: null,
      scrollTopButton: null,
      isModalOpen: function () {
        return false;
      },
      closeModal: function () {},
      clearSearch: function () {},
      exportCsv: function () {}
    },
    options || {}
  );

  const state = {
    scrollFrame: 0,
    focusBeforeHelp: null
  };

  bindEvents();
  updateScrollTopVisibility();

  return {
    openHelp: openHelp,
    closeHelp: closeHelp
  };

  function bindEvents() {
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("scroll", requestScrollVisibilityUpdate, { passive: true });

    if (config.scrollTopButton) {
      config.scrollTopButton.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion() ? "auto" : "smooth"
        });
      });
    }

    if (config.helpTrigger) {
      config.helpTrigger.addEventListener("click", function () {
        if (config.helpDialog && config.helpDialog.open) {
          closeHelp();
        } else {
          openHelp();
        }
      });
    }

    if (config.helpCloseButton) {
      config.helpCloseButton.addEventListener("click", function () {
        closeHelp();
      });
    }

    if (config.helpDialog) {
      config.helpDialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeHelp();
      });

      config.helpDialog.addEventListener("keydown", handleHelpDialogKeydown);

      config.helpDialog.addEventListener("click", function (event) {
        const rect = config.helpDialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        ) {
          closeHelp();
        }
      });
    }
  }

  function handleKeydown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;
    const helpOpen = Boolean(config.helpDialog && config.helpDialog.open);

    if (key === "Escape") {
      if (helpOpen) {
        event.preventDefault();
        closeHelp();
        return;
      }

      if (config.isModalOpen()) {
        event.preventDefault();
        config.closeModal();
        return;
      }

      if (config.searchInput && config.searchInput.value) {
        event.preventDefault();
        config.clearSearch();
      }
      return;
    }

    if (config.isModalOpen()) {
      return;
    }

    if (isInteractiveContext(event.target)) {
      return;
    }

    if (key === "/" && !event.shiftKey) {
      event.preventDefault();
      focusSearch();
      return;
    }

    if (key === "?" || (key === "/" && event.shiftKey)) {
      event.preventDefault();
      if (helpOpen) {
        closeHelp();
      } else {
        openHelp();
      }
      return;
    }

    if ((key === "e" || key === "E") && !config.isModalOpen()) {
      event.preventDefault();
      config.exportCsv();
    }
  }

  function focusSearch() {
    if (!config.searchInput) {
      return;
    }

    config.searchInput.focus();
    config.searchInput.select();
  }

  function openHelp() {
    if (!config.helpDialog) {
      return;
    }

    state.focusBeforeHelp = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : config.helpTrigger;

    if (typeof config.helpDialog.showModal === "function" && !config.helpDialog.open) {
      config.helpDialog.showModal();
    } else {
      config.helpDialog.setAttribute("open", "open");
    }

    if (config.helpCloseButton) {
      window.requestAnimationFrame(function () {
        config.helpCloseButton.focus();
      });
    }
  }

  function closeHelp() {
    if (!config.helpDialog) {
      return;
    }

    if (typeof config.helpDialog.close === "function" && config.helpDialog.open) {
      config.helpDialog.close();
    } else {
      config.helpDialog.removeAttribute("open");
    }

    if (state.focusBeforeHelp && typeof state.focusBeforeHelp.focus === "function") {
      window.requestAnimationFrame(function () {
        state.focusBeforeHelp.focus();
      });
    }
  }

  function updateScrollTopVisibility() {
    if (!config.scrollTopButton) {
      return;
    }

    config.scrollTopButton.classList.toggle("is-visible", window.scrollY > 400);
  }

  function requestScrollVisibilityUpdate() {
    if (state.scrollFrame) {
      return;
    }

    state.scrollFrame = window.requestAnimationFrame(function () {
      state.scrollFrame = 0;
      updateScrollTopVisibility();
    });
  }
}

function handleHelpDialogKeydown(event) {
  const dialog = event.currentTarget;
  if (!(dialog instanceof HTMLElement) || event.key !== "Tab") {
    return;
  }

  const focusables = getFocusableElements(dialog);
  if (!focusables.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const activeElement = document.activeElement;

  if (!dialog.contains(activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusableElements(root) {
  if (!root) {
    return [];
  }

  return Array.from(
    root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(function (element) {
    return element.offsetParent !== null || element === document.activeElement;
  });
}

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isInteractiveContext(target) {
  const element = target instanceof Element ? target : null;
  if (!element) {
    return false;
  }

  const tagName = element.tagName;
  if (element.isContentEditable) {
    return true;
  }

  return tagName === "INPUT" ||
    tagName === "SELECT" ||
    tagName === "TEXTAREA";
}
