import { handleSpecimenImageError, imageFallbackUrl, imageUrl } from "../../../content/assets.js";
import { format, localizeField } from "../../../i18n/index.js";

function makeSvgIcon(id, className = "ico") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${id}`);
  svg.appendChild(use);
  return svg;
}

function pct(year) {
  return ((year + 800) / 2700) * 100;
}

export function createInfoPainter(heroEl, { onToggleCloseup, getZoomGoal }) {
  const cardEl = heroEl.querySelector(".card");
  const detailEl = heroEl.querySelector("#detail");
  const captionEl = heroEl.querySelector("#caption");
  const scaleEl = heroEl.querySelector("#scale");
  const fallbackEl = heroEl.querySelector("#fallback");
  const featImg = heroEl.querySelector("#featImg");
  const featTitle = heroEl.querySelector("#featTitle");
  const featText = heroEl.querySelector("#featText");

  let swapTimer = null;

  function renderDetailDOM(specimen, volume, strings, locale, instant) {
    const t = (val) => localizeField(val, locale);
    detailEl.replaceChildren();
    detailEl.classList.toggle("instant", Boolean(instant));

    let rowIndex = 0;
    const addRow = (el) => {
      el.style.setProperty("--i", String(rowIndex++));
      detailEl.appendChild(el);
    };

    const eyebrow = document.createElement("span");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = format(strings.detail.eyebrow, {
      family: t(specimen.family),
      no: specimen.no,
    });
    addRow(eyebrow);

    const h1 = document.createElement("h1");
    h1.appendChild(document.createTextNode(t(specimen.name)));
    const latin = document.createElement("em");
    latin.textContent = specimen.latin;
    h1.appendChild(latin);
    addRow(h1);

    const tags = document.createElement("div");
    tags.className = "tags";
    for (const tag of specimen.tags) {
      const span = document.createElement("span");
      span.textContent = t(tag);
      tags.appendChild(span);
    }
    addRow(tags);

    const lede = document.createElement("p");
    lede.className = "lede";
    lede.textContent = t(specimen.lede);
    addRow(lede);

    // Era timeline (shown on both volumes for data parity)
    const era = document.createElement("div");
    era.className = "era";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.appendChild(document.createElement("b"));
    bar.appendChild(document.createElement("b"));
    bar.appendChild(document.createElement("b"));

    const pFrom = pct(specimen.era[0]);
    const pTo = pct(specimen.era[1]);
    const marker = document.createElement("u");
    marker.style.left = `${pFrom.toFixed(2)}%`;
    marker.style.width = `${Math.max(0.6, pTo - pFrom).toFixed(2)}%`;
    marker.dataset.l = t(specimen.eraLabel);
    if (pFrom < 50) marker.classList.add("l");
    bar.appendChild(marker);
    era.appendChild(bar);

    const lab = document.createElement("div");
    lab.className = "lab";
    for (const key of ["antiquity", "medieval", "modern"]) {
      const s = document.createElement("span");
      s.textContent = strings.detail.era[key];
      lab.appendChild(s);
    }
    era.appendChild(lab);
    addRow(era);

    const h2Traits = document.createElement("h2");
    h2Traits.textContent = strings.detail.traits[volume];
    addRow(h2Traits);

    const dl = document.createElement("dl");
    dl.className = "traits";
    for (const trait of specimen.traits) {
      const row = document.createElement("div");
      row.className = "trait-row";
      row.appendChild(makeSvgIcon(trait.icon));
      const dt = document.createElement("dt");
      dt.textContent = strings.traitLabels[trait.key] || trait.key;
      const dd = document.createElement("dd");
      dd.textContent = t(trait.value);
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    }
    addRow(dl);

    const h2Habitat = document.createElement("h2");
    h2Habitat.textContent = strings.detail.habitat[volume];
    addRow(h2Habitat);

    const hab = document.createElement("div");
    hab.className = "habitat";
    hab.appendChild(makeSvgIcon("t-reed"));
    const habSpan = document.createElement("span");
    habSpan.textContent = t(specimen.habitat);
    hab.appendChild(habSpan);
    addRow(hab);

    const wrap = document.createElement("div");
    wrap.className = "closeup-wrap";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "closeup";
    btn.className = "closeup";
    btn.setAttribute("aria-pressed", getZoomGoal() > 2.2 ? "true" : "false");
    btn.addEventListener("click", onToggleCloseup);

    const lens = document.createElement("span");
    lens.className = "lens";
    const thumbImg = imageUrl(specimen, "thumb");
    const fullImg = imageUrl(specimen, "full");
    lens.style.backgroundImage = `url("${thumbImg}"), url("${imageFallbackUrl(specimen)}")`;
    lens.style.backgroundPosition = specimen.lens;

    const textBox = document.createElement("span");
    const b = document.createElement("b");
    b.textContent = strings.detail.closeup;
    const small = document.createElement("small");
    small.textContent = t(specimen.closeup);
    textBox.appendChild(b);
    textBox.appendChild(small);

    btn.appendChild(lens);
    btn.appendChild(textBox);
    btn.appendChild(makeSvgIcon("i-chev", "ico chev"));
    wrap.appendChild(btn);
    addRow(wrap);

    if (specimen.credit) {
      const creditP = document.createElement("p");
      creditP.className = "credit";

      const makeCreditLink = (href, label) => {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.appendChild(document.createTextNode(label));
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = strings.detail.credit.newTab;
        a.appendChild(sr);
        return a;
      };

      const { title, author, authorUrl, url, license, licenseUrl } = specimen.credit;
      const isCc0 = license === "CC0";
      const parts = strings.detail.credit.template.split(/(\{title\}|\{author\}|\{license\})/g);

      for (const part of parts) {
        if (part === "{title}") {
          creditP.appendChild(makeCreditLink(url, title));
        } else if (part === "{author}") {
          if (authorUrl || !isCc0) {
            creditP.appendChild(makeCreditLink(authorUrl || url, author));
          } else {
            creditP.appendChild(document.createTextNode(author));
          }
        } else if (part === "{license}") {
          const licenseLabel = isCc0 ? strings.detail.credit.cc0 : license;
          creditP.appendChild(makeCreditLink(licenseUrl, licenseLabel));
        } else if (part) {
          creditP.appendChild(document.createTextNode(part));
        }
      }

      addRow(creditP);
    }

    if (captionEl) captionEl.textContent = t(specimen.caption);
    if (scaleEl) scaleEl.textContent = t(specimen.scale);
    if (fallbackEl) {
      fallbackEl.style.backgroundImage = `url("${fullImg}"), url("${imageFallbackUrl(specimen)}")`;
    }
    if (featImg) {
      delete featImg.dataset.fallbackTried;
      delete featImg.dataset.missing;
      featImg.onerror = () => handleSpecimenImageError(featImg, specimen);
      featImg.alt = "";
      featImg.src = imageUrl(specimen, "thumb");
    }
    if (featTitle) featTitle.textContent = t(specimen.feature.title);
    if (featText) featText.textContent = t(specimen.feature.text);
  }

  function paint(specimen, volume, strings, locale, { instant = false } = {}) {
    if (swapTimer) {
      window.clearTimeout(swapTimer);
      swapTimer = null;
    }

    if (instant) {
      detailEl.classList.remove("leaving");
      renderDetailDOM(specimen, volume, strings, locale, true);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      renderDetailDOM(specimen, volume, strings, locale, true);
      if (cardEl) cardEl.scrollTop = 0;
      return;
    }

    detailEl.classList.remove("instant");
    detailEl.classList.add("leaving");
    swapTimer = window.setTimeout(() => {
      detailEl.classList.remove("leaving");
      renderDetailDOM(specimen, volume, strings, locale, false);
      if (cardEl) cardEl.scrollTop = 0;
    }, 200);
  }

  function destroy() {
    if (swapTimer) {
      window.clearTimeout(swapTimer);
      swapTimer = null;
    }
  }

  return { paint, destroy };
}
