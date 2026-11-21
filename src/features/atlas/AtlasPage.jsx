import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLight } from "../../app/useLight.js";
import { LanguageToggle } from "../../components/shell/LanguageToggle.jsx";
import { handleSpecimenImageError, imageUrl } from "../../content/assets.js";
import { brand } from "../../content/brand.js";
import { categories } from "../../content/categories.js";
import { specimens as allSpecimens } from "../../content/specimens.js";
import { volumes } from "../../content/volumes.js";
import { format } from "../../i18n/index.js";
import { useLocale } from "../../i18n/useLocale.js";
import { createAtlasViewer } from "./engine/createAtlasViewer.js";

export function AtlasPage({ volume, onOpenMenu, menuButtonRef }) {
  const { locale, strings, t } = useLocale();
  const { light, toggleLight } = useLight();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const volConfig = volumes[volume];
  const volSpecimens = useMemo(
    () =>
      volConfig.specimens
        .map((id) => allSpecimens.find((s) => s.id === id))
        .filter(Boolean),
    [volConfig]
  );

  const initialSpecimenId = useMemo(() => {
    const q = searchParams.get("specimen");
    if (q && volConfig.specimens.includes(q)) return q;
    return volConfig.defaultSpecimen;
  }, [searchParams, volConfig]);

  const initialIndex = Math.max(
    0,
    volSpecimens.findIndex((s) => s.id === initialSpecimenId)
  );

  const [activeId, setActiveId] = useState(initialSpecimenId);
  const [attempt, setAttempt] = useState(0);

  const rootRef = useRef(null);
  const viewerRef = useRef(null);
  const tabRefs = useRef([]);
  const activeIdRef = useRef(initialSpecimenId);

  useEffect(() => {
    document.title = `${volume === "birds" ? strings.nav.birds : strings.nav.myths} · ${brand.name}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", strings.meta.description);
  }, [volume, strings]);

  useEffect(() => {
    document.body.classList.add("viewer-active");
    if (volume === "birds") {
      document.body.style.backgroundColor = light === "dusk" ? "#14170f" : "#f6f1e7";
    } else {
      document.body.style.backgroundColor = light === "dusk" ? "#17120d" : "#ebe1cd";
    }
    return () => {
      document.body.classList.remove("viewer-active");
    };
  }, [volume, light]);

  const handleSelectSpecimen = useCallback(
    (id) => {
      activeIdRef.current = id;
      setActiveId(id);
      const next = new URLSearchParams(window.location.search);
      next.set("specimen", id);
      navigate({ search: `?${next.toString()}` }, { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;

    activeIdRef.current = initialSpecimenId;
    setActiveId(initialSpecimenId);

    const viewer = createAtlasViewer(el, {
      volume,
      specimens: volSpecimens,
      initialIndex,
      locale,
      strings,
      light,
      onSelectSpecimen: handleSelectSpecimen,
      onNavigate: (path) => navigate(path),
      onToggleLight: toggleLight,
      onRecreate: () => setAttempt((n) => n + 1),
    });
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // Intentionally initialize once per volume route or context recreation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, attempt]);

  // Respond to ?specimen= query changes while on same volume
  useEffect(() => {
    const q = searchParams.get("specimen");
    if (q && volConfig.specimens.includes(q) && q !== activeIdRef.current) {
      viewerRef.current?.select(q);
    }
  }, [searchParams, volConfig]);

  useEffect(() => {
    viewerRef.current?.setLocale(locale, strings);
  }, [locale, strings]);

  useEffect(() => {
    viewerRef.current?.setLight(light);
  }, [light]);

  const handleTabKeyDown = (e, idx) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + dir + volSpecimens.length) % volSpecimens.length;
    viewerRef.current?.select(nextIdx);
    tabRefs.current[nextIdx]?.focus();
  };

  const volCategories = categories[volume] || [];
  const defaultIdx = Math.max(
    0,
    volSpecimens.findIndex((s) => s.id === volConfig.defaultSpecimen)
  );

  return (
    <main
      ref={rootRef}
      id="hero"
      className="hero"
      data-volume={volume}
      data-light={light}
    >
      <canvas key={attempt} id="gl" className="hero-gl" aria-hidden="true" />

      <aside className="side" aria-label={strings.sidebar.sections}>
        <div className="brand-wrap">
          <Link to="/" className="brand">
            {brand.name}
          </Link>
          <div className="vol-switch" role="navigation" aria-label={strings.volume.label}>
            <Link to="/" aria-current={volume === "birds" ? "page" : undefined}>
              {strings.nav.birds}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/myths" aria-current={volume === "myths" ? "page" : undefined}>
              {strings.nav.myths}
            </Link>
          </div>
        </div>

        <ul className="nav side-nav">
          <li>
            <Link to="/" className="side-nav-btn">
              <svg className="ico" aria-hidden="true">
                <use href="#i-home" />
              </svg>
              <span className="side-nav-text">
                <span className="side-nav-label">{strings.nav.home}</span>
              </span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="side-nav-btn"
              aria-current="page"
              onClick={() => viewerRef.current?.select(defaultIdx)}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-star" />
              </svg>
              <span className="side-nav-text">
                <span className="side-nav-label">{strings.nav.featured}</span>
              </span>
            </button>
          </li>
          {volCategories.map((cat) => {
            const label = t(cat.label);
            const sub = format(strings.sidebar.count[volume], { n: cat.count });
            if (cat.specimen) {
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    className="side-nav-btn"
                    title={label}
                    onClick={() => viewerRef.current?.select(cat.specimen)}
                  >
                    <svg className="ico" aria-hidden="true">
                      <use href={`#${cat.icon}`} />
                    </svg>
                    <span className="side-nav-text">
                      <span className="side-nav-label">{label}</span>
                      <small>{sub}</small>
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li key={cat.slug}>
                <Link
                  to={`/collections/${cat.slug}`}
                  className="side-nav-btn"
                  title={label}
                >
                  <svg className="ico" aria-hidden="true">
                    <use href={`#${cat.icon}`} />
                  </svg>
                  <span className="side-nav-text">
                    <span className="side-nav-label">{label}</span>
                    <small>{sub}</small>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="feature">
          <div className="eyebrow">{strings.sidebar.featuredEyebrow[volume]}</div>
          <img id="featImg" alt="" width="92" height="76" decoding="async" />
          <h3 id="featTitle" />
          <p id="featText" />
        </div>
      </aside>

      <section className="main">
        <div
          id="tabs"
          className="tabs"
          role="tablist"
          aria-label={strings.tabs[volume]}
        >
          {volSpecimens.map((spec, idx) => (
            <button
              key={spec.id}
              ref={(node) => {
                tabRefs.current[idx] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${spec.id}`}
              className="tab"
              data-no={String(idx + 1).padStart(2, "0")}
              aria-selected={spec.id === activeId}
              tabIndex={spec.id === activeId ? 0 : -1}
              onClick={() => viewerRef.current?.select(idx)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
            >
              <img
                src={imageUrl(spec, "thumb")}
                alt=""
                width="58"
                height="52"
                decoding="async"
                onError={(e) => handleSpecimenImageError(e.currentTarget, spec)}
              />
              <span className="tab-text">
                <b>{t(spec.name)}</b>
                <i>{spec.latin}</i>
              </span>
            </button>
          ))}
        </div>

        <div
          id="stage"
          className="stage"
          tabIndex={0}
          aria-label={strings.viewer.stage[volume]}
        >
          <div className="plate" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="ground" aria-hidden="true" />
          <div id="fallback" className="fallback" aria-hidden="true" />
          <div id="loader" className="loader" role="status" aria-live="polite">
            <span id="loaderText">{strings.viewer.loader}</span>
          </div>

          <div id="viewerError" className="stage-panel stage-panel-error" role="alert">
            <p id="errorTitle" className="stage-panel-title">{strings.viewer.errorTitle}</p>
            <p id="errorText" className="stage-panel-text">{strings.viewer.errorText}</p>
            <button
              type="button"
              id="retryBtn"
              className="stage-panel-btn"
              onClick={() => viewerRef.current?.retry()}
            >
              {strings.viewer.retry}
            </button>
          </div>

          <div id="viewerGate" className="stage-panel stage-panel-gate">
            <p id="gateTitle" className="stage-panel-title">{strings.viewer.gateTitle}</p>
            <p id="gateText" className="stage-panel-text">{strings.viewer.gateText}</p>
            <button
              type="button"
              id="gateBtn"
              className="stage-panel-btn"
              onClick={() => viewerRef.current?.loadGated()}
            >
              {strings.viewer.gateButton}
            </button>
          </div>

          <div className="hint" aria-hidden="true">
            <svg className="ico">
              <use href="#i-hand" />
            </svg>
            <span>{strings.viewer.hint}</span>
          </div>

          <div className="rail" role="toolbar" aria-label={strings.viewer.tools}>
            <button
              type="button"
              id="zoomIn"
              className="on"
              aria-label={strings.viewer.zoomIn}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-plus" />
              </svg>
            </button>
            <button
              type="button"
              id="zoomOut"
              aria-label={strings.viewer.zoomOut}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-search" />
              </svg>
            </button>
            <button
              type="button"
              id="expand"
              aria-pressed="false"
              aria-label={strings.viewer.expand}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-expand" />
              </svg>
            </button>
            <button
              type="button"
              id="light"
              aria-pressed={light === "dusk"}
              aria-label={
                light === "dusk" ? strings.viewer.toDay : strings.viewer.toDusk
              }
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-sun" />
              </svg>
            </button>
          </div>

          <div className="turn">
            <button
              type="button"
              id="turnL"
              aria-label={strings.viewer.turnLeft}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-ccw" />
              </svg>
            </button>
            <button
              type="button"
              id="turnFull"
              aria-label={strings.viewer.turnFull}
            >
              360°
            </button>
            <button
              type="button"
              id="turnR"
              aria-label={strings.viewer.turnRight}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-cw" />
              </svg>
            </button>
          </div>

          <div id="scale" className="scale" aria-hidden="true" />
          <p id="caption" className="caption" />
        </div>
      </section>

      <section className="info">
        <div className="top">
          <Link to="/" className="phone-brand">
            {brand.name}
          </Link>

          <div className="search-wrap" data-open="false">
            <button
              type="button"
              className="shell-iconbtn search-toggle-btn"
              aria-label={strings.search.label}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-search" />
              </svg>
            </button>
            <label className="search">
              <svg className="ico" aria-hidden="true">
                <use href="#i-search" />
              </svg>
              <input
                id="atlasSearch"
                type="search"
                autoComplete="off"
                placeholder={strings.search.placeholder[volume]}
                aria-label={strings.search.label}
              />
            </label>
            <div
              id="searchResults"
              className="search-results"
              role="listbox"
              hidden
            />
          </div>

          <LanguageToggle />

          <Link
            to="/notes"
            className="shell-iconbtn"
            aria-label={strings.nav.notes}
          >
            <svg className="ico" aria-hidden="true">
              <use href="#i-bell" />
            </svg>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="shell-iconbtn"
            aria-label={strings.nav.menu}
            onClick={(e) => onOpenMenu(e.currentTarget)}
          >
            <span className="shell-avatar" aria-hidden="true">
              <svg className="ico">
                <use href="#i-user" />
              </svg>
            </span>
          </button>
        </div>

        <div className="card">
          <article id="detail" className="detail" aria-live="polite" />
        </div>
      </section>
    </main>
  );
}
