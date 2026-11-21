import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../../../content/assets.js";

const DRACO_PATH = "/draco/gltf/";
const STALL_MS = 45000;
const AUTO_RETRY_MS = 1500;

async function fetchGlb(url, signal, onProgress) {
  const guard = new AbortController();
  const stop = () => guard.abort();
  signal.addEventListener("abort", stop, { once: true });
  let timer = 0;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(stop, STALL_MS);
  };
  try {
    arm();
    const res = await fetch(url, { signal: guard.signal });
    if (!res.ok) throw Object.assign(new Error("http"), { status: res.status });
    const total = Number(res.headers.get("content-length")) || 0;
    if (!res.body) {
      const buffer = await res.arrayBuffer();
      onProgress?.(100);
      return buffer;
    }
    const reader = res.body.getReader();
    const parts = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      loaded += value.length;
      arm();
      onProgress?.(total ? Math.min(99, Math.round((loaded / total) * 100)) : null);
    }
    const out = new Uint8Array(loaded);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out.buffer;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", stop);
  }
}

function waitMs(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function createRigLoader(scene, maxAnisotropy) {
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  function createRig(specimen) {
    const pivot = new THREE.Group();
    const spin = new THREE.Group();
    const holder = new THREE.Group();
    pivot.add(spin);
    spin.add(holder);
    pivot.visible = false;
    scene.add(pivot);

    const home = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(specimen.pitch, specimen.yaw, 0, "YXZ")
    );
    spin.quaternion.copy(home);

    return {
      specimen,
      pivot,
      spin,
      holder,
      home,
      loaded: false,
      failed: false,
      consented: false,
      errorStatus: 0,
      abort: null,
      promise: null,
    };
  }

  function applyModel(rig, gltf) {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = sphere.radius || 1;

    model.position.sub(sphere.center);
    rig.holder.clear();
    rig.holder.scale.setScalar(1 / radius);
    rig.holder.add(model);

    model.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of mats) {
          if (!mat) continue;
          mat.envMapIntensity = 1;
          if (mat.map) {
            mat.map.anisotropy = maxAnisotropy;
          }
        }
      }
    });

    rig.loaded = true;
    rig.failed = false;
    rig.errorStatus = 0;
  }

  function loadRig(rig, onProgress) {
    if (rig.promise) return rig.promise;
    const url = modelUrl(rig.specimen);

    const controller = new AbortController();
    rig.abort = controller;

    rig.promise = (async () => {
      let attempt = 0;
      for (;;) {
        try {
          const buffer = await fetchGlb(url, controller.signal, onProgress);
          if (controller.signal.aborted) {
            rig.promise = null;
            return rig;
          }
          const gltf = await gltfLoader.parseAsync(buffer, "");
          if (controller.signal.aborted) {
            rig.promise = null;
            return rig;
          }
          applyModel(rig, gltf);
          return rig;
        } catch (error) {
          if (controller.signal.aborted) {
            rig.promise = null;
            return rig;
          }
          const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
          if (status !== 404 && attempt === 0) {
            attempt += 1;
            try {
              await waitMs(AUTO_RETRY_MS, controller.signal);
              continue;
            } catch {
              rig.promise = null;
              return rig;
            }
          }
          rig.failed = true;
          rig.promise = null;
          rig.errorStatus = status;
          return rig;
        }
      }
    })();

    return rig.promise;
  }

  function retryRig(rig, onProgress) {
    rig.abort?.abort();
    rig.failed = false;
    rig.errorStatus = 0;
    rig.promise = null;
    return loadRig(rig, onProgress);
  }

  function disposeRig(rig) {
    rig.abort?.abort();
    rig.holder.traverse((node) => {
      if (node.isMesh) {
        node.geometry?.dispose();
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of mats) {
          if (!mat) continue;
          for (const key of Object.keys(mat)) {
            const val = mat[key];
            if (val && typeof val === "object" && val.isTexture) {
              val.dispose();
            }
          }
          mat.dispose();
        }
      }
    });
    scene.remove(rig.pivot);
  }

  function disposeLoader() {
    draco.dispose();
  }

  return { createRig, loadRig, retryRig, disposeRig, disposeLoader };
}
