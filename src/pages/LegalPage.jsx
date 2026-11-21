import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { brand } from "../content/brand.js";
import { useLocale } from "../i18n/useLocale.js";
import { NotFoundPage } from "./NotFoundPage.jsx";

const VALID_LEGAL_SLUGS = new Set(["privacy", "terms", "cookies"]);

export function LegalPage({ onOpenMenu, menuButtonRef }) {
  const { slug } = useParams();
  const { strings, pages } = useLocale();
  const doc = slug && VALID_LEGAL_SLUGS.has(slug) ? pages.legal[slug] : null;

  useEffect(() => {
    if (!doc) return;
    document.title = `${doc.title} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [doc, strings]);

  if (!doc) {
    return <NotFoundPage onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef} />;
  }

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <header className="page-rise" style={{ "--step": 0 }}>
        <div className="page-eyebrow">
          {pages.legal.updatedLabel} · {pages.legal.updated}
        </div>
        <h1 className="page-h1">{doc.title}</h1>
      </header>

      <div className="legal-sections page-rise" style={{ "--step": 1 }}>
        {doc.sections.map((sec, idx) => (
          <section key={sec.h} className="legal-sec">
            <div className="page-eyebrow">{String(idx + 1).padStart(2, "0")}.</div>
            <h2>{sec.h}</h2>
            <p>{sec.p}</p>
          </section>
        ))}
      </div>
    </ShellLayout>
  );
}
