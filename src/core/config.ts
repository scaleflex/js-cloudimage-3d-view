import type { CI3DViewConfig } from './types';

export const DEFAULT_CONFIG: CI3DViewConfig = {
  src: '',
  controls: true,
  zoom: true,
  pan: true,
  autoRotate: false,
  autoRotateSpeed: 0.5,
  autoRotateDelay: 3000,
  damping: true,
  dampingFactor: 0.1,
  polarAngleMin: 0,
  polarAngleMax: 180,
  theme: 'light',
  background: 'transparent',
  showProgress: true,
  fullscreenButton: true,
  backgroundToggleButton: false,
  screenshotButton: false,
  screenshotFilename: 'screenshot',
  screenshotScale: 2,
  resetCameraButton: true,
  autoRotateButton: true,
  animationButtons: true,
  toolbarPosition: 'bottom-center',
  shadows: true,
  shadowOpacity: 0.3,
  shadowBlur: 2,
  environmentBackground: false,
  toneMapping: 'aces',
  toneMappingExposure: 1.0,
  draco: true,
  autoPlayAnimation: false,
  animationSpeed: 1.0,
  cameraFov: 45,
  antialias: true,
  scrollToZoom: false,
};

function toBool(v: string): boolean {
  return v === 'true' || v === '1' || v === 'yes' || v === '';
}

