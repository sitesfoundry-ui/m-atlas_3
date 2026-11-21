import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { brand } from "../content/brand.js";
import { notes } from "../content/notes.js";
import { format, formatDate } from "../i18n/index.js";
import { useLocale } from "../i18n/useLocale.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NotesPage({ onOpenMenu, menuButtonRef }) {
  const { locale, strings, pages } = useLocale();
  const notesCopy = pages.notes;
  const newsCopy = pages.newsletter;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${strings.nav.notes} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [strings]);

  const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));

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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
      setError(newsCopy.invalid);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale }),
      });
      if (!res.ok) {
        setError(newsCopy.error);
      } else {
        setSubscribed(true);
      }
    } catch {
      setError(newsCopy.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <header className="page-rise" style={{ "--step": 0 }}>
        <div className="page-eyebrow">{notesCopy.eyebrow}</div>
        <h1 className="page-h1">{notesCopy.title}</h1>
        <p className="page-intro">{notesCopy.intro}</p>
      </header>

      <section className="notes-list page-rise" style={{ "--step": 1 }} aria-label={notesCopy.title}>
        {sortedNotes.map((note) => {
          const item = notesCopy.items[note.slug];
          if (!item) return null;
          return (
            <Link key={note.slug} to={`/notes/${note.slug}`} className="note-row">
              <div className="note-row-meta">
                <time dateTime={note.date}>{formatDate(note.date, locale)}</time>
                {renderVolumeLabel(note.volume)}
              </div>
              <div>
                <h2 className="note-row-title">{item.title}</h2>
                <p className="note-row-excerpt">{item.excerpt}</p>
              </div>
              <div className="note-row-mins">
                {format(notesCopy.minutes, { n: note.minutes })}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="newsletter-card page-rise" style={{ "--step": 2 }} aria-labelledby="newsletter-title">
        <h2 id="newsletter-title">{newsCopy.title}</h2>
        <p>{newsCopy.text}</p>

        {subscribed ? (
          <div className="status-banner" role="status">
            {newsCopy.success}
          </div>
        ) : (
          <form onSubmit={handleSubscribe} noValidate>
            <label htmlFor="newsletter-email" className="field-label">
              {newsCopy.label}
            </label>
            <div className="newsletter-form">
              <input
                id="newsletter-email"
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder={newsCopy.placeholder}
                autoComplete="email"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "newsletter-error" : undefined}
              />
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? newsCopy.sending : newsCopy.button}
              </button>
            </div>
            {error && (
              <p id="newsletter-error" className="field-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </section>
    </ShellLayout>
  );
}
