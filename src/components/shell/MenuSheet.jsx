import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLight } from "../../app/useLight.js";
import { brand, hasUrl } from "../../content/brand.js";
import { useLocale } from "../../i18n/useLocale.js";
import { LanguageToggle } from "./LanguageToggle.jsx";

export function MenuSheet({ open, origin, volume = null, onClose }) {
  const { strings } = useLocale();
  const { light, toggleLight } = useLight();
  const { pathname } = useLocation();
  const closeBtnRef = useRef(null);
  const sheetRef = useRef(null);
  const [rendered, setRendered] = useState(open);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setExpanded(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setRendered(false), reduced ? 20 : 700);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && sheetRef.current) {
        const focusables = Array.from(
          sheetRef.current.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.getClientRects().length > 0);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !sheetRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !sheetRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!rendered) return null;

  const ox = origin ? `${origin.x}px` : "calc(100% - 36px)";
  const oy = origin ? `${origin.y}px` : "32px";
  const clipPath = expanded ? `circle(150vmax at ${ox} ${oy})` : `circle(0px at ${ox} ${oy})`;

  const links = [
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

  const skinClass = volume ? "hero" : "site";

  return (
    <div
      ref={sheetRef}
      className={`menu-sheet ${skinClass}`}
      data-volume={volume || undefined}
      data-light={light}
      role="dialog"
      aria-modal="true"
      aria-label={strings.nav.menu}
      style={{ clipPath }}
    >
      <div className="menu-sheet-inner">
        <div className="menu-sheet-top">
          <Link to="/" className="site-brand" onClick={onClose}>
            {brand.name}
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            className="menu-close"
            onClick={onClose}
          >
            {strings.nav.close}
          </button>
        </div>

        <nav className="menu-nav" aria-label={strings.nav.main}>
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isCurrent(item.to) ? "page" : undefined}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="menu-foot">
          <div className="menu-controls">
            <LanguageToggle />
            <button
              type="button"
              className="light-pill-btn"
              onClick={toggleLight}
              aria-pressed={light === "dusk"}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-sun" />
              </svg>
              <span>{light === "dusk" ? strings.nav.dusk : strings.nav.day}</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center" }}>
            <a href={`mailto:${brand.email}`} style={{ textDecoration: "none" }}>
              {brand.email}
            </a>
            {(hasUrl(brand.social.facebook) || hasUrl(brand.social.instagram)) && (
              <span>
                {hasUrl(brand.social.facebook) && (
                  <a href={brand.social.facebook} style={{ textDecoration: "none" }}>FB</a>
                )}
                {hasUrl(brand.social.facebook) && hasUrl(brand.social.instagram) && " / "}
                {hasUrl(brand.social.instagram) && (
                  <a href={brand.social.instagram} style={{ textDecoration: "none" }}>IG</a>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
