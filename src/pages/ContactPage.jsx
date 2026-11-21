import { useEffect, useRef, useState } from "react";
import { ShellLayout } from "../app/ShellLayout.jsx";
import { brand } from "../content/brand.js";
import { specimens } from "../content/specimens.js";
import { useLocale } from "../i18n/useLocale.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ContactPage({ onOpenMenu, menuButtonRef }) {
  const { locale, strings, pages, t } = useLocale();
  const contact = pages.contact;
  const formCopy = contact.form;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("general");
  const [specimenId, setSpecimenId] = useState(specimens[0]?.id || "kingfisher");
  const [message, setMessage] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [website, setWebsite] = useState("");

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requestIdRef = useRef(createUuid());
  const statusRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const messageRef = useRef(null);
  const consentRef = useRef(null);

  useEffect(() => {
    document.title = `${strings.nav.contact} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [strings]);

  useEffect(() => {
    if (submitted) {
      statusRef.current?.focus();
    }
  }, [submitted]);

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      nextErrors.fullName = formCopy.required;
    } else if (trimmedName.length > 120) {
      nextErrors.fullName = formCopy.tooLong;
    }

    if (!trimmedEmail) {
      nextErrors.email = formCopy.required;
    } else if (trimmedEmail.length > 254 || !EMAIL_RE.test(trimmedEmail)) {
      nextErrors.email = formCopy.invalidEmail;
    }

    if (trimmedPhone.length > 40) {
      nextErrors.phone = formCopy.tooLong;
    }

    if (!trimmedMessage) {
      nextErrors.message = formCopy.required;
    } else if (trimmedMessage.length > 2000) {
      nextErrors.message = formCopy.tooLong;
    }

    if (!consentGiven) {
      nextErrors.consentGiven = formCopy.consentRequired;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.fullName) nameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.phone) phoneRef.current?.focus();
      else if (nextErrors.message) messageRef.current?.focus();
      else if (nextErrors.consentGiven) consentRef.current?.focus();
      return;
    }

    setErrors({});
    setServerError("");
    setSubmitting(true);

    try {
      const payload = {
        requestId: requestIdRef.current,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        topic,
        specimenId: topic === "feedback" ? specimenId : undefined,
        message: trimmedMessage,
        consentGiven: true,
        locale,
        website,
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setServerError(formCopy.error);
      } else {
        setSubmitted(true);
        requestIdRef.current = createUuid();
      }
    } catch {
      setServerError(formCopy.error);
    } finally {
      setSubmitting(false);
    }
  };

  const isFeedback = topic === "feedback";

  return (
    <ShellLayout onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef}>
      <header className="page-rise" style={{ "--step": 0 }}>
        <div className="page-eyebrow">{contact.eyebrow}</div>
        <h1 className="page-h1">{contact.title}</h1>
        <p className="page-intro">{contact.intro}</p>
      </header>

      <div className="contact-grid">
        <aside className="page-rise" style={{ "--step": 1 }} aria-label={contact.direct}>
          <dl className="contact-dl">
            <div>
              <dt>{contact.emailLabel}</dt>
              <dd>
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              </dd>
            </div>
            <div>
              <dt>{contact.socialLabel}</dt>
              <dd>
                <a href={brand.social.facebook}>FB</a>
                {" / "}
                <a href={brand.social.instagram}>IG</a>
              </dd>
            </div>
            <div>
              <dt>{contact.replyLabel}</dt>
              <dd>{contact.replyValue}</dd>
            </div>
          </dl>
        </aside>

        <section className="form-card page-rise" style={{ "--step": 2 }}>
          {submitted ? (
            <div
              ref={statusRef}
              tabIndex={-1}
              className="status-banner"
              role="status"
            >
              {formCopy.success}
            </div>
          ) : (
            <form className="form-stack" onSubmit={handleSubmit} noValidate>
              <div
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
                aria-hidden="true"
              >
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="contact-name" className="field-label">
                  {formCopy.name}
                </label>
                <input
                  ref={nameRef}
                  id="contact-name"
                  name="fullName"
                  type="text"
                  className="field-input"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearFieldError("fullName");
                  }}
                  autoComplete="name"
                  required
                  maxLength={120}
                  aria-invalid={errors.fullName ? "true" : "false"}
                  aria-describedby={errors.fullName ? "err-name" : undefined}
                />
                {errors.fullName && (
                  <p id="err-name" className="field-error">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className="field-label">
                  {formCopy.email}
                </label>
                <input
                  ref={emailRef}
                  id="contact-email"
                  name="email"
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  autoComplete="email"
                  required
                  maxLength={254}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "err-email" : undefined}
                />
                {errors.email && (
                  <p id="err-email" className="field-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-phone" className="field-label">
                  {formCopy.phone}
                </label>
                <input
                  ref={phoneRef}
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  className="field-input"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError("phone");
                  }}
                  autoComplete="tel"
                  maxLength={40}
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "err-phone" : undefined}
                />
                {errors.phone && (
                  <p id="err-phone" className="field-error">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-topic" className="field-label">
                  {formCopy.topic}
                </label>
                <select
                  id="contact-topic"
                  name="topic"
                  className="field-select"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="general">{formCopy.topics.general}</option>
                  <option value="suggest">{formCopy.topics.suggest}</option>
                  <option value="press">{formCopy.topics.press}</option>
                  <option value="feedback">{formCopy.topics.feedback}</option>
                </select>
              </div>

              <div className="specimen-collapse" data-open={isFeedback ? "true" : "false"}>
                <div className="specimen-collapse-inner">
                  <label htmlFor="contact-specimen" className="field-label">
                    {formCopy.specimen}
                  </label>
                  <select
                    id="contact-specimen"
                    name="specimenId"
                    className="field-select"
                    value={specimenId}
                    onChange={(e) => setSpecimenId(e.target.value)}
                    tabIndex={isFeedback ? 0 : -1}
                    disabled={!isFeedback}
                  >
                    {specimens.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {t(spec.name)} ({spec.latin})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="field-label">
                  {formCopy.message}
                </label>
                <textarea
                  ref={messageRef}
                  id="contact-message"
                  name="message"
                  className="field-textarea"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearFieldError("message");
                  }}
                  required
                  maxLength={2000}
                  aria-invalid={errors.message ? "true" : "false"}
                  aria-describedby={errors.message ? "err-message" : undefined}
                />
                {errors.message && (
                  <p id="err-message" className="field-error">
                    {errors.message}
                  </p>
                )}
              </div>

              <div>
                <label className="consent-label">
                  <input
                    ref={consentRef}
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => {
                      setConsentGiven(e.target.checked);
                      clearFieldError("consentGiven");
                    }}
                    aria-invalid={errors.consentGiven ? "true" : "false"}
                    aria-describedby={errors.consentGiven ? "err-consent" : undefined}
                  />
                  <span>{formCopy.consent}</span>
                </label>
                {errors.consentGiven && (
                  <p id="err-consent" className="field-error">
                    {errors.consentGiven}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="status-banner" role="alert">
                  {serverError}
                </div>
              )}

              <div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? formCopy.sending : formCopy.submit}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </ShellLayout>
  );
}
