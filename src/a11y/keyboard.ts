import { PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface KeyboardHandlerOptions {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  container: HTMLElement;
  onResetCamera?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleFullscreen?: () => void;
  onToggleAnimation?: () => void;
}

export class KeyboardHandler {
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private container: HTMLElement;
  private options: KeyboardHandlerOptions;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(options: KeyboardHandlerOptions) {
    this.camera = options.camera;
    this.controls = options.controls;
    this.container = options.container;
    this.options = options;

    this.handleKeyDown = (e: KeyboardEvent) => {
      // Only respond when container or its children have focus
      if (!this.container.contains(document.activeElement) && document.activeElement !== this.container) {
        return;
      }

      // Don't interfere with input elements
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.rotateHorizontal(1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.rotateHorizontal(-1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.rotateVertical(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.rotateVertical(-1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoom(1);
          break;
        case '-':
          e.preventDefault();
          this.zoom(-1);
          break;
        case '0':
          e.preventDefault();
          this.options.onResetCamera?.();
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.options.onToggleAutoRotate?.();
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.options.onToggleFullscreen?.();
          }
          break;
        case ' ':
          // Only toggle animation if no button is focused
          if (!(document.activeElement instanceof HTMLButtonElement)) {
            e.preventDefault();
            this.options.onToggleAnimation?.();
          }
          break;
        case 'Escape':
          // Escape should only exit fullscreen, not enter it
          if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
            this.options.onToggleFullscreen?.();
          }
          break;
      }
    };

    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  private rotateHorizontal(direction: number): void {
    const step = (5 * Math.PI) / 180; // 5 degrees
    // Use OrbitControls internal method if available, else manipulate directly
    if (typeof (this.controls as any).rotateLeft === 'function') {
      (this.controls as any).rotateLeft(step * direction);
    }
    this.controls.update();
  }

  private rotateVertical(direction: number): void {
    const step = (5 * Math.PI) / 180;
    if (typeof (this.controls as any).rotateUp === 'function') {
      (this.controls as any).rotateUp(step * direction);
    }
    this.controls.update();
  }

  private zoom(direction: number): void {
    const factor = 0.9;
    const cameraDir = new Vector3().subVectors(this.controls.target, this.camera.position);
    const currentDist = cameraDir.length();

    const newDist = direction > 0
      ? currentDist * factor   // Zoom in
      : currentDist / factor;  // Zoom out

    // Respect OrbitControls min/max distance
    const minDist = this.controls.minDistance || 0;
    const maxDist = this.controls.maxDistance || Infinity;
    const clampedDist = Math.max(minDist, Math.min(maxDist, newDist));

    if (clampedDist === currentDist) return;

    cameraDir.normalize();
    this.camera.position.copy(this.controls.target).addScaledVector(cameraDir, -clampedDist);

    this.controls.update();
  }

  destroy(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }
}
