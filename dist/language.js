(() => {
  const toggle = document.querySelector("[data-language-toggle]");
  const menu = document.querySelector("[data-language-menu]");
  const scrim = document.querySelector("[data-language-scrim]");
  const current = document.querySelector("[data-language-current]");
  const choices = Array.from(document.querySelectorAll("[data-language]"));

  if (!toggle || !menu || !scrim || !current || !choices.length) return;

  const languageNames = {
    "zh-CN": "中文",
    en: "English",
    de: "Deutsch",
    ru: "Русский",
    es: "Español",
    th: "ไทย",
    tr: "Türkçe",
  };
  const currentLabels = {
    "zh-CN": "语言 · 中文",
    en: "Language · EN",
    de: "Sprache · DE",
    ru: "Язык · RU",
    es: "Idioma · ES",
    th: "ภาษา · TH",
    tr: "Dil · TR",
  };

  const storageKey = "jiayi-language";
  let isOpen = false;
  const sourceNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, [data-language-menu], [data-language-toggle]")) return NodeFilter.FILTER_REJECT;
      return /[\u3400-\u9fff]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    sourceNodes.push({ node, value: node.nodeValue });
  }

  const setOpen = (next, restoreFocus = false) => {
    isOpen = next;
    document.body.classList.toggle("language-open", next);
    toggle.setAttribute("aria-expanded", String(next));
    toggle.setAttribute("aria-label", next ? "关闭语言选择菜单" : "打开语言选择菜单");
    menu.setAttribute("aria-hidden", String(!next));
    if ("inert" in menu) menu.inert = !next;

    if (next) {
      window.setTimeout(() => {
        const active = menu.querySelector("[data-language].is-active") || choices[0];
        active.focus({ preventScroll: true });
      }, 650);
    } else if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  const applyLanguage = (code) => {
    const selected = languageNames[code] ? code : "zh-CN";
    const dictionary = window.JIAYI_TRANSLATIONS?.[selected] || {};
    document.documentElement.lang = selected;
    current.textContent = currentLabels[selected];
    sourceNodes.forEach(({ node, value }) => {
      const source = value.trim();
      let translated = selected === "zh-CN" ? source : dictionary[source];
      if (!translated) {
        translated = source;
        Object.entries(dictionary).forEach(([fragment, replacement]) => {
          if (translated.includes(fragment)) translated = translated.split(fragment).join(replacement);
        });
      }
      node.nodeValue = value.replace(source, translated);
    });
    document.title = selected === "zh-CN" ? "JIAYI POWER · 园林锂电工具" : dictionary["JIAYI POWER · 园林锂电工具"] || "JIAYI POWER";
    choices.forEach((choice) => {
      const active = choice.dataset.language === selected;
      choice.classList.toggle("is-active", active);
      choice.setAttribute("aria-current", active ? "true" : "false");
    });

    try {
      localStorage.setItem(storageKey, selected);
    } catch (_) {
      // Storage may be disabled; the current visit still works.
    }

    document.dispatchEvent(new CustomEvent("jiayi:languagechange", { detail: { language: selected } }));
  };

  toggle.addEventListener("click", () => setOpen(!isOpen));
  scrim.addEventListener("click", () => setOpen(false, true));

  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      applyLanguage(choice.dataset.language);
      setOpen(false, true);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) setOpen(false, true);
  });

  let initial = "zh-CN";
  try {
    initial = localStorage.getItem(storageKey) || "zh-CN";
  } catch (_) {
    initial = "zh-CN";
  }
  applyLanguage(initial);
  setOpen(false);
})();
