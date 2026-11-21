import { useLocale } from "../../i18n/useLocale.js";

export function LanguageToggle({ className = "" }) {
  const { locale, setLocale, strings } = useLocale();

  return (
    <div
      className={`lang-toggle ${className}`.trim()}
      role="group"
      aria-label={strings.nav.language}
      data-active={locale}
    >
      <span className="lang-toggle-pill" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === "mn"}
        onClick={() => setLocale("mn")}
      >
        MN
      </button>
    </div>
  );
}
