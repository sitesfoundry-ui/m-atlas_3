import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { footerMedia } from "../../content/assets.js";
import { brand } from "../../content/brand.js";
import { useLocale } from "../../i18n/useLocale.js";
import { StrokeBackdrop } from "./StrokeBackdrop.jsx";
import { createFooterReveal } from "./footerReveal.js";

export function BigFooter() {
  const { strings } = useLocale();
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const revealRef = useRef(null);
  const hasPlayedRef = useRef(false);

  const [soundOn, setSoundOn] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);

  const media = footerMedia();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = createFooterReveal(root);
    revealRef.current = reveal;

    if (reducedMotion) {
      reveal.finish();
      return () => {
        reveal.destroy();
      };
    }

    reveal.reset();

    let destroyed = false;
    let footerNear = false;
    let footerActive = false;

    const tryPlayVideo = () => {
      const video = videoRef.current;
      if (!video || !hasPlayedRef.current || document.hidden || !footerActive) return;
      video.play().catch(() => {});
    };

    const pauseVideo = () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
    };

    const startReveal = async () => {
      if (hasPlayedRef.current || destroyed) return;
      hasPlayedRef.current = true;
      setLoadVideo(true);
      try {
        await document.fonts.ready;
      } catch {
        // Ignore font readiness failures
      }
      if (destroyed) return;
      requestAnimationFrame(() => {
        tryPlayVideo();
      });
      reveal.play();
    };

    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !footerNear) {
            footerNear = true;
            setLoadVideo(true);
            nearObserver.disconnect();
          }
        }
      },
      { rootMargin: "400px 0px" }
    );
    nearObserver.observe(root);

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          footerActive = entry.intersectionRatio >= 0.1;
          if (!footerActive) {
            pauseVideo();
          } else if (hasPlayedRef.current) {
            tryPlayVideo();
          }
          if (!hasPlayedRef.current && entry.intersectionRatio >= 0.35) {
            startReveal();
          }
        }
      },
      { threshold: [0, 0.1, 0.35] }
    );
    revealObserver.observe(root);

    const onVisibility = () => {
      if (document.hidden) {
        pauseVideo();
      } else {
        tryPlayVideo();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        if (hasPlayedRef.current) {
          reveal.finish();
        }
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      destroyed = true;
      nearObserver.disconnect();
      revealObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      reveal.destroy();
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        while (video.firstChild) {
          video.removeChild(video.firstChild);
        }
        video.load();
      }
    };
  }, []);

  useEffect(() => {
    if (!loadVideo || !hasPlayedRef.current) return;
    const video = videoRef.current;
    if (!video || document.hidden) return;
    video.play().catch(() => {});
  }, [loadVideo]);

  const handleReplay = () => {
    if (replaying || !revealRef.current) return;
    revealRef.current.replay((busy) => setReplaying(busy));
  };

  return (
    <footer className="big-footer" ref={rootRef} data-state="initial">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="f-breeze" viewBox="0 0 24 24">
          <path d="M3 8.5h9.5a2.5 2.5 0 1 0-2.5-2.5M3 12.5h14a2.5 2.5 0 1 1-2.5 2.5M3 16.5h6.5a2 2 0 1 1-2 2" />
        </symbol>
        <symbol id="f-speaker" viewBox="0 0 24 24">
          <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
          <path className="wave w1" style={{ opacity: "var(--wave-opacity, 1)" }} d="M15.2 9.6a3.6 3.6 0 0 1 0 4.8" />
          <path className="wave w2" style={{ opacity: "var(--wave-opacity, 1)" }} d="M17.7 7.6a6.6 6.6 0 0 1 0 8.8" />
        </symbol>
      </svg>

      <div className="bf-bg" aria-hidden="true">
        <StrokeBackdrop />
      </div>

      <nav className="bf-nav" aria-label={strings.footer.nav}>
        <div className="bf-nav-left">
          <Link to="/">{strings.nav.birds}</Link>
          <Link to="/myths">{strings.nav.myths}</Link>
          <Link to="/notes" className="bf-nav-extra">{strings.nav.notes}</Link>
          <Link to="/about">{strings.nav.about}</Link>
          <Link to="/contact">{strings.nav.contact}</Link>
        </div>
        <div className="bf-nav-right">
          <a href={brand.social.instagram}>{strings.footer.instagram}</a>
          <a href={brand.social.facebook}>{strings.footer.facebook}</a>
        </div>
      </nav>

      <div className="bf-hero-wrap">
        <div className="bf-word" role="img" aria-label={brand.name}>
          <span className="bf-letters" aria-hidden="true">AT</span>
          <div className="bf-pill">
            <div className="bf-pill-clip">
              <video
                ref={videoRef}
                className="bf-video"
                muted
                loop
                playsInline
                preload="none"
                poster={media.poster}
              >
                {loadVideo &&
                  media.sources.map((src) => (
                    <source key={src.src} src={src.src} type={src.type} />
                  ))}
              </video>
              <div className="bf-hairline" aria-hidden="true" />
              <div className="bf-pill-icons">
                <svg className="bf-breeze-ico" aria-hidden="true">
                  <use href="#f-breeze" />
                </svg>
                <button
                  type="button"
                  className="bf-sound-btn"
                  aria-pressed={soundOn}
                  aria-label={strings.footer.sound}
                  onClick={() => setSoundOn((prev) => !prev)}
                  style={{ "--wave-opacity": soundOn ? 1 : 0 }}
                >
                  <svg aria-hidden="true">
                    <use href="#f-speaker" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <span className="bf-letters" aria-hidden="true">LAS</span>
        </div>
      </div>

      <div className="bf-bottom">
        <div className="bf-bar">
          <p className="bf-para">{strings.footer.paragraph}</p>
          <div className="bf-rule" aria-hidden="true" />
          <button
            type="button"
            className="bf-cta"
            aria-disabled={replaying}
            onClick={handleReplay}
          >
            {strings.footer.button}
          </button>
        </div>

        <div className="bf-legal">
          <span>{strings.footer.rights}</span>
          <nav className="bf-legal-links" aria-label={strings.footer.legal}>
            <Link to="/legal/privacy">{strings.footer.privacy}</Link>
            <Link to="/legal/terms">{strings.footer.terms}</Link>
            <Link to="/legal/cookies">{strings.footer.cookies}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
