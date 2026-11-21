import * as THREE from "three";
import { canPrefetchNext, isDeviceGated, modelUrl } from "../../../content/assets.js";
import { format } from "../../../i18n/index.js";
import { createControls } from "./controls.js";
import { createFraming } from "./framing.js";
import { createInfoPainter } from "./info.js";
import { createRigLoader } from "./rig.js";
import { createSearch } from "./search.js";
import { createViewerScene } from "./scene.js";

const DUR = 780;
const PREFETCH_DELAY_MS = 4000;

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
    onRecreate,
  }
) {
  let locale = initialLocale;
  let strings = initialStrings;
  let light = initialLight;
  let activeIndex = initialIndex;
  let isFocus = false;
  let destroyed = false;
  let contextLost = false;
  let prefetched = false;
  let prefetchTimer = 0;
  let prefetchIdleId = 0;
  let prefetchAbort = null;

  const canvas = root.querySelector("#gl");
  const stageEl = root.querySelector("#stage");
  const loaderEl = root.querySelector("#loader");
  const loaderTextEl = root.querySelector("#loaderText");
  const errorTitleEl = root.querySelector("#errorTitle");
  const errorTextEl = root.querySelector("#errorText");
  const retryBtnEl = root.querySelector("#retryBtn");
  const gateTitleEl = root.querySelector("#gateTitle");
  const gateTextEl = root.querySelector("#gateText");
  const gateBtnEl = root.querySelector("#gateBtn");

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
  } catch (error) {
    console.error("[atlas] viewer init failed", error);
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

  function syncPanelText() {
    if (errorTitleEl) errorTitleEl.textContent = strings.viewer.errorTitle;
    if (errorTextEl) errorTextEl.textContent = strings.viewer.errorText;
    if (retryBtnEl) retryBtnEl.textContent = strings.viewer.retry;
    if (gateTitleEl) gateTitleEl.textContent = strings.viewer.gateTitle;
    if (gateTextEl) gateTextEl.textContent = strings.viewer.gateText;
    if (gateBtnEl) gateBtnEl.textContent = strings.viewer.gateButton;
  }

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

  function schedulePrefetchNext() {
    if (prefetched || !canPrefetchNext() || specimens.length < 2) return;
    const nextSpec = specimens[(activeIndex + 1) % specimens.length];
    if (!nextSpec || nextSpec.id === specimens[activeIndex].id) return;
    prefetched = true;

    const triggerFetch = () => {
      if (destroyed || contextLost || !canPrefetchNext()) return;
      prefetchAbort = new AbortController();
      fetch(modelUrl(nextSpec), {
        priority: "low",
        signal: prefetchAbort.signal,
      }).catch(() => {});
    };

    prefetchTimer = window.setTimeout(() => {
      prefetchTimer = 0;
      if (destroyed) return;
      if (typeof window.requestIdleCallback === "function") {
        prefetchIdleId = window.requestIdleCallback(triggerFetch, { timeout: PREFETCH_DELAY_MS });
      } else {
        triggerFetch();
      }
    }, PREFETCH_DELAY_MS);
  }

  async function startRigLoad(rig, seq, targetIdx, { isBoot = false, isRetry = false } = {}) {
    stageEl.classList.remove("failed", "gated");
    setLoader(true, null);

    const onProg = (pct) => {
      if (seq === selectSeq && !destroyed) setLoader(true, pct);
    };

    const result = isRetry
      ? await rigLoader.retryRig(rig, onProg)
      : await rigLoader.loadRig(rig, onProg);

    if (seq !== selectSeq || destroyed || contextLost) return;

    setLoader(false);
    stageEl.classList.remove("switching");

    if (result.failed) {
      syncPanelText();
      stageEl.classList.add("failed");
    } else {
      rig.spin.quaternion.copy(rig.home);
      rig.pivot.visible = true;
      const dur = reducedMotion() ? 1 : DUR;
      if (isBoot || !anim) {
        anim = { from: -1, to: targetIdx, dir: 1, t0: performance.now(), t1: performance.now(), dur };
      } else {
        anim.to = targetIdx;
        anim.t1 = performance.now();
      }
      schedulePrefetchNext();
    }
  }

  function shouldGateRig(rig) {
    return isDeviceGated() && !rig.loaded && !rig.consented;
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

    if (!sceneCtx || !rigLoader || contextLost) {
      setLoader(false);
      stageEl.classList.remove("switching", "gated");
      syncPanelText();
      stageEl.classList.add("failed");
      return;
    }

    controls.clearMotion();
    controls.setZoom(1);

    const nextRig = rigs[targetIdx];
    const dur = reducedMotion() ? 1 : DUR;
    const now = performance.now();

    if (shouldGateRig(nextRig)) {
      if (rigs[fromIdx]) {
        rigs[fromIdx].pivot.visible = false;
      }
      anim = null;
      setLoader(false);
      stageEl.classList.remove("switching", "failed");
      syncPanelText();
      stageEl.classList.add("gated");
      return;
    }

    stageEl.classList.add("switching");
    stageEl.classList.remove("failed", "gated");
    anim = { from: fromIdx, to: -1, dir, t0: now, t1: now, dur };

    await startRigLoad(nextRig, seq, targetIdx, { isBoot: false });
  }

  async function retry() {
    if (destroyed) return;
    if (!sceneCtx || !rigLoader || contextLost) {
      onRecreate?.();
      return;
    }
    const rig = rigs[activeIndex];
    if (!rig) return;
    rig.consented = true;
    const seq = ++selectSeq;
    await startRigLoad(rig, seq, activeIndex, { isBoot: true, isRetry: true });
  }

  async function loadGated() {
    if (destroyed) return;
    if (!sceneCtx || !rigLoader || contextLost) {
      onRecreate?.();
      return;
    }
    const rig = rigs[activeIndex];
    if (!rig) return;
    rig.consented = true;
    const seq = ++selectSeq;
    await startRigLoad(rig, seq, activeIndex, { isBoot: true });
  }

  // Boot: paint info immediately, measure, start loop, load active model (unless gated)
  infoPainter.paint(specimens[activeIndex], volume, strings, locale, { instant: true });
  syncPanelText();
  updateTabAttributes(activeIndex);
  controls.updateFocusLabels(isFocus);
  controls.updateLightLabels(light);
  framing.measure(isFocus);

  const bootRig = rigs[activeIndex];
  if (!sceneCtx || !rigLoader || !bootRig) {
    setLoader(false);
    stageEl.classList.remove("gated");
    stageEl.classList.add("failed");
  } else if (shouldGateRig(bootRig)) {
    setLoader(false);
    stageEl.classList.remove("failed");
    stageEl.classList.add("gated");
  } else {
    startRigLoad(bootRig, selectSeq, activeIndex, { isBoot: true });
  }

  function renderFrame(now) {
    if (destroyed || contextLost || !sceneCtx) {
      rafId = 0;
      return;
    }
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
    if (!sceneCtx || contextLost) return;
    if (!rafId && !destroyed && !document.hidden) {
      prevNow = performance.now();
      rafId = requestAnimationFrame(renderFrame);
    }
  }

  startLoop();

  const onContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    setLoader(false);
    stageEl.classList.remove("switching", "gated");
    syncPanelText();
    stageEl.classList.add("failed");
  };

  const onContextRestored = () => {
    onRecreate?.();
  };

  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

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
    syncPanelText();
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
    if (prefetchTimer) clearTimeout(prefetchTimer);
    if (prefetchIdleId && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(prefetchIdleId);
    }
    prefetchAbort?.abort();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
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
    retry,
    loadGated,
  };
}
