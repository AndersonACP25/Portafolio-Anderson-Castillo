// Enhance the native select without removing its no-JavaScript fallback.
class LanguagePicker {
  constructor(select) {
    this.select = select;
    this.root = select.closest(".language-picker");
    this.trigger = this.root.querySelector(".language-picker__trigger");
    this.list = this.root.querySelector(".language-picker__options");
    this.options = [...this.list.querySelectorAll('[role="option"]')];
    this.status = this.root.querySelector('[role="status"]');
    this.sync();
    this.trigger.hidden = false;
    select.hidden = true;
    this.trigger.addEventListener("click", () => {
      if (this.list.hidden) this.open();
      else this.close();
    });
    this.trigger.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        this.open();
      }
    });
    this.list.addEventListener("click", (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) this.choose(option);
    });
    this.list.addEventListener("keydown", (event) => {
      const index = this.options.indexOf(document.activeElement);
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % this.options.length;
      if (event.key === "ArrowUp") next = (index - 1 + this.options.length) % this.options.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = this.options.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        this.options[next].focus();
      }
      if (event.key === "Tab") {
        // Let the browser move focus before hiding the focused option.
        setTimeout(() => this.close(false), 0);
      }
      if (event.key.length === 1 && /[a-záéíóúñ]/i.test(event.key)) {
        const now = Date.now();
        this.search = now - (this.lastSearch || 0) < 700 ? this.search + event.key : event.key;
        this.lastSearch = now;
        const match = this.options.find((option) => option.children[1].textContent.toLowerCase().startsWith(this.search.toLowerCase()));
        if (match) {
          event.preventDefault();
          match.focus();
        }
      }
    });
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.list.hidden) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    });
    this.root.addEventListener("focusout", (event) => {
      if (!this.root.contains(event.relatedTarget)) this.close(false);
    });
    document.addEventListener("pointerdown", (event) => {
      if (!this.root.contains(event.target)) this.close(false);
    });
  }

  open() {
    this.list.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    this.options.find((option) => option.dataset.value === this.select.value).focus();
  }

  close(restoreFocus = true) {
    const wasOpen = !this.list.hidden;
    this.list.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    if (wasOpen && restoreFocus) this.trigger.focus();
  }

  choose(option) {
    this.select.value = option.dataset.value;
    this.close();
    this.select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  sync() {
    const selected = this.select.selectedOptions[0];
    this.root.querySelector(".language-picker__value").textContent = selected.textContent;
    this.trigger.setAttribute("aria-label", `${this.select.getAttribute("aria-label")}: ${selected.textContent}`);
    this.options.forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.value === this.select.value));
    });
  }
}

class LanguageManager {
  constructor() {
    this.selector = document.querySelector(".header__language-selector");
    this.picker = new LanguagePicker(this.selector);
    this.cache = new Map();
    this.request = 0;
    this.current = document.documentElement.lang === "es" ? "es" : "en";
    // Capture the readable HTML as the offline fallback and source language.
    this.fallback = {};
    document.querySelectorAll("[data-translate]").forEach((element) => {
      this.fallback[element.dataset.translate] = element.textContent.trim();
    });
    document.querySelectorAll("[data-translate-aria]").forEach((element) => {
      this.fallback[element.dataset.translateAria] =
        element.getAttribute("aria-label");
    });
    // Each crawlable URL owns its language; stored preferences never override it.
    const language = this.current;
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
    this.picker.status.textContent = "";
    this.picker.root.setAttribute("aria-busy", "true");
    try {
      dictionary = await this.load(selected);
    } catch {
      // Keep the previous readable language and allow a later retry.
      if (request === this.request) {
        this.selector.value = this.current;
        this.picker.sync();
        this.picker.root.setAttribute("aria-busy", "false");
        this.picker.status.textContent = this.current === "es"
          ? "No se pudo cambiar el idioma. Inténtalo de nuevo."
          : "Could not change language. Please try again.";
      }
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
    this.picker.sync();
    this.picker.root.setAttribute("aria-busy", "false");
    document.documentElement.lang = selected;
    const alternate = document.querySelector(`link[hreflang="${selected}"]`);
    const canonical = alternate.href;
    document.querySelector('link[rel="canonical"]').href = canonical;
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ]) {
      document.querySelector(selector).content = dictionary.seo_description;
    }
    document.querySelector('meta[property="og:url"]').content = canonical;
    document.querySelector('meta[property="og:locale"]').content =
      selected === "es" ? "es_DO" : "en_US";
    document.querySelector('meta[property="og:locale:alternate"]').content =
      selected === "es" ? "en_US" : "es_DO";
    const schema = document.querySelector("#profile-schema");
    const profile = JSON.parse(schema.textContent);
    profile.url = canonical;
    profile.inLanguage = selected;
    profile.mainEntity.description = dictionary.seo_description;
    schema.textContent = JSON.stringify(profile);
    const page = new URL(
      selected === "es" ? "../es.html" : "../",
      document.querySelector('script[src$="language-manager.js"]').src,
    );
    // Preserve anchors while keeping the selected language linkable and reloadable.
    history.replaceState(null, "", page.pathname + location.hash);

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

// Reveal nested evidence when following or loading a link to a case study.
// Native details remain usable when JavaScript is unavailable.
function revealLinkedContent() {
  let id;
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  let current = target;
  let revealed = false;
  while (current) {
    if (current.tagName === "DETAILS" && !current.open) {
      current.open = true;
      revealed = true;
    }
    current = current.parentElement;
  }
  if (revealed) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}
window.addEventListener("hashchange", revealLinkedContent);
document.addEventListener("DOMContentLoaded", revealLinkedContent);
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (link) requestAnimationFrame(revealLinkedContent);
});
