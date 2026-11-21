import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const LIGHT_PRESETS = {
  day: { env: 0.95, key: 1.6, rim: 0.5, keyColor: new THREE.Color(0xfff4e2), exposure: 1.05 },
  dusk: { env: 0.28, key: 2.6, rim: 1.9, keyColor: new THREE.Color(0xffc98a), exposure: 1.0 },
};

export function createViewerScene(canvas, initialLight = "day") {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const preset = LIGHT_PRESETS[initialLight] || LIGHT_PRESETS.day;
  renderer.toneMappingExposure = preset.exposure;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = preset.env;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  const keyLight = new THREE.DirectionalLight(preset.keyColor.clone(), preset.key);
  keyLight.position.set(2.5, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xbfd8ff, preset.rim);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);

  let lightGoal = LIGHT_PRESETS[initialLight] || LIGHT_PRESETS.day;

  function setLightPreset(mode) {
    lightGoal = LIGHT_PRESETS[mode] || LIGHT_PRESETS.day;
  }

  function updateLights(f) {
    scene.environmentIntensity += (lightGoal.env - scene.environmentIntensity) * f;
    keyLight.intensity += (lightGoal.key - keyLight.intensity) * f;
    rimLight.intensity += (lightGoal.rim - rimLight.intensity) * f;
    keyLight.color.lerp(lightGoal.keyColor, f);
    renderer.toneMappingExposure += (lightGoal.exposure - renderer.toneMappingExposure) * f;
  }

  function refreshPixelRatio() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  function dispose() {
    envTarget.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    renderer,
    scene,
    camera,
    setLightPreset,
    updateLights,
    refreshPixelRatio,
    dispose,
  };
}
