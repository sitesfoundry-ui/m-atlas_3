import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { brand } from "../content/brand.js";
import { useLocale } from "../i18n/useLocale.js";

export function NotFoundPage({ onOpenMenu, menuButtonRef }) {
  const { strings, pages } = useLocale();
  const notFound = pages.notFound;

  useEffect(() => {
    document.title = `${notFound.title} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [notFound.title, strings.meta.description]);

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <div className="notfound-wrap page-rise" style={{ "--step": 0 }}>
        <h1 className="notfound-title">{notFound.title}</h1>
        <p className="page-intro">{notFound.text}</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">
            <span>{notFound.birds}</span>
            <svg className="ico" aria-hidden="true">
              <use href="#i-arrow" />
            </svg>
          </Link>
          <Link to="/myths" className="btn-secondary">
            <span>{notFound.myths}</span>
          </Link>
        </div>
      </div>
    </ShellLayout>
  );
}
