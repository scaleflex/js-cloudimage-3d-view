import { Scene, PerspectiveCamera, Color } from 'three';
import type { CI3DViewConfig } from './types';

export function createScene(config: CI3DViewConfig): Scene {
  const scene = new Scene();

  if (config.background && config.background !== 'transparent') {
    scene.background = new Color(config.background);
  }

  return scene;
}

export function createCamera(config: CI3DViewConfig, aspect: number): PerspectiveCamera {
  const fov = config.cameraFov ?? 45;
  const camera = new PerspectiveCamera(fov, aspect, 0.01, 1000);

  if (config.cameraPosition) {
    camera.position.set(
      config.cameraPosition[0],
      config.cameraPosition[1],
      config.cameraPosition[2],
    );
  } else {
    camera.position.set(0, 1, 3);
  }

  if (config.cameraTarget) {
    camera.lookAt(
      config.cameraTarget[0],
      config.cameraTarget[1],
      config.cameraTarget[2],
    );
  }

  return camera;
}
