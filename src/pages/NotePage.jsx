import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { imageFallbackUrl, imageUrl } from "../content/assets.js";
import { brand } from "../content/brand.js";
import { notes } from "../content/notes.js";
import { specimens } from "../content/specimens.js";
import { format, formatDate } from "../i18n/index.js";
import { useLocale } from "../i18n/useLocale.js";
import { NotFoundPage } from "./NotFoundPage.jsx";

export function NotePage({ onOpenMenu, menuButtonRef }) {
  const { slug } = useParams();
  const { locale, strings, pages, t } = useLocale();
  const notesCopy = pages.notes;

  const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const noteIndex = sortedNotes.findIndex((n) => n.slug === slug);
  const note = noteIndex >= 0 ? sortedNotes[noteIndex] : null;
  const item = note ? notesCopy.items[note.slug] : null;

  useEffect(() => {
    if (!item) return;
    document.title = `${item.title} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", item.excerpt || strings.meta.description);
  }, [item, strings]);

  if (!note || !item) {
    return <NotFoundPage onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef} />;
  }

  const nextNote = sortedNotes[(noteIndex + 1) % sortedNotes.length];
  const nextItem = nextNote ? notesCopy.items[nextNote.slug] : null;
  const relatedSpecimen = note.specimen
    ? specimens.find((s) => s.id === note.specimen)
    : null;

  const accentColor =
    note.volume === "birds"
      ? "var(--accent-birds)"
      : note.volume === "myths"
      ? "var(--accent-myths)"
      : null;

  const renderVolumeLabel = (vol) => {
    if (vol === "birds") {
      return (
        <span className="vol-tag">
          <span className="vol-dot birds" aria-hidden="true" />
          <span>{strings.nav.birds}</span>
        </span>
      );
    }
    if (vol === "myths") {
      return (
        <span className="vol-tag">
          <span className="vol-dot myths" aria-hidden="true" />
          <span>{strings.nav.myths}</span>
        </span>
      );
    }
    return <span className="vol-tag">{notesCopy.bothVolumes}</span>;
  };

  const specimenRoute = relatedSpecimen
    ? `${relatedSpecimen.volume === "myths" ? "/myths" : "/"}?specimen=${relatedSpecimen.id}`
    : "/";

  return (
    <ShellLayout
      onOpenMenu={onOpenMenu}
      menuButtonRef={menuButtonRef}
      accentColor={accentColor}
    >
      <div className="page-rise" style={{ "--step": 0 }}>
        <Link to="/notes" className="note-article-back">
          <svg className="ico" aria-hidden="true">
            <use href="#i-arrow" />
          </svg>
          <span>{notesCopy.all}</span>
        </Link>

        <div className="note-article-meta">
          <time dateTime={note.date}>{formatDate(note.date, locale)}</time>
          <span aria-hidden="true">·</span>
          {renderVolumeLabel(note.volume)}
          <span aria-hidden="true">·</span>
          <span>{format(notesCopy.minutes, { n: note.minutes })}</span>
        </div>

        <h1 className="page-h1">{item.title}</h1>
      </div>

      <article className="note-article-body page-rise" style={{ "--step": 1 }}>
        {item.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>

      {relatedSpecimen && (
        <aside className="specimen-callout page-rise" style={{ "--step": 2 }}>
          <img
            src={imageUrl(relatedSpecimen, "thumb")}
            alt=""
            width="70"
            height="70"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = imageFallbackUrl(relatedSpecimen);
            }}
          />
          <div style={{ flex: "1 1 180px" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: "22px", lineHeight: 1.15 }}>
              {t(relatedSpecimen.name)}
            </div>
            <div style={{ fontStyle: "italic", fontSize: "13px", color: "var(--muted)", marginTop: "3px" }}>
              {relatedSpecimen.latin}
            </div>
          </div>
          <Link to={specimenRoute} className="btn-primary">
            <span>{notesCopy.seeSpecimen}</span>
            <svg className="ico" aria-hidden="true">
              <use href="#i-arrow" />
            </svg>
          </Link>
        </aside>
      )}

      {nextNote && nextItem && (
        <section className="page-section page-rise" style={{ "--step": 3 }} aria-labelledby="read-next-heading">
          <div id="read-next-heading" className="page-eyebrow">
            {notesCopy.readNext}
          </div>
          <div className="notes-list" style={{ marginTop: "14px" }}>
            <Link to={`/notes/${nextNote.slug}`} className="note-row">
              <div className="note-row-meta">
                <time dateTime={nextNote.date}>{formatDate(nextNote.date, locale)}</time>
                {renderVolumeLabel(nextNote.volume)}
              </div>
              <div>
                <h2 className="note-row-title">{nextItem.title}</h2>
                <p className="note-row-excerpt">{nextItem.excerpt}</p>
              </div>
              <div className="note-row-mins">
                {format(notesCopy.minutes, { n: nextNote.minutes })}
              </div>
            </Link>
          </div>
        </section>
      )}
    </ShellLayout>
  );
}
