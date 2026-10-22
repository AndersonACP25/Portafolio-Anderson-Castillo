class LanguageManager {
  constructor() {
    this.selector = document.querySelector(".header__language-selector");
    let language = "en";
    try {
      language = localStorage.getItem("language") || "en";
    } catch {
      /* Storage is optional. */
    }
    this.translate(language);
    this.selector.addEventListener("change", () => {
      this.translate(this.selector.value);
      try {
        localStorage.setItem("language", this.selector.value);
      } catch {
        /* Keep translation usable. */
      }
    });
  }
  translate(language) {
    const selected = Object.hasOwn(translations, language) ? language : "en";
    const dictionary = translations[selected];
    this.selector.value = selected;
    document.documentElement.lang = selected;
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const text = dictionary[element.dataset.translate];
      if (text) element.textContent = text;
    });
    document.querySelectorAll("[data-translate-aria]").forEach((element) => {
      const text = dictionary[element.dataset.translateAria];
      if (text) element.setAttribute("aria-label", text);
    });
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
