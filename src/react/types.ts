import type { CSSProperties } from 'react';
import type {
  CI3DViewConfig,
  CI3DViewInstance,
  LightingConfig,
  ToneMappingMode,
} from '../core/types';

export interface CI3DViewerProps {
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
  screenshotButton?: boolean;
  screenshotFilename?: string;
  screenshotScale?: number;
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
  onLoadStart?: () => void;
  onProgress?: (progress: number) => void;
  onLoad?: (instance: CI3DViewInstance) => void;
  onError?: (error: Error) => void;
  onCameraChange?: (
    position: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
  ) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export interface CI3DViewerRef {
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
  getThreeObjects(): ReturnType<CI3DViewInstance['getThreeObjects']> | null;
  getElements(): ReturnType<CI3DViewInstance['getElements']> | null;
}

export interface UseCI3DViewOptions extends Omit<CI3DViewerProps, 'className' | 'style'> {}

export interface UseCI3DViewReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  instance: React.MutableRefObject<CI3DViewInstance | null>;
  ready: boolean;
}
