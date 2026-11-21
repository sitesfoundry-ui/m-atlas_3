import en from "../src/i18n/en.js";
import mn from "../src/i18n/mn.js";
import pagesEn from "../src/i18n/pages.en.js";
import pagesMn from "../src/i18n/pages.mn.js";

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const HAS_LETTER_RE = /[A-Za-z\u0400-\u04FF]/;
const ALLOWED_LATIN_MN = new Set(["EN", "MN", "FB / IG", "Upupidae", "Alcedinidae"]);

function isAllowedNonCyrillic(val) {
  const s = val.trim();
  if (!HAS_LETTER_RE.test(s)) return true;
  if (ALLOWED_LATIN_MN.has(s)) return true;
  if (/^MA-\d+$/i.test(s)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true;
  return false;
}

export function validateI18nPair(enObj, mnObj, prefix = "") {
  const errors = [];

  if (Array.isArray(enObj) || Array.isArray(mnObj)) {
    if (!Array.isArray(enObj) || !Array.isArray(mnObj)) {
      errors.push(`${prefix}: array mismatch`);
      return errors;
    }
    if (enObj.length !== mnObj.length) {
      errors.push(`${prefix}: array length mismatch (${enObj.length} vs ${mnObj.length})`);
      return errors;
    }
    for (let i = 0; i < enObj.length; i++) {
      errors.push(...validateI18nPair(enObj[i], mnObj[i], `${prefix}[${i}]`));
    }
    return errors;
  }

  if (typeof enObj === "object" && enObj !== null && typeof mnObj === "object" && mnObj !== null) {
    const enKeys = Object.keys(enObj).sort();
    const mnKeys = Object.keys(mnObj).sort();

    for (const k of enKeys) {
      if (!Object.prototype.hasOwnProperty.call(mnObj, k)) {
        errors.push(`Missing key in mn: ${prefix ? `${prefix}.${k}` : k}`);
      }
    }
    for (const k of mnKeys) {
      if (!Object.prototype.hasOwnProperty.call(enObj, k)) {
        errors.push(`Extra key in mn: ${prefix ? `${prefix}.${k}` : k}`);
      }
    }
    for (const k of enKeys) {
      if (Object.prototype.hasOwnProperty.call(mnObj, k)) {
        errors.push(...validateI18nPair(enObj[k], mnObj[k], prefix ? `${prefix}.${k}` : k));
      }
    }
    return errors;
  }

  if (typeof enObj !== "string" || typeof mnObj !== "string") {
    errors.push(`${prefix}: expected string values`);
    return errors;
  }

  if (enObj.trim() === "") {
    errors.push(`${prefix}: empty English string`);
  }
  if (mnObj.trim() === "") {
    errors.push(`${prefix}: empty Mongolian string`);
  } else if (!CYRILLIC_RE.test(mnObj) && !isAllowedNonCyrillic(mnObj)) {
    errors.push(`${prefix}: Mongolian value lacks Cyrillic (${mnObj})`);
  }

  return errors;
}

export function runCheck() {
  return [
    ...validateI18nPair(en, mn, "ui"),
    ...validateI18nPair(pagesEn, pagesMn, "pages"),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = runCheck();
  if (errors.length > 0) {
    console.error("i18n check failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("i18n check passed.");
}
