import { Link, useLocation } from "react-router-dom";
import { brand } from "../../content/brand.js";
import { useLocale } from "../../i18n/useLocale.js";
import { LanguageToggle } from "./LanguageToggle.jsx";

export function SiteBar({ onOpenMenu, menuButtonRef }) {
  const { strings } = useLocale();
  const { pathname } = useLocation();

  const navItems = [
    { to: "/", label: strings.nav.birds },
    { to: "/myths", label: strings.nav.myths },
    { to: "/notes", label: strings.nav.notes },
    { to: "/about", label: strings.nav.about },
    { to: "/contact", label: strings.nav.contact },
  ];

  const isCurrent = (to) => {
    if (to === "/") return pathname === "/";
    if (to === "/notes") return pathname === "/notes" || pathname.startsWith("/notes/");
    return pathname === to;
  };

  return (
    <header className="site-bar">
      <div className="site-bar-inner">
        <Link to="/" className="site-brand">
          {brand.name}
        </Link>

        <nav className="site-links" aria-label={strings.nav.main}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isCurrent(item.to) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <LanguageToggle />
          <button
            ref={menuButtonRef}
            type="button"
            className="shell-iconbtn"
            aria-label={strings.nav.menu}
            onClick={(e) => onOpenMenu(e.currentTarget)}
          >
            <span className="shell-avatar" aria-hidden="true">
              <svg className="ico">
                <use href="#i-user" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
