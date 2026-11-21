import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { handleSpecimenImageError, imageUrl } from "../content/assets.js";
import { brand } from "../content/brand.js";
import { specimens } from "../content/specimens.js";
import { useLocale } from "../i18n/useLocale.js";

export function AboutPage({ onOpenMenu, menuButtonRef }) {
  const { strings, pages, t } = useLocale();
  const about = pages.about;

  useEffect(() => {
    document.title = `${strings.nav.about} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [strings]);

  const birdSpecimens = specimens.filter((s) => s.volume === "birds");
  const mythSpecimens = specimens.filter((s) => s.volume === "myths");

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <header className="page-rise" style={{ "--step": 0 }}>
        <div className="page-eyebrow">{about.eyebrow}</div>
        <h1 className="page-h1">{about.title}</h1>
        <p className="page-intro">{about.intro}</p>
      </header>

      <section className="page-section page-rise" style={{ "--step": 1 }} aria-labelledby="about-volumes">
        <h2 id="about-volumes" className="page-h2">
          {about.volumesTitle}
        </h2>
        <div className="volumes-grid">
          <article className="vol-card" style={{ "--vol-color": "var(--accent-birds)" }}>
            <div className="page-eyebrow">{strings.volume.vol.birds}</div>
            <h3 className="vol-card-title">{about.birds.title}</h3>
            <p className="vol-card-text">{about.birds.text}</p>
            <div className="vol-cutouts">
              {birdSpecimens.map((spec) => (
                <Link key={spec.id} to={`/?specimen=${spec.id}`} className="vol-cutout">
                  <img
                    src={imageUrl(spec, "thumb")}
                    alt=""
                    width="62"
                    height="54"
                    decoding="async"
                    onError={(e) => handleSpecimenImageError(e.currentTarget, spec)}
                  />
                  <span>{t(spec.name)}</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              <Link to="/" className="btn-primary">
                <span>{about.birds.cta}</span>
                <svg className="ico" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </Link>
            </div>
          </article>

          <article className="vol-card" style={{ "--vol-color": "var(--accent-myths)" }}>
            <div className="page-eyebrow">{strings.volume.vol.myths}</div>
            <h3 className="vol-card-title">{about.myths.title}</h3>
            <p className="vol-card-text">{about.myths.text}</p>
            <div className="vol-cutouts">
              {mythSpecimens.map((spec) => (
                <Link key={spec.id} to={`/myths?specimen=${spec.id}`} className="vol-cutout">
                  <img
                    src={imageUrl(spec, "thumb")}
                    alt=""
                    width="62"
                    height="54"
                    decoding="async"
                    onError={(e) => handleSpecimenImageError(e.currentTarget, spec)}
                  />
                  <span>{t(spec.name)}</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              <Link to="/myths" className="btn-primary">
                <span>{about.myths.cta}</span>
                <svg className="ico" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="page-section page-rise" style={{ "--step": 2 }} aria-labelledby="about-how">
        <h2 id="about-how" className="page-h2">
          {about.howTitle}
        </h2>
        <div className="steps-grid">
          {about.steps.map((step, idx) => (
            <div key={step.title} className="step-cell">
              <div className="step-num">{String(idx + 1).padStart(2, "0")}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section page-rise" style={{ "--step": 3 }} aria-labelledby="about-faq">
        <h2 id="about-faq" className="page-h2">
          {about.faqTitle}
        </h2>
        <div className="faq-list">
          {about.faq.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                <span>{item.q}</span>
                <svg className="ico faq-chev" aria-hidden="true">
                  <use href="#i-chev" />
                </svg>
              </summary>
              <div className="faq-answer">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="page-section page-rise" style={{ "--step": 4 }}>
        <div className="cta-card">
          <div>
            <h2>{about.cta.title}</h2>
            <p>{about.cta.text}</p>
          </div>
          <Link to="/contact" className="btn-primary">
            <span>{about.cta.button}</span>
            <svg className="ico" aria-hidden="true">
              <use href="#i-arrow" />
            </svg>
          </Link>
        </div>
      </section>
    </ShellLayout>
  );
}
