class LanguageManager {
  constructor() {
    this.selector = document.querySelector(".header__language-selector");
    this.cache = new Map();
    this.request = 0;
    this.current = "en";
    // Capture the readable HTML as the offline fallback and source language.
    this.fallback = {};
    document.querySelectorAll("[data-translate]").forEach((element) => {
      this.fallback[element.dataset.translate] = element.textContent.trim();
    });
    document.querySelectorAll("[data-translate-aria]").forEach((element) => {
      this.fallback[element.dataset.translateAria] =
        element.getAttribute("aria-label");
    });
    let language = "en";
    try {
      language = localStorage.getItem("language") || navigator.language;
    } catch {
      /* Storage is optional. */
    }
    this.selector.addEventListener("change", () =>
      this.translate(this.selector.value),
    );
    this.translate(language);
  }

  async load(language) {
    if (!this.cache.has(language)) {
      const response = await fetch(
        new URL(
          `../locales/${language}.json`,
          document.querySelector('script[src$="language-manager.js"]').src,
        ),
      );
      if (!response.ok) throw new Error("Language unavailable");
      const dictionary = await response.json();
      if (
        !dictionary ||
        typeof dictionary !== "object" ||
        Array.isArray(dictionary)
      )
        throw new Error("Invalid language data");
      this.cache.set(language, dictionary);
    }
    return this.cache.get(language);
  }

  async translate(language) {
    const selected =
      typeof language === "string" && language.toLowerCase().startsWith("es")
        ? "es"
        : "en";
    const request = ++this.request;
    let dictionary;
    try {
      dictionary = await this.load(selected);
    } catch {
      // Keep the previous readable language and allow a later retry.
      if (request === this.request) this.selector.value = this.current;
      return;
    }
    if (request !== this.request) return;
    const textFor = (key) =>
      typeof dictionary[key] === "string" && dictionary[key]
        ? dictionary[key]
        : this.fallback[key];
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const text = textFor(element.dataset.translate);
      if (text) element.textContent = text;
    });
    document.querySelectorAll("[data-translate-aria]").forEach((element) => {
      const text = textFor(element.dataset.translateAria);
      if (text) element.setAttribute("aria-label", text);
    });
    this.current = selected;
    this.selector.value = selected;
    document.documentElement.lang = selected;
    try {
      localStorage.setItem("language", selected);
    } catch {
      /* Storage is optional. */
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("js");
  new LanguageManager();
  const menu = document.querySelector(".header__menu");
  const navigation = document.querySelector(".header__navigation");
  const closeMenu = () => {
    menu.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".header")) closeMenu();
  });
  window
    .matchMedia("(min-width: 1001px)")
    .addEventListener("change", closeMenu);
});
