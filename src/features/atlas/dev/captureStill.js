import * as THREE from "three";

const CAPTURE_SIZE = 2000;
const CAPTURE_FILL = 0.88; // 6% margin on each side

function collectWorldVertices(rootObj) {
  const pts = [];
  const v = new THREE.Vector3();

  rootObj.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const pos = node.geometry.getAttribute("position");
    if (!pos) return;
    const step = pos.count > 40000 ? Math.ceil(pos.count / 20000) : 1;
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(node.matrixWorld);
      pts.push(v.x, v.y, v.z);
    }
  });

  if (pts.length === 0) {
    const box = new THREE.Box3().setFromObject(rootObj);
    if (!box.isEmpty()) {
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            pts.push(x, y, z);
          }
        }
      }
    }
  }
  return pts;
}

function frameCameraForMargin(camera, holder, fill = CAPTURE_FILL) {
  const pts = collectWorldVertices(holder);
  if (pts.length === 0) {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    return;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < pts.length; i += 3) {
    const x = pts[i];
    const y = pts[i + 1];
    const z = pts[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let cx = (minX + maxX) / 2;
  let cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  let camZ = maxZ + Math.max((maxX - minX) / 2, (maxY - minY) / 2, 0.5) / (fill * tanHalf);

  for (let iter = 0; iter < 3; iter++) {
    let minPx = Infinity;
    let maxPx = -Infinity;
    let minPy = Infinity;
    let maxPy = -Infinity;
    let reqCamZ = maxZ + 0.1;

    for (let i = 0; i < pts.length; i += 3) {
      const dz = Math.max(0.05, camZ - pts[i + 2]);
      const px = (pts[i] - cx) / dz;
      const py = (pts[i + 1] - cy) / dz;
      if (px < minPx) minPx = px;
      if (px > maxPx) maxPx = px;
      if (py < minPy) minPy = py;
      if (py > maxPy) maxPy = py;
    }

    const avgDist = Math.max(0.1, camZ - cz);
    cx += ((minPx + maxPx) / 2) * avgDist;
    cy += ((minPy + maxPy) / 2) * avgDist;

    for (let i = 0; i < pts.length; i += 3) {
      const needX = pts[i + 2] + Math.abs(pts[i] - cx) / (fill * tanHalf);
      const needY = pts[i + 2] + Math.abs(pts[i + 1] - cy) / (fill * tanHalf);
      if (needX > reqCamZ) reqCamZ = needX;
      if (needY > reqCamZ) reqCamZ = needY;
    }
    camZ = reqCamZ;
  }

  camera.near = Math.max(0.01, (camZ - maxZ) * 0.25);
  camera.far = Math.max(100, (camZ - minZ) * 2.5);
  camera.position.set(cx, cy, camZ);
  camera.lookAt(cx, cy, cz);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

export function attachCaptureStill({
  root,
  getSceneCtx,
  getActiveRig,
  getAllRigs,
  onRestoreView,
}) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("capture") !== "1") return () => {};

  const styleEl = document.createElement("style");
  styleEl.dataset.devCapture = "true";
  styleEl.textContent =
    ".dev-capture-hint{position:absolute;left:12px;bottom:8px;z-index:60;font:10px/1.2 monospace;color:var(--muted,#6b6355);opacity:.72;pointer-events:none;user-select:none}";
  document.head.appendChild(styleEl);

  const hintEl = document.createElement("div");
  hintEl.className = "dev-capture-hint";
  hintEl.textContent = "Shift+P: save still";
  root.appendChild(hintEl);

  let resetTimer = 0;
  let busy = false;

  const setHint = (text) => {
    hintEl.textContent = text;
    if (resetTimer) window.clearTimeout(resetTimer);
    if (text !== "Shift+P: save still") {
      resetTimer = window.setTimeout(() => {
        hintEl.textContent = "Shift+P: save still";
      }, 1800);
    }
  };

  const capture = () => {
    if (busy) return;
    const sceneCtx = getSceneCtx();
    const rig = getActiveRig();
    if (!sceneCtx || !rig || !rig.loaded) return;

    busy = true;
    const { renderer, scene, camera } = sceneCtx;
    const allRigs = getAllRigs();

    const prevVisibility = allRigs.map((r) => r.pivot.visible);
    const prevPos = rig.pivot.position.clone();
    const prevRot = rig.pivot.rotation.clone();
    const prevScale = rig.pivot.scale.clone();
    const prevSpinQuat = rig.spin.quaternion.clone();

    const prevSize = new THREE.Vector2();
    renderer.getSize(prevSize);
    const prevPixelRatio = renderer.getPixelRatio();
    const prevClearColor = new THREE.Color();
    renderer.getClearColor(prevClearColor);
    const prevClearAlpha = renderer.getClearAlpha();

    const outCanvas = document.createElement("canvas");
    outCanvas.width = CAPTURE_SIZE;
    outCanvas.height = CAPTURE_SIZE;
    const ctx2d = outCanvas.getContext("2d");

    try {
      for (const r of allRigs) {
        r.pivot.visible = r === rig;
      }
      rig.pivot.position.set(0, 0, 0);
      rig.pivot.rotation.set(0, 0, 0);
      rig.pivot.scale.setScalar(1);
      rig.spin.quaternion.copy(rig.home);
      rig.pivot.updateWorldMatrix(true, true);

      const tempCamera = new THREE.PerspectiveCamera(camera.fov, 1, 0.01, 100);
      frameCameraForMargin(tempCamera, rig.holder, CAPTURE_FILL);

      renderer.setPixelRatio(1);
      renderer.setSize(CAPTURE_SIZE, CAPTURE_SIZE, false);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, tempCamera);

      ctx2d.clearRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
      ctx2d.drawImage(renderer.domElement, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    } finally {
      allRigs.forEach((r, idx) => {
        r.pivot.visible = prevVisibility[idx];
      });
      rig.pivot.position.copy(prevPos);
      rig.pivot.rotation.copy(prevRot);
      rig.pivot.scale.copy(prevScale);
      rig.spin.quaternion.copy(prevSpinQuat);
      rig.pivot.updateWorldMatrix(true, true);

      renderer.setPixelRatio(prevPixelRatio);
      renderer.setSize(prevSize.x, prevSize.y, false);
      renderer.setClearColor(prevClearColor, prevClearAlpha);
      onRestoreView?.();
    }

    const fileId = rig.specimen.id;
    outCanvas.toBlob(
      (blob) => {
        busy = false;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileId}.webp`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setHint(`Saved ${fileId}.webp`);
      },
      "image/webp",
      0.92
    );
  };

  const onKeyDown = (e) => {
    if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== "P" && e.key !== "p") return;
    if (e.target && e.target.closest?.("input, textarea, select")) return;
    e.preventDefault();
    capture();
  };

  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    if (resetTimer) window.clearTimeout(resetTimer);
    hintEl.remove();
    styleEl.remove();
  };
}
