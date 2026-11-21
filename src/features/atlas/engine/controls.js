import * as THREE from "three";

const WORLD_Y = new THREE.Vector3(0, 1, 0);
const WORLD_X = new THREE.Vector3(1, 0, 0);
const _qY = new THREE.Quaternion();
const _qX = new THREE.Quaternion();

export function createControls({
  heroEl,
  stageEl,
  framing,
  getActiveRig,
  getStrings,
  onToggleFocus,
  onToggleLight,
  onZoomChange,
}) {
  let zoom = 1;
  let zoomGoal = 1;
  let yawQueue = 0;
  let homing = false;
  let lastTouch = performance.now() - 5000;
  let velX = 0;
  let velY = 0;

  const pointers = new Map();
  let dragging = false;
  let lastPinchDist = 0;

  const zoomInBtn = heroEl.querySelector("#zoomIn");
  const zoomOutBtn = heroEl.querySelector("#zoomOut");
  const expandBtn = heroEl.querySelector("#expand");
  const lightBtn = heroEl.querySelector("#light");
  const turnLBtn = heroEl.querySelector("#turnL");
  const turnRBtn = heroEl.querySelector("#turnR");
  const turnFullBtn = heroEl.querySelector("#turnFull");

  function touched() {
    lastTouch = performance.now();
    homing = false;
    heroEl.classList.add("touched");
  }

  function syncZoomUI() {
    zoomInBtn?.classList.toggle("on", zoomGoal >= 1);
    zoomOutBtn?.classList.toggle("on", zoomGoal < 1);
    const closeupBtn = heroEl.querySelector("#closeup");
    if (closeupBtn) {
      closeupBtn.setAttribute("aria-pressed", zoomGoal > 2.2 ? "true" : "false");
    }
    onZoomChange?.(zoomGoal);
  }

  function setZoom(next) {
    zoomGoal = THREE.MathUtils.clamp(next, 0.55, 3.4);
    syncZoomUI();
  }

  function turnBy(dx, dy) {
    const rig = getActiveRig();
    if (!rig) return;
    _qY.setFromAxisAngle(WORLD_Y, dx);
    _qX.setFromAxisAngle(WORLD_X, dy);
    rig.spin.quaternion.premultiply(_qY).premultiply(_qX).normalize();
  }

  function resetHome() {
    homing = true;
    yawQueue = 0;
    velX = 0;
    velY = 0;
    setZoom(1);
  }

  function clearMotion() {
    velX = 0;
    velY = 0;
    yawQueue = 0;
    homing = false;
  }

  function pinchDistance() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  function onPointerDown(e) {
    if (e.target.closest("button, a, input")) return;
    touched();
    stageEl.focus({ preventScroll: true });
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      stageEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (pointers.size === 1) {
      dragging = true;
      velX = 0;
      velY = 0;
      yawQueue = 0;
      stageEl.classList.add("dragging");
    } else if (pointers.size === 2) {
      dragging = false;
      stageEl.classList.remove("dragging");
      lastPinchDist = pinchDistance();
    }
  }

  function onPointerMove(e) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    const dxPx = e.clientX - prev.x;
    const dyPx = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const dist = pinchDistance();
      if (lastPinchDist > 0 && dist > 0) {
        setZoom(zoomGoal * (dist / lastPinchDist));
      }
      lastPinchDist = dist;
      return;
    }

    if (dragging && pointers.size === 1) {
      touched();
      const k = Math.PI / Math.max(260, framing.view.px * 1.6);
      const rx = dxPx * k;
      const ry = dyPx * k;
      turnBy(rx, ry);
      velX = rx * 60;
      velY = ry * 60;
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = 0;
    if (pointers.size === 0) {
      dragging = false;
      stageEl.classList.remove("dragging");
    }
  }

  function onWheel(e) {
    e.preventDefault();
    touched();
    const factor = e.ctrlKey ? 0.01 : 0.0016;
    setZoom(zoomGoal * Math.exp(-e.deltaY * factor));
  }

  function onDblClick(e) {
    if (e.target.closest("button, a")) return;
    touched();
    resetHome();
  }

  function onStageKeyDown(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      touched();
      turnBy(-0.18, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      touched();
      turnBy(0.18, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      touched();
      turnBy(0, -0.18);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      touched();
      turnBy(0, 0.18);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      touched();
      setZoom(zoomGoal * 1.2);
    } else if (e.key === "-") {
      e.preventDefault();
      touched();
      setZoom(zoomGoal / 1.2);
    } else if (e.key === "0") {
      e.preventDefault();
      touched();
      resetHome();
    }
  }

  function onGlobalKeyDown(e) {
    if (e.key === "Escape" && heroEl.classList.contains("focus")) {
      onToggleFocus(false);
    }
  }

  const onZoomIn = () => {
    touched();
    setZoom(zoomGoal * 1.35);
  };
  const onZoomOut = () => {
    touched();
    setZoom(zoomGoal / 1.35);
  };
  const onExpand = () => {
    touched();
    onToggleFocus();
  };
  const onLight = () => {
    touched();
    onToggleLight();
  };
  const onTurnL = () => {
    touched();
    yawQueue -= Math.PI / 2;
  };
  const onTurnR = () => {
    touched();
    yawQueue += Math.PI / 2;
  };
  const onTurnFull = () => {
    touched();
    yawQueue += Math.PI * 2;
  };

  stageEl.addEventListener("pointerdown", onPointerDown);
  stageEl.addEventListener("pointermove", onPointerMove);
  stageEl.addEventListener("pointerup", onPointerUp);
  stageEl.addEventListener("pointercancel", onPointerUp);
  stageEl.addEventListener("wheel", onWheel, { passive: false });
  stageEl.addEventListener("dblclick", onDblClick);
  stageEl.addEventListener("keydown", onStageKeyDown);
  window.addEventListener("keydown", onGlobalKeyDown);

  zoomInBtn?.addEventListener("click", onZoomIn);
  zoomOutBtn?.addEventListener("click", onZoomOut);
  expandBtn?.addEventListener("click", onExpand);
  lightBtn?.addEventListener("click", onLight);
  turnLBtn?.addEventListener("click", onTurnL);
  turnRBtn?.addEventListener("click", onTurnR);
  turnFullBtn?.addEventListener("click", onTurnFull);

  syncZoomUI();

  function step(dt, now, reducedMotion) {
    zoom += (zoomGoal - zoom) * (1 - Math.exp(-dt * 6));

    const rig = getActiveRig();
    if (!rig) return { zoom, idle: 0 };

    if (homing) {
      rig.spin.quaternion.slerp(rig.home, 1 - Math.exp(-dt * 6));
      if (rig.spin.quaternion.angleTo(rig.home) < 0.002) {
        rig.spin.quaternion.copy(rig.home);
        homing = false;
      }
    } else {
      if (!dragging && (Math.abs(velX) > 1e-4 || Math.abs(velY) > 1e-4)) {
        turnBy(velX * dt, velY * dt);
        const decay = Math.exp(-dt * 4.5);
        velX *= decay;
        velY *= decay;
      }
      if (Math.abs(yawQueue) > 1e-4) {
        const stepYaw = yawQueue * (1 - Math.exp(-dt * 4.2));
        turnBy(stepYaw, 0);
        yawQueue -= stepYaw;
      }
    }

    const idle = reducedMotion
      ? 0
      : THREE.MathUtils.clamp((now - lastTouch - 1800) / 1500, 0, 1);

    return { zoom, idle };
  }

  function updateFocusLabels(isFocus) {
    const strings = getStrings();
    if (!expandBtn) return;
    expandBtn.classList.toggle("on", isFocus);
    expandBtn.setAttribute("aria-pressed", isFocus ? "true" : "false");
    expandBtn.setAttribute(
      "aria-label",
      isFocus ? strings.viewer.collapse : strings.viewer.expand
    );
  }

  function updateLightLabels(light) {
    const strings = getStrings();
    if (!lightBtn) return;
    const isDusk = light === "dusk";
    lightBtn.classList.toggle("on", isDusk);
    lightBtn.setAttribute("aria-pressed", isDusk ? "true" : "false");
    lightBtn.setAttribute(
      "aria-label",
      isDusk ? strings.viewer.toDay : strings.viewer.toDusk
    );
  }

  function destroy() {
    stageEl.removeEventListener("pointerdown", onPointerDown);
    stageEl.removeEventListener("pointermove", onPointerMove);
    stageEl.removeEventListener("pointerup", onPointerUp);
    stageEl.removeEventListener("pointercancel", onPointerUp);
    stageEl.removeEventListener("wheel", onWheel);
    stageEl.removeEventListener("dblclick", onDblClick);
    stageEl.removeEventListener("keydown", onStageKeyDown);
    window.removeEventListener("keydown", onGlobalKeyDown);

    zoomInBtn?.removeEventListener("click", onZoomIn);
    zoomOutBtn?.removeEventListener("click", onZoomOut);
    expandBtn?.removeEventListener("click", onExpand);
    lightBtn?.removeEventListener("click", onLight);
    turnLBtn?.removeEventListener("click", onTurnL);
    turnRBtn?.removeEventListener("click", onTurnR);
    turnFullBtn?.removeEventListener("click", onTurnFull);
  }

  return {
    step,
    setZoom,
    getZoomGoal: () => zoomGoal,
    resetHome,
    clearMotion,
    syncZoomUI,
    updateFocusLabels,
    updateLightLabels,
    touched,
    destroy,
  };
}
