import {
  WebGLRenderer,
  PerspectiveCamera,
  PCFSoftShadowMap,
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  ACESFilmicToneMapping,
  CineonToneMapping,
  SRGBColorSpace,
  type ToneMapping,
} from 'three';
import type { CI3DViewConfig, ToneMappingMode } from './types';

const TONE_MAPPING_MAP: Record<ToneMappingMode, ToneMapping> = {
  'none': NoToneMapping,
  'linear': LinearToneMapping,
  'reinhard': ReinhardToneMapping,
  'aces': ACESFilmicToneMapping,
  'filmic': CineonToneMapping,
};

export function createRenderer(canvas: HTMLCanvasElement, config: CI3DViewConfig): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: config.antialias !== false,
    alpha: true,
    powerPreference: 'high-performance',
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  renderer.setPixelRatio(Math.min(dpr, config.pixelRatio ?? 2));
  renderer.outputColorSpace = SRGBColorSpace;

  if (config.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }

  applyToneMapping(renderer, config);

  // Handle WebGL context loss
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    // Re-read config at restore time to use current values, not stale closure
    renderer.setPixelRatio(Math.min(dpr, config.pixelRatio ?? 2));
    renderer.outputColorSpace = SRGBColorSpace;
    if (config.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
    }
    applyToneMapping(renderer, config);
  });

  return renderer;
}

function applyToneMapping(renderer: WebGLRenderer, config: CI3DViewConfig): void {
  const mode = config.toneMapping ?? 'aces';
  renderer.toneMapping = TONE_MAPPING_MAP[mode] ?? ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.toneMappingExposure ?? 1.0;
}

export function handleResize(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  container: HTMLElement,
): ResizeObserver {
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  const observer = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }, 16);
  });

  observer.observe(container);

  // Patch disconnect to also clear pending debounce timeout
  const originalDisconnect = observer.disconnect.bind(observer);
  observer.disconnect = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
    originalDisconnect();
  };

  return observer;
}

export function getToneMappingConstant(mode: ToneMappingMode): ToneMapping {
  return TONE_MAPPING_MAP[mode] ?? ACESFilmicToneMapping;
}
