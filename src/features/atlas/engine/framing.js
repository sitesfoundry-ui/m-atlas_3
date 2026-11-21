import * as THREE from "three";

const FOV_TAN = Math.tan(THREE.MathUtils.degToRad(26 / 2));

export function createFraming(heroEl, stageEl, renderer, camera) {
  const goal = { cx: 1, cy: 1, px: 100, sw: 300, W: 1, H: 1 };
  const view = { cx: 1, cy: 1, px: 100 };
  let snapped = false;

  function measure(isFocus) {
    const h = heroEl.getBoundingClientRect();
    const s = isFocus ? h : stageEl.getBoundingClientRect();
    const W = Math.max(1, h.width);
    const H = Math.max(1, h.height);

    goal.W = W;
    goal.H = H;
    goal.cx = s.left - h.left + s.width / 2;
    goal.cy = s.top - h.top + s.height * (isFocus ? 0.5 : 0.44);
    goal.px = Math.max(40, Math.min(s.width * 0.5, s.height * 0.6) * 1.16);
    goal.sw = Math.max(1, s.width);

    if (!snapped) {
      view.cx = goal.cx;
      view.cy = goal.cy;
      view.px = goal.px;
      snapped = true;
    }

    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  function update(dt, zoom) {
    const f = 1 - Math.exp(-dt * 7);
    view.cx += (goal.cx - view.cx) * f;
    view.cy += (goal.cy - view.cy) * f;
    view.px += (goal.px - view.px) * f;

    const W = goal.W;
    const H = goal.H;
    camera.position.z = H / (2 * FOV_TAN * view.px * zoom);
    camera.setViewOffset(W, H, W / 2 - view.cx, H / 2 - view.cy, W, H);
  }

  return {
    measure,
    update,
    get view() {
      return view;
    },
    get goal() {
      return goal;
    },
  };
}
