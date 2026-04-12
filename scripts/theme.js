const DEFAULT_STORAGE_KEY = "iguape-painel-theme";

export function createThemeController(options) {
  const config = Object.assign(
    {
      root: document.documentElement,
      button: null,
      storageKey: DEFAULT_STORAGE_KEY
    },
    options || {}
  );

  const state = {
    userPreference: readStorage(config.storageKey),
    transitionTimer: 0
  };

  bindEvents();
  apply(resolveInitialTheme(), false, false);

  return {
    getTheme: function () {
      return config.root ? config.root.dataset.theme || "light" : "light";
    },
    setTheme: function (theme, persist, animate) {
      apply(theme, persist !== false, animate !== false);
    },
    toggle: function () {
      apply(getCurrentTheme() === "dark" ? "light" : "dark", true, true);
    }
  };

  function bindEvents() {
    if (config.button) {
      config.button.addEventListener("click", function () {
        apply(getCurrentTheme() === "dark" ? "light" : "dark", true, true);
      });
    }

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handleSystemThemeChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
  }

  function handleSystemThemeChange(event) {
    if (state.userPreference) {
      return;
    }
    apply(event.matches ? "dark" : "light", false, true);
  }

  function resolveInitialTheme() {
    if (state.userPreference) {
      return state.userPreference;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  }

  function getCurrentTheme() {
    return config.root && config.root.dataset.theme === "dark" ? "dark" : "light";
  }

  function apply(theme, persist, animate) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    if (animate && config.root) {
      config.root.classList.add("is-theme-transition");
      window.clearTimeout(state.transitionTimer);
      state.transitionTimer = window.setTimeout(function () {
        if (config.root) {
          config.root.classList.remove("is-theme-transition");
        }
      }, 360);
    }
    if (config.root) {
      config.root.dataset.theme = nextTheme;
    }

    if (config.button) {
      config.button.setAttribute("aria-pressed", String(nextTheme === "dark"));
      const moonIcon = config.button.querySelector("[data-theme-icon='moon']");
      const sunIcon = config.button.querySelector("[data-theme-icon='sun']");
      const text = config.button.querySelector(".toolbar-button__text--short");
      if (moonIcon) {
        moonIcon.classList.toggle("is-hidden", nextTheme === "dark");
      }
      if (sunIcon) {
        sunIcon.classList.toggle("is-hidden", nextTheme !== "dark");
      }
      if (text) {
        text.textContent = nextTheme === "dark" ? "Light Mode" : "Dark Mode";
      }
      config.button.setAttribute(
        "aria-label",
        nextTheme === "dark" ? "Alternar para modo claro" : "Alternar para modo escuro"
      );
    }

    if (persist) {
      state.userPreference = nextTheme;
      writeStorage(config.storageKey, nextTheme);
    }
  }
}

function readStorage(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value === "dark" || value === "light" ? value : "";
  } catch (error) {
    return "";
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}