function toNumber(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toNumberOrString(v: string): number | string {
  const n = Number(v);
  return isNaN(n) ? v : n;
}

const DATA_ATTR_MAP: Record<string, { key: string; coerce: (v: string) => unknown }> = {
  'src':                    { key: 'src',                  coerce: String },
  'mtl-src':                { key: 'mtlSrc',               coerce: String },
  'alt':                    { key: 'alt',                  coerce: String },
  'controls':               { key: 'controls',             coerce: toBool },
  'zoom':                   { key: 'zoom',                 coerce: toBool },
  'pan':                    { key: 'pan',                  coerce: toBool },
  'auto-rotate':            { key: 'autoRotate',           coerce: toBool },
  'auto-rotate-speed':      { key: 'autoRotateSpeed',      coerce: toNumber },
  'auto-rotate-delay':      { key: 'autoRotateDelay',      coerce: toNumber },
  'damping':                { key: 'damping',              coerce: toBool },
  'damping-factor':         { key: 'dampingFactor',        coerce: toNumber },
  'zoom-min':               { key: 'zoomMin',              coerce: toNumber },
  'zoom-max':               { key: 'zoomMax',              coerce: toNumber },
  'polar-angle-min':        { key: 'polarAngleMin',        coerce: toNumber },
  'polar-angle-max':        { key: 'polarAngleMax',        coerce: toNumber },
  'theme':                  { key: 'theme',                coerce: String },
  'background':             { key: 'background',           coerce: String },
  'show-progress':          { key: 'showProgress',         coerce: toBool },
  'fullscreen-button':      { key: 'fullscreenButton',     coerce: toBool },
  'background-toggle-button': { key: 'backgroundToggleButton', coerce: toBool },
  'screenshot-button':      { key: 'screenshotButton',     coerce: toBool },
  'screenshot-filename':    { key: 'screenshotFilename',   coerce: String },
  'screenshot-scale':       { key: 'screenshotScale',      coerce: toNumber },
  'reset-camera-button':    { key: 'resetCameraButton',    coerce: toBool },
  'auto-rotate-button':     { key: 'autoRotateButton',     coerce: toBool },
  'animation-buttons':      { key: 'animationButtons',     coerce: toBool },
  'toolbar-position':       { key: 'toolbarPosition',      coerce: String },
  'shadows':                { key: 'shadows',              coerce: toBool },
  'shadow-opacity':         { key: 'shadowOpacity',        coerce: toNumber },
  'shadow-blur':            { key: 'shadowBlur',           coerce: toNumber },
  'environment-map':        { key: 'environmentMap',       coerce: String },
  'environment-background': { key: 'environmentBackground', coerce: toBool },
  'tone-mapping':           { key: 'toneMapping',          coerce: String },
  'tone-mapping-exposure':  { key: 'toneMappingExposure',  coerce: toNumber },
  'draco':                  { key: 'draco',                coerce: toBool },
  'draco-decoder-path':     { key: 'dracoDecoderPath',     coerce: String },
  'animation':              { key: 'animation',            coerce: toNumberOrString },
  'auto-play-animation':    { key: 'autoPlayAnimation',    coerce: toBool },
  'animation-speed':        { key: 'animationSpeed',       coerce: toNumber },
  'camera-position':        { key: 'cameraPosition',       coerce: (v: string) => {
    const arr = JSON.parse(v);
    if (!Array.isArray(arr) || arr.length !== 3 || arr.some((n: any) => typeof n !== 'number' || !isFinite(n))) {
      throw new Error('Expected [x, y, z] tuple of finite numbers');
    }
    return arr as [number, number, number];
  } },
  'camera-fov':             { key: 'cameraFov',            coerce: toNumber },
  'camera-target':          { key: 'cameraTarget',         coerce: (v: string) => {
    const arr = JSON.parse(v);
    if (!Array.isArray(arr) || arr.length !== 3 || arr.some((n: any) => typeof n !== 'number' || !isFinite(n))) {
      throw new Error('Expected [x, y, z] tuple of finite numbers');
    }
    return arr as [number, number, number];
  } },
  'pixel-ratio':            { key: 'pixelRatio',           coerce: toNumber },
  'antialias':              { key: 'antialias',            coerce: toBool },
  'scroll-to-zoom':         { key: 'scrollToZoom',         coerce: toBool },
  'ifc-wasm-path':           { key: 'ifcWasmPath',           coerce: String },
  'lighting':               { key: 'lighting',             coerce: JSON.parse },
};

export function parseDataAttributes(element: HTMLElement): Partial<CI3DViewConfig> {
  const config: Record<string, unknown> = {};

  for (const [attrSuffix, mapping] of Object.entries(DATA_ATTR_MAP)) {
    const attrName = `data-ci-3d-${attrSuffix}`;
    const value = element.getAttribute(attrName);

    if (value !== null) {
      try {
        config[mapping.key] = mapping.coerce(value);
      } catch (e) {
        console.warn(`CI3DView: failed to parse data attribute "${attrName}":`, e);
      }
    }
  }

  return config as Partial<CI3DViewConfig>;
}

export function mergeConfig(userConfig: Partial<CI3DViewConfig>): CI3DViewConfig {
  const merged = { ...DEFAULT_CONFIG };

  for (const [key, value] of Object.entries(userConfig)) {
    if (value !== undefined) {
      if (key === 'lighting' && typeof value === 'object' && value !== null) {
        (merged as any)[key] = { ...(DEFAULT_CONFIG as any)[key], ...value };
      } else {
        (merged as any)[key] = value;
      }
    }
  }

  return merged;
}

export function validateConfig(config: CI3DViewConfig): string[] {
  const errors: string[] = [];

  if (!config.src) {
    errors.push('config.src is required');
  }

  if (config.theme && !['light', 'dark'].includes(config.theme)) {
    errors.push(`Invalid theme: "${config.theme}". Must be "light" or "dark".`);
  }

  if (config.toneMapping && !['none', 'linear', 'reinhard', 'aces', 'filmic'].includes(config.toneMapping)) {
    errors.push(`Invalid toneMapping: "${config.toneMapping}".`);
  }

  if (config.polarAngleMin !== undefined && (config.polarAngleMin < 0 || config.polarAngleMin > 180)) {
    errors.push(`polarAngleMin must be between 0 and 180, got ${config.polarAngleMin}.`);
  }
  if (config.polarAngleMax !== undefined && (config.polarAngleMax < 0 || config.polarAngleMax > 180)) {
    errors.push(`polarAngleMax must be between 0 and 180, got ${config.polarAngleMax}.`);
  }
  if (config.shadowOpacity !== undefined && (config.shadowOpacity < 0 || config.shadowOpacity > 1)) {
    errors.push(`shadowOpacity must be between 0 and 1, got ${config.shadowOpacity}.`);
  }
  if (config.animationSpeed !== undefined && config.animationSpeed < 0) {
    errors.push(`animationSpeed must be non-negative, got ${config.animationSpeed}.`);
  }
  if (config.pixelRatio !== undefined && config.pixelRatio <= 0) {
    errors.push(`pixelRatio must be positive, got ${config.pixelRatio}.`);
  }
  if (config.cameraFov !== undefined && (config.cameraFov <= 0 || config.cameraFov >= 180)) {
    errors.push(`cameraFov must be between 0 (exclusive) and 180 (exclusive), got ${config.cameraFov}.`);
  }

  return errors;
}
