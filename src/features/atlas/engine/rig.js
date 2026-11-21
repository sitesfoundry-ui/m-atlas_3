import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../../../content/assets.js";

const DRACO_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

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
      promise: null,
    };
  }

  function loadRig(rig, onProgress) {
    if (rig.promise) return rig.promise;
    const url = modelUrl(rig.specimen);

    rig.promise = new Promise((resolve) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const sphere = new THREE.Sphere();
          box.getBoundingSphere(sphere);
          const radius = sphere.radius || 1;

          model.position.sub(sphere.center);
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
          resolve(rig);
        },
        (evt) => {
          if (evt && evt.lengthComputable && evt.total > 0) {
            onProgress?.(Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
          } else {
            onProgress?.(null);
          }
        },
        () => {
          rig.failed = true;
          resolve(rig);
        }
      );
    });

    return rig.promise;
  }

  function disposeRig(rig) {
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

  return { createRig, loadRig, disposeRig, disposeLoader };
}
