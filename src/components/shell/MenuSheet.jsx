import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLight } from "../../app/useLight.js";
import { brand } from "../../content/brand.js";
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
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
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
            <span>
              <a href={brand.social.facebook} style={{ textDecoration: "none" }}>FB</a>
              {" / "}
              <a href={brand.social.instagram} style={{ textDecoration: "none" }}>IG</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
