import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import { getPageStrings, getStrings, localizeField } from "./index.js";

const LocaleContext = createContext(null);

function readInitialLocale() {
  if (typeof window === "undefined") return "mn";
  try {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get("lang");
    if (queryLang === "en" || queryLang === "mn") return queryLang;
    const saved = localStorage.getItem("matlas.lang");
    if (saved === "en" || saved === "mn") return saved;
  } catch {
    return "mn";
  }
  return "mn";
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    try {
      localStorage.setItem("matlas.lang", locale);
    } catch {
      // Storage unavailable
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (next !== "en" && next !== "mn") return;
    setLocaleState(next);
  }, []);

  const strings = getStrings(locale);
  const pages = getPageStrings(locale);

  const t = useCallback(
    (field) => localizeField(field, locale),
    [locale]
  );

  return createElement(
    LocaleContext.Provider,
    { value: { locale, setLocale, strings, pages, t } },
    children
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
