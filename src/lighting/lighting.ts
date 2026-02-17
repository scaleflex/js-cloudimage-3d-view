import {
  AmbientLight,
  DirectionalLight,
  Scene,
  Color,
} from 'three';
import type { LightingConfig } from '../core/types';

export interface LightingRig {
  ambient: AmbientLight;
  key: DirectionalLight;
  fill: DirectionalLight;
  rim: DirectionalLight;
  originalIntensities: {
    ambient: number;
    key: number;
    fill: number;
    rim: number;
  };
}

const LIGHT_DEFAULTS = {
  ambient: { intensity: 0.4, color: '#ffffff' },
  key:  { intensity: 1.0, color: '#ffffff', position: [5, 8, 5] as [number, number, number], castShadow: true },
  fill: { intensity: 0.5, color: '#ffffff', position: [-5, 4, -3] as [number, number, number], castShadow: false },
  rim:  { intensity: 0.7, color: '#ffffff', position: [0, 4, -8] as [number, number, number], castShadow: false },
};

export function create3PointLighting(scene: Scene, config?: LightingConfig): LightingRig {
  const cfg = config || {};

  const ambient = new AmbientLight(
    new Color(cfg.ambientColor || LIGHT_DEFAULTS.ambient.color),
    cfg.ambientIntensity ?? LIGHT_DEFAULTS.ambient.intensity,
  );

  const key = createDirectionalLight(
    cfg.keyLight,
    LIGHT_DEFAULTS.key,
  );

  const fill = createDirectionalLight(
    cfg.fillLight,
    LIGHT_DEFAULTS.fill,
  );

  const rim = createDirectionalLight(
    cfg.rimLight,
    LIGHT_DEFAULTS.rim,
  );

  scene.add(ambient, key, fill, rim);

  return {
    ambient, key, fill, rim,
    originalIntensities: {
      ambient: ambient.intensity,
      key: key.intensity,
      fill: fill.intensity,
      rim: rim.intensity,
    },
  };
}

function createDirectionalLight(
  config: LightingConfig['keyLight'],
  defaults: typeof LIGHT_DEFAULTS.key,
): DirectionalLight {
  const light = new DirectionalLight(
    new Color(config?.color || defaults.color),
    config?.intensity ?? defaults.intensity,
  );

  const pos = config?.position || defaults.position;
  light.position.set(pos[0], pos[1], pos[2]);

  const castShadow = config?.castShadow ?? defaults.castShadow;
  light.castShadow = castShadow;

  if (castShadow) {
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.radius = 2;
  }

  return light;
}

export function applyLightingConfig(lights: LightingRig, config: LightingConfig): void {
  if (config.ambientIntensity !== undefined) lights.ambient.intensity = config.ambientIntensity;
  if (config.ambientColor) lights.ambient.color.set(config.ambientColor);

  if (config.keyLight) applyDirectionalConfig(lights.key, config.keyLight);
  if (config.fillLight) applyDirectionalConfig(lights.fill, config.fillLight);
  if (config.rimLight) applyDirectionalConfig(lights.rim, config.rimLight);
}

function applyDirectionalConfig(
  light: DirectionalLight,
  config: NonNullable<LightingConfig['keyLight']>,
): void {
  if (config.intensity !== undefined) light.intensity = config.intensity;
  if (config.color) light.color.set(config.color);
  if (config.position) light.position.set(config.position[0], config.position[1], config.position[2]);
  if (config.castShadow !== undefined) light.castShadow = config.castShadow;
}

export function reduceLightingForIBL(lights: LightingRig): void {
  lights.ambient.intensity = lights.originalIntensities.ambient * 0.5;
  lights.key.intensity = lights.originalIntensities.key * 0.5;
  lights.fill.intensity = lights.originalIntensities.fill * 0.5;
  lights.rim.intensity = lights.originalIntensities.rim * 0.5;
}

export function disposeLighting(lights: LightingRig, scene: Scene): void {
  scene.remove(lights.ambient, lights.key, lights.fill, lights.rim);
  lights.ambient.dispose();
  lights.key.dispose();
  lights.fill.dispose();
  lights.rim.dispose();
}
