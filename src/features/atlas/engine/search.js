import { specimens as allSpecimens } from "../../../content/specimens.js";
import { localizeField } from "../../../i18n/index.js";

export function createSearch({
  heroEl,
  volume,
  getLocale,
  getStrings,
  onSelectLocal,
  onNavigate,
}) {
  const wrap = heroEl.querySelector(".search-wrap");
  const input = heroEl.querySelector("#atlasSearch");
  const toggleBtn = heroEl.querySelector(".search-toggle-btn");
  const dropdown = heroEl.querySelector("#searchResults");

  let results = [];
  let activeIndex = -1;

  const LOCALES = ["en", "mn"];

  function matchesSpecimen(spec, query) {
    const q = query.toLowerCase();
    if (spec.latin.toLowerCase().includes(q)) return true;
    return LOCALES.some((loc) => {
      const t = (v) => localizeField(v, loc).toLowerCase();
      if (t(spec.name).includes(q)) return true;
      if (t(spec.family).includes(q)) return true;
      if (t(spec.habitat).includes(q)) return true;
      if (spec.tags.some((tag) => t(tag).includes(q))) return true;
      return false;
    });
  }

  function closeDropdown() {
    if (dropdown) {
      dropdown.hidden = true;
      dropdown.replaceChildren();
    }
    results = [];
    activeIndex = -1;
  }

  function closePhoneSearch() {
    if (wrap) wrap.dataset.open = "false";
    closeDropdown();
  }

  function pickResult(spec) {
    if (!spec) return;
    if (input) input.value = "";
    closePhoneSearch();
    if (spec.volume === volume) {
      onSelectLocal(spec.id);
    } else {
      const targetPath = spec.volume === "birds" ? "/" : "/myths";
      onNavigate(`${targetPath}?specimen=${spec.id}`);
    }
  }

  function renderResults() {
    if (!dropdown || !input) return;
    const q = input.value.trim();
    if (!q) {
      closeDropdown();
      return;
    }

    const locale = getLocale();
    const strings = getStrings();
    results = allSpecimens.filter((s) => matchesSpecimen(s, q)).slice(0, 4);
    activeIndex = results.length > 0 ? 0 : -1;

    dropdown.replaceChildren();
    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = strings.search.empty;
      dropdown.appendChild(empty);
      dropdown.hidden = false;
      return;
    }

    results.forEach((spec, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "search-item";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", idx === activeIndex ? "true" : "false");

      const main = document.createElement("span");
      main.className = "search-item-main";
      const strong = document.createElement("strong");
      strong.style.fontWeight = "600";
      strong.textContent = localizeField(spec.name, locale);
      const em = document.createElement("em");
      em.textContent = spec.latin;
      main.appendChild(strong);
      main.appendChild(em);

      const vol = document.createElement("span");
      vol.className = "search-item-vol";
      vol.textContent = strings.volume.vol[spec.volume];

      btn.appendChild(main);
      btn.appendChild(vol);
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        pickResult(spec);
      });
      dropdown.appendChild(btn);
    });

    dropdown.hidden = false;
  }

  function updateHighlight() {
    if (!dropdown) return;
    const items = dropdown.querySelectorAll(".search-item");
    items.forEach((el, idx) => {
      el.setAttribute("aria-selected", idx === activeIndex ? "true" : "false");
    });
  }

  const onInput = () => renderResults();
  const onFocus = () => renderResults();

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (input) input.value = "";
      closePhoneSearch();
      input?.blur();
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % results.length;
      updateHighlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + results.length) % results.length;
      updateHighlight();
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickResult(results[activeIndex] || results[0]);
    }
  };

  const onDocPointerDown = (e) => {
    if (wrap && !wrap.contains(e.target)) {
      closePhoneSearch();
    }
  };

  const onToggleClick = () => {
    if (!wrap) return;
    wrap.dataset.open = "true";
    requestAnimationFrame(() => input?.focus());
  };

  input?.addEventListener("input", onInput);
  input?.addEventListener("focus", onFocus);
  input?.addEventListener("keydown", onKeyDown);
  toggleBtn?.addEventListener("click", onToggleClick);
  document.addEventListener("pointerdown", onDocPointerDown);

  return {
    refresh() {
      if (input && input.value.trim()) renderResults();
    },
    destroy() {
      input?.removeEventListener("input", onInput);
      input?.removeEventListener("focus", onFocus);
      input?.removeEventListener("keydown", onKeyDown);
      toggleBtn?.removeEventListener("click", onToggleClick);
      document.removeEventListener("pointerdown", onDocPointerDown);
    },
  };
}
