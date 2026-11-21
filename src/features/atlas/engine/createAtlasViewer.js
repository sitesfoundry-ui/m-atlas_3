import * as THREE from "three";
import { isMobileGpuTarget, modelUrl } from "../../../content/assets.js";
import { format } from "../../../i18n/index.js";
import { createControls } from "./controls.js";
import { createFraming } from "./framing.js";
import { createInfoPainter } from "./info.js";
import { createRigLoader } from "./rig.js";
import { createSearch } from "./search.js";
import { createViewerScene } from "./scene.js";

const DUR = 780;

function inCubic(t) {
  return t * t * t;
}

function outCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function outBack(t) {
  return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
}

export function createAtlasViewer(
  root,
  {
    volume,
    specimens,
    initialIndex = 0,
    locale: initialLocale,
    strings: initialStrings,
    light: initialLight = "day",
    onSelectSpecimen,
    onNavigate,
    onToggleLight,
  }
) {
  let locale = initialLocale;
  let strings = initialStrings;
  let light = initialLight;
  let activeIndex = initialIndex;
  let isFocus = false;
  let destroyed = false;
  let prefetched = false;

  const canvas = root.querySelector("#gl");
  const stageEl = root.querySelector("#stage");
  const loaderEl = root.querySelector("#loader");
  const loaderTextEl = root.querySelector("#loaderText");

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let sceneCtx = null;
  let rigLoader = null;
  let framing = {
    measure() {},
    update() {},
    view: { cx: 1, cy: 1, px: 200 },
    goal: { sw: 300 },
  };
  let rigs = [];

  try {
    sceneCtx = createViewerScene(canvas, light);
    const maxAniso = sceneCtx.renderer.capabilities.getMaxAnisotropy();
    rigLoader = createRigLoader(sceneCtx.scene, maxAniso);
    framing = createFraming(root, stageEl, sceneCtx.renderer, sceneCtx.camera);
    rigs = specimens.map((s) => rigLoader.createRig(s));
  } catch {
    sceneCtx = null;
    rigLoader = null;
    rigs = [];
  }

  let anim = null;
  let selectSeq = 0;
  let rafId = 0;
  let prevNow = performance.now();

  const controls = createControls({
    heroEl: root,
    stageEl,
    framing,
    getActiveRig: () => rigs[activeIndex],
    getStrings: () => strings,
    onToggleFocus: (force) => {
      isFocus = typeof force === "boolean" ? force : !isFocus;
      root.classList.toggle("focus", isFocus);
      controls.updateFocusLabels(isFocus);
      framing.measure(isFocus);
    },
    onToggleLight: () => {
      onToggleLight?.();
    },
  });

  const infoPainter = createInfoPainter(root, {
    getZoomGoal: () => controls.getZoomGoal(),
    onToggleCloseup: () => {
      controls.touched();
      const current = controls.getZoomGoal();
      controls.setZoom(current > 2.2 ? 1 : 2.6);
    },
  });

  const search = createSearch({
    heroEl: root,
    volume,
    getLocale: () => locale,
    getStrings: () => strings,
    onSelectLocal: (id) => {
      const idx = specimens.findIndex((s) => s.id === id);
      if (idx >= 0) select(idx);
    },
    onNavigate: (path) => onNavigate?.(path),
  });

  function setLoader(show, pct = null) {
    if (!loaderEl) return;
    loaderEl.classList.toggle("show", show);
    if (loaderTextEl) {
      loaderTextEl.textContent =
        typeof pct === "number"
          ? format(strings.viewer.loaderPct, { pct })
          : strings.viewer.loader;
    }
  }

  function updateTabAttributes(selectedIdx) {
    const tabButtons = root.querySelectorAll('.tabs [role="tab"]');
    tabButtons.forEach((btn, idx) => {
      const selected = idx === selectedIdx;
      btn.setAttribute("aria-selected", selected ? "true" : "false");
      btn.setAttribute("tabindex", selected ? "0" : "-1");
    });
  }

  function maybePrefetchOthers() {
    if (prefetched || isMobileGpuTarget()) return;
    const conn = navigator.connection;
    if (conn) {
      if (conn.saveData) return;
      if (conn.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) {
        return;
      }
    }
    prefetched = true;
    for (let i = 0; i < specimens.length; i++) {
      if (i !== activeIndex) {
        fetch(modelUrl(specimens[i]), { priority: "low" }).catch(() => {});
      }
    }
  }

  async function select(nextIdxOrId) {
    const targetIdx =
      typeof nextIdxOrId === "number"
        ? nextIdxOrId
        : specimens.findIndex((s) => s.id === nextIdxOrId);

    if (targetIdx < 0 || targetIdx >= specimens.length || targetIdx === activeIndex) return;

    const seq = ++selectSeq;
    const fromIdx = activeIndex;
    const dir = Math.sign(targetIdx - fromIdx);
    activeIndex = targetIdx;

    updateTabAttributes(targetIdx);
    onSelectSpecimen?.(specimens[targetIdx].id);

    infoPainter.paint(specimens[targetIdx], volume, strings, locale, { instant: false });

    if (!sceneCtx || !rigLoader) {
      setLoader(false);
      stageEl.classList.remove("switching");
      stageEl.classList.add("failed");
      return;
    }

    stageEl.classList.add("switching");
    stageEl.classList.remove("failed");
    controls.clearMotion();
    controls.setZoom(1);

    const dur = reducedMotion() ? 1 : DUR;
    const now = performance.now();
    anim = { from: fromIdx, to: -1, dir, t0: now, t1: now, dur };

    const nextRig = rigs[targetIdx];
    if (!nextRig.loaded && !nextRig.failed) {
      setLoader(true, null);
    }

    await rigLoader.loadRig(nextRig, (pct) => {
      if (seq === selectSeq && !destroyed) setLoader(true, pct);
    });

    if (seq !== selectSeq || destroyed) return;

    setLoader(false);
    stageEl.classList.remove("switching");

    if (nextRig.failed) {
      stageEl.classList.add("failed");
    } else {
      nextRig.spin.quaternion.copy(nextRig.home);
      nextRig.pivot.visible = true;
      anim.to = targetIdx;
      anim.t1 = performance.now();
    }
  }

  // Boot: paint info immediately, measure, start loop, load active model in parallel
  infoPainter.paint(specimens[activeIndex], volume, strings, locale, { instant: true });
  updateTabAttributes(activeIndex);
  controls.updateFocusLabels(isFocus);
  controls.updateLightLabels(light);
  framing.measure(isFocus);

  const bootRig = rigs[activeIndex];
  if (!sceneCtx || !rigLoader || !bootRig) {
    setLoader(false);
    stageEl.classList.add("failed");
  } else {
    setLoader(true, null);
    rigLoader
      .loadRig(bootRig, (pct) => {
        if (!destroyed && !bootRig.loaded) setLoader(true, pct);
      })
      .then(() => {
        if (destroyed) return;
        setLoader(false);
        if (bootRig.failed) {
          stageEl.classList.add("failed");
        } else {
          bootRig.spin.quaternion.copy(bootRig.home);
          bootRig.pivot.visible = true;
          const dur = reducedMotion() ? 1 : DUR;
          anim = { from: -1, to: activeIndex, dir: 1, t0: performance.now(), t1: performance.now(), dur };
          maybePrefetchOthers();
        }
      });
  }

  function renderFrame(now) {
    if (destroyed) return;
    if (document.hidden) {
      rafId = 0;
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, (now - prevNow) / 1000));
    prevNow = now;
    const s = now / 1000;
    const reduced = reducedMotion();

    sceneCtx.updateLights(1 - Math.exp(-dt * 4));
    const { zoom, idle } = controls.step(dt, now, reduced);
    framing.update(dt, zoom);

    const slide = framing.goal.sw * 0.95 / Math.max(1, framing.view.px);

    for (let i = 0; i < rigs.length; i++) {
      const rig = rigs[i];
      if (!rig.loaded) continue;

      let k = 1;
      let x = 0;
      let twist = 0;
      let visible = i === activeIndex && (!anim || anim.to === i);

      if (anim) {
        if (anim.from === i) {
          const outDur = anim.dur * 0.6;
          const p = Math.min(1, (now - anim.t0) / outDur);
          if (p < 1) {
            const e = inCubic(p);
            k = Math.max(0.0001, 1 - e);
            x = -anim.dir * e * slide;
            twist = -anim.dir * e * 1.4;
            visible = true;
          } else {
            visible = false;
            anim.from = -1;
          }
        } else if (anim.to === i) {
          const p = Math.min(1, (now - anim.t1) / anim.dur);
          if (p < 1) {
            const e = outCubic(p);
            k = Math.max(0.0001, outBack(p) * (0.25 + 0.75 * e));
            x = anim.dir * (1 - e) * slide;
            twist = anim.dir * (1 - e) * 1.6;
            visible = true;
          } else {
            anim.to = -1;
            if (anim.from === -1) anim = null;
          }
        }
      }

      rig.pivot.visible = visible;
      if (visible) {
        const hoverY = reduced ? 0 : Math.sin(s * 1.3 + i) * 0.028;
        const swayX = reduced ? 0 : Math.sin(s * 0.9) * 0.03 * idle;
        const swayY = reduced ? 0 : Math.sin(s * 0.55) * 0.16 * idle;
        rig.pivot.scale.setScalar(k);
        rig.pivot.position.set(x, hoverY, 0);
        rig.pivot.rotation.set(swayX, twist + swayY, 0);
      }
    }

    sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera);
    rafId = requestAnimationFrame(renderFrame);
  }

  function startLoop() {
    if (!sceneCtx) return;
    if (!rafId && !destroyed && !document.hidden) {
      prevNow = performance.now();
      rafId = requestAnimationFrame(renderFrame);
    }
  }

  startLoop();

  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    sceneCtx?.refreshPixelRatio();
    framing.measure(isFocus);
  });
  ro.observe(root);
  ro.observe(stageEl);

  let dprMedia = null;
  function watchDpr() {
    dprMedia?.removeEventListener?.("change", onDprChange);
    dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprMedia.addEventListener?.("change", onDprChange);
  }
  function onDprChange() {
    if (destroyed) return;
    sceneCtx?.refreshPixelRatio();
    framing.measure(isFocus);
    watchDpr();
  }
  watchDpr();

  const onOrientation = () => {
    if (!destroyed) framing.measure(isFocus);
  };
  const onVisibility = () => {
    if (!document.hidden) startLoop();
  };

  window.addEventListener("orientationchange", onOrientation);
  document.addEventListener("visibilitychange", onVisibility);

  function setLocale(nextLocale, nextStrings) {
    locale = nextLocale;
    strings = nextStrings;
    infoPainter.paint(specimens[activeIndex], volume, strings, locale, { instant: true });
    controls.updateFocusLabels(isFocus);
    controls.updateLightLabels(light);
    search.refresh();
  }

  function setLight(nextLight) {
    light = nextLight;
    root.setAttribute("data-light", nextLight);
    sceneCtx?.setLightPreset(nextLight);
    controls.updateLightLabels(nextLight);
  }

  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    dprMedia?.removeEventListener?.("change", onDprChange);
    window.removeEventListener("orientationchange", onOrientation);
    document.removeEventListener("visibilitychange", onVisibility);
    search.destroy();
    controls.destroy();
    infoPainter.destroy();
    if (rigLoader) {
      for (const rig of rigs) {
        rigLoader.disposeRig(rig);
      }
      rigLoader.disposeLoader();
    }
    sceneCtx?.dispose();
  }

  return {
    destroy,
    setLocale,
    select,
    setLight,
  };
}
