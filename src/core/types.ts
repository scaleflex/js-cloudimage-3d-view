import type { Group, Scene, PerspectiveCamera, WebGLRenderer, AnimationClip } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type ToneMappingMode = 'none' | 'linear' | 'reinhard' | 'aces' | 'filmic';

export interface DirectionalLightConfig {
  intensity?: number;
  color?: string;
  position?: [number, number, number];
  castShadow?: boolean;
}

export interface LightingConfig {
  ambientIntensity?: number;
  ambientColor?: string;
  keyLight?: DirectionalLightConfig;
  fillLight?: DirectionalLightConfig;
  rimLight?: DirectionalLightConfig;
}

export interface CI3DViewConfig {
  src: string;
  mtlSrc?: string;
  alt?: string;
  controls?: boolean;
  zoom?: boolean;
  pan?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  damping?: boolean;
  dampingFactor?: number;
  zoomMin?: number;
  zoomMax?: number;
  polarAngleMin?: number;
  polarAngleMax?: number;
  theme?: 'light' | 'dark';
  background?: string;
  showProgress?: boolean;
  fullscreenButton?: boolean;
  backgroundToggleButton?: boolean;
  screenshotButton?: boolean;
  screenshotFilename?: string;
  screenshotScale?: number;
  resetCameraButton?: boolean;
  autoRotateButton?: boolean;
  animationButtons?: boolean;
  toolbarPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right';
  shadows?: boolean;
  shadowOpacity?: number;
  shadowBlur?: number;
  lighting?: LightingConfig;
  environmentMap?: string;
  environmentBackground?: boolean;
  toneMapping?: ToneMappingMode;
  toneMappingExposure?: number;
  draco?: boolean;
  dracoDecoderPath?: string;
  animation?: number | string;
  autoPlayAnimation?: boolean;
  animationSpeed?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  cameraTarget?: [number, number, number];
  pixelRatio?: number;
  antialias?: boolean;
  scrollToZoom?: boolean;
  onLoadStart?: () => void;
  onProgress?: (progress: number) => void;
  onLoad?: (instance: CI3DViewInstance) => void;
  onError?: (error: Error) => void;
  onCameraChange?: (
    position: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
  ) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export interface CI3DViewInstance {
  getThreeObjects(): {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    controls: OrbitControls;
    model: Group | null;
  };
  getElements(): {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
  };
  loadModel(src: string, mtlSrc?: string): Promise<void>;
  setCameraPosition(x: number, y: number, z: number): void;
  setCameraTarget(x: number, y: number, z: number): void;
  resetCamera(): void;
  setAutoRotate(enabled: boolean): void;
  screenshot(scale?: number): string;
  downloadScreenshot(filename?: string, scale?: number): void;
  playAnimation(indexOrName?: number | string): void;
  pauseAnimation(): void;
  stopAnimation(): void;
  setAnimationSpeed(speed: number): void;
  getAnimations(): string[];
  enterFullscreen(): void;
  exitFullscreen(): void;
  isFullscreen(): boolean;
  update(config: Partial<CI3DViewConfig>): void;
  destroy(): void;
}

export interface LoaderOptions {
  mtlUrl?: string;
  draco?: boolean;
  dracoDecoderPath?: string;
}

export interface LoadResult {
  model: Group;
  animations: AnimationClip[];
}

export interface FormatLoader {
  extensions: string[];
  load(
    url: string,
    options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult>;
}

export interface Theme {
  name: 'light' | 'dark';
  className: string;
}
