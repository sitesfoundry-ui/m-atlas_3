import en from "./en.js";
import mn from "./mn.js";
import pagesEn from "./pages.en.js";
import pagesMn from "./pages.mn.js";

const bundles = { en, mn };
const pageBundles = { en: pagesEn, mn: pagesMn };

export function format(template, values = {}) {
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

export function formatDate(isoDate, locale = "mn") {
  if (!isoDate) return "";
  const parts = String(isoDate).split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  if (locale === "mn") {
    return `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
  }
  const dt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export function getStrings(locale = "mn") {
  return bundles[locale] || bundles.en;
}

export function getPageStrings(locale = "mn") {
  return pageBundles[locale] || pageBundles.en;
}

export function localizeField(field, locale = "mn") {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field[locale] ?? field.en ?? "";
}
