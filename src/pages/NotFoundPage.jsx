import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { useNoIndex } from "../app/useNoIndex.js";
import { handleSpecimenImageError, imageUrl } from "../content/assets.js";
import { brand } from "../content/brand.js";
import { specimens } from "../content/specimens.js";
import { useLocale } from "../i18n/useLocale.js";

function formatRequestedPath(pathname, search) {
  const raw = `${pathname}${search || ""}`;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return decoded.length > 80 ? `${decoded.slice(0, 79)}…` : decoded;
}

export function NotFoundPage({ onOpenMenu, menuButtonRef }) {
  const { strings, pages, t } = useLocale();
  const { pathname, search } = useLocation();
  const notFound = pages.notFound;

  useNoIndex();

  useEffect(() => {
    document.title = `${notFound.title} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [notFound.title, strings.meta.description]);

  const requestedPath = formatRequestedPath(pathname, search);
  const featuredPlates = [
    specimens.find((s) => s.volume === "birds"),
    specimens.find((s) => s.volume === "myths"),
  ].filter(Boolean);

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <div className="notfound-wrap page-rise" style={{ "--step": 0 }}>
        <p className="page-eyebrow">{notFound.eyebrow}</p>
        <h1 className="notfound-title">{notFound.title}</h1>
        <p className="page-intro">{notFound.text}</p>
        <p className="notfound-path">
          <span>{notFound.requested}</span> <code>{requestedPath}</code>
        </p>
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
        <nav className="notfound-links" aria-label={strings.nav.main}>
          <Link to="/notes">{strings.nav.notes}</Link>
          <Link to="/contact">{strings.nav.contact}</Link>
        </nav>
      </div>

      <section
        className="page-section notfound-specimens page-rise"
        style={{ "--step": 1 }}
        aria-labelledby="notfound-specimens-heading"
      >
        <h2 id="notfound-specimens-heading" className="page-h2">
          {notFound.specimensTitle}
        </h2>
        <div className="notfound-grid">
          {featuredPlates.map((spec) => (
            <Link
              key={spec.id}
              to={spec.volume === "birds" ? `/?specimen=${spec.id}` : `/myths?specimen=${spec.id}`}
              className="notfound-card"
            >
              <img
                src={imageUrl(spec, "thumb")}
                alt=""
                width="76"
                height="76"
                decoding="async"
                onError={(e) => handleSpecimenImageError(e.currentTarget, spec)}
              />
              <span className="notfound-card-meta">
                <span className="notfound-card-no">
                  {strings.volume.vol[spec.volume]} · {spec.no}
                </span>
                <span className="notfound-card-name">{t(spec.name)}</span>
                <span className="notfound-card-latin">{spec.latin}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </ShellLayout>
  );
}

