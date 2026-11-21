import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { imageFallbackUrl, imageUrl } from "../content/assets.js";
import { brand } from "../content/brand.js";
import { categories } from "../content/categories.js";
import { specimens } from "../content/specimens.js";
import { format } from "../i18n/index.js";
import { useLocale } from "../i18n/useLocale.js";
import { NotFoundPage } from "./NotFoundPage.jsx";

function findCategory(slug) {
  for (const volume of ["birds", "myths"]) {
    const match = categories[volume].find((c) => c.slug === slug);
    if (match) return { volume, category: match };
  }
  return null;
}

export function CollectionPage({ onOpenMenu, menuButtonRef }) {
  const { slug } = useParams();
  const { strings, pages, t } = useLocale();
  const found = findCategory(slug);

  const label = found ? t(found.category.label) : "";

  useEffect(() => {
    if (!found) return;
    document.title = `${label} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [found, label, strings]);

  if (!found) {
    return <NotFoundPage onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef} />;
  }

  const { volume, category } = found;
  const accentColor = volume === "birds" ? "var(--accent-birds)" : "var(--accent-myths)";
  const volSpecimens = specimens.filter((s) => s.volume === volume);
  const countStr = format(strings.sidebar.count[volume], { n: category.count });
  const introLine = format(pages.collection.line, { name: label, count: countStr });

  return (
    <ShellLayout
      onOpenMenu={onOpenMenu}
      menuButtonRef={menuButtonRef}
      accentColor={accentColor}
    >
      <header className="page-rise" style={{ "--step": 0 }}>
        <div className="page-eyebrow">{pages.collection.eyebrow}</div>
        <h1 className="page-h1">{label}</h1>
        <p className="page-intro">{introLine}</p>
      </header>

      <hr
        className="page-rise"
        style={{
          "--step": 1,
          border: 0,
          borderTop: "1px solid var(--line)",
          margin: "48px 0 36px",
        }}
      />

      <section className="page-rise" style={{ "--step": 2 }} aria-labelledby="open-specimens-heading">
        <h2 id="open-specimens-heading" className="page-h2">
          {pages.collection.open}
        </h2>
        <div className="collection-grid">
          {volSpecimens.map((spec) => (
            <article key={spec.id} className="collection-card">
              <img
                src={imageUrl(spec, "thumb")}
                alt={t(spec.name)}
                width="110"
                height="110"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = imageFallbackUrl(spec);
                }}
              />
              <div>
                <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "28px", margin: 0, lineHeight: 1.1 }}>
                  {t(spec.name)}
                </h3>
                <div style={{ fontStyle: "italic", fontSize: "13.5px", color: "var(--muted)", marginTop: "4px" }}>
                  {spec.latin}
                </div>
              </div>
              <Link
                to={`${volume === "myths" ? "/myths" : "/"}?specimen=${spec.id}`}
                className="btn-primary"
                style={{ marginTop: "auto" }}
              >
                <span>{pages.collection.view}</span>
                <svg className="ico" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </ShellLayout>
  );
}
