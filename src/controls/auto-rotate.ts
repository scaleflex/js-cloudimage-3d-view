import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface AutoRotateConfig {
  autoRotateSpeed: number;
  autoRotateDelay: number;
}

export class AutoRotateController {
  private resumeTimeout: ReturnType<typeof setTimeout> | null = null;
  private controls: OrbitControls;
  private config: AutoRotateConfig;
  private enabled = false;

  constructor(controls: OrbitControls, config: AutoRotateConfig) {
    this.controls = controls;
    this.config = config;

    controls.addEventListener('start', this.onInteractStart);
    controls.addEventListener('end', this.onInteractEnd);
  }

  start(): void {
    this.enabled = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = this.config.autoRotateSpeed * 60;
  }

  stop(): void {
    this.enabled = false;
    this.controls.autoRotate = false;
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  }

  setSpeed(speed: number): void {
    this.config.autoRotateSpeed = speed;
    this.controls.autoRotateSpeed = speed * 60;
  }

  private onInteractStart = (): void => {
    this.controls.autoRotate = false;
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  };

  private onInteractEnd = (): void => {
    if (!this.enabled) return;
    this.resumeTimeout = setTimeout(() => {
      this.controls.autoRotate = true;
      this.resumeTimeout = null;
    }, this.config.autoRotateDelay);
  };

  destroy(): void {
    this.controls.removeEventListener('start', this.onInteractStart);
    this.controls.removeEventListener('end', this.onInteractEnd);
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  }
}
