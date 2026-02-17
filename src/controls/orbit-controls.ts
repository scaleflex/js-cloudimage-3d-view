import { PerspectiveCamera, Sphere } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CI3DViewConfig } from '../core/types';
import { degreesToRadians } from '../utils/math';

export function setupOrbitControls(
  camera: PerspectiveCamera,
  canvas: HTMLCanvasElement,
  config: CI3DViewConfig,
): OrbitControls {
  const controls = new OrbitControls(camera, canvas);

  controls.enableDamping = config.damping !== false;
  controls.dampingFactor = config.dampingFactor ?? 0.1;
  controls.enableZoom = config.zoom !== false;
  controls.enablePan = config.pan !== false;
  controls.enableRotate = config.controls !== false;

  if (config.polarAngleMin !== undefined) {
    controls.minPolarAngle = degreesToRadians(config.polarAngleMin);
  }
  if (config.polarAngleMax !== undefined) {
    controls.maxPolarAngle = degreesToRadians(config.polarAngleMax);
  }

  if (config.cameraTarget) {
    controls.target.set(
      config.cameraTarget[0],
      config.cameraTarget[1],
      config.cameraTarget[2],
    );
  }

  controls.update();

  return controls;
}

export function updateControlsConstraints(
  controls: OrbitControls,
  modelSphere: Sphere,
  config: CI3DViewConfig,
): void {
  const radius = modelSphere.radius;

  controls.minDistance = config.zoomMin ?? radius * 1.2;
  controls.maxDistance = config.zoomMax ?? radius * 5;

  if (config.polarAngleMin !== undefined) {
    controls.minPolarAngle = degreesToRadians(config.polarAngleMin);
  }
  if (config.polarAngleMax !== undefined) {
    controls.maxPolarAngle = degreesToRadians(config.polarAngleMax);
  }

  controls.update();
}
