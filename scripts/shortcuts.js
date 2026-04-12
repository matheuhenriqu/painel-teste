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
    scrollFrame: 0
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
          behavior: "smooth"
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
