import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Clock,
  Vector3,
  Color,
  AnimationMixer,
  AnimationAction,
  AnimationClip,
  Vector2,
} from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CI3DViewConfig, CI3DViewInstance } from './types';
import { DEFAULT_CONFIG, parseDataAttributes, mergeConfig, validateConfig } from './config';
import { createRenderer, handleResize, getToneMappingConstant } from './renderer';
import { createScene, createCamera } from './scene';
import { getElement, createElement, addClass, removeClass, injectStyles } from '../utils/dom';
import { computeBoundingBox, computeBoundingSphere, centerModel, scaleToFit, fitCameraToModel } from '../utils/math';
import { disposeObject3D } from '../utils/dispose';
import { throttle } from '../utils/events';
import { getLoader } from '../loaders/loader-registry';
import { create3PointLighting, reduceLightingForIBL, disposeLighting, applyLightingConfig, type LightingRig } from '../lighting/lighting';
import { loadEnvironmentMap, disposeEnvironment } from '../lighting/environment';
import { createGroundPlane, disposeGroundPlane } from '../lighting/shadows';
import { setupOrbitControls, updateControlsConstraints } from '../controls/orbit-controls';
import { AutoRotateController } from '../controls/auto-rotate';
import { smoothCameraReset, type CameraResetHandle } from '../controls/camera-reset';
import { createToolbar, type ToolbarHandle } from '../ui/toolbar';
import CSS_STRING from '../styles/index.css?inline';

export class CI3DView implements CI3DViewInstance {
  private container: HTMLElement;
  private config: CI3DViewConfig;
  private canvas!: HTMLCanvasElement;
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private controls!: OrbitControls;
  private model: Group | null = null;
  private clock = new Clock();
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lights: LightingRig | null = null;
  private groundPlane: any = null;
  private autoRotateController: AutoRotateController | null = null;
  private mixer: AnimationMixer | null = null;
  private currentAction: AnimationAction | null = null;
  private clips: AnimationClip[] = [];
  private initialCameraPos = new Vector3();
  private initialCameraTarget = new Vector3();
  private destroyed = false;
  private loadGeneration = 0;
  private cameraResetHandle: CameraResetHandle | null = null;

  // UI overlays
  private toolbar: ToolbarHandle | null = null;
  private loadingOverlay: HTMLElement | null = null;
  private loadingText: HTMLElement | null = null;
  private progressBarFill: HTMLElement | null = null;
  private errorOverlay: HTMLElement | null = null;
  private controlsWrapper: HTMLElement | null = null;
  private bgToggleBtn: HTMLElement | null = null;
  private isDarkBackground = false;

  private throttledCameraChange: ((pos: any, target: any) => void) | null = null;

  // Scroll hint
  private scrollHint: HTMLElement | null = null;
  private scrollHintTimer: ReturnType<typeof setTimeout> | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;

  constructor(
    element: HTMLElement | string,
    config: Partial<CI3DViewConfig> = {},
  ) {
    this.container = getElement(element);
    this.config = mergeConfig(config);

    // Validate
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      console.warn('CI3DView config warnings:', errors);
    }

    // Inject global CSS
    injectStyles(CSS_STRING, 'ci-3d-styles');

    // Build DOM
    this.setupDOM();

    // Setup Three.js
    this.setupThreeJS();

    // Setup lighting
    this.setupLighting();

    // Start animation loop
    this.startLoop();

    // Setup resize handling
    this.resizeObserver = handleResize(this.renderer, this.camera, this.container);

    // Load model if src provided
    if (this.config.src) {
      this.config.onLoadStart?.();
      this.loadModelInternal(this.config.src, this.config.mtlSrc);
    }
  }

  static autoInit(root?: HTMLElement): CI3DViewInstance[] {
    const parent = root || document.body;
    const elements = parent.querySelectorAll<HTMLElement>('[data-ci-3d-src]');
    const instances: CI3DViewInstance[] = [];

    elements.forEach((el) => {
      const config = parseDataAttributes(el);
      instances.push(new CI3DView(el, config));
    });

    return instances;
  }

  // === Public API ===

  getThreeObjects() {
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      model: this.model,
    };
  }

  getElements() {
    return {
      container: this.container,
      canvas: this.canvas,
    };
  }

  async loadModel(src: string, mtlSrc?: string): Promise<void> {
    // Dispose old model
    if (this.model) {
      this.disposeModel();
    }

    this.showLoading();
    this.config.onLoadStart?.();

    await this.loadModelInternal(src, mtlSrc);
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.controls.update();
  }

  setCameraTarget(x: number, y: number, z: number): void {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  resetCamera(): void {
    this.cameraResetHandle?.cancel();
    this.cameraResetHandle = smoothCameraReset(
      this.camera,
      this.controls,
      this.initialCameraPos,
      this.initialCameraTarget,
    );
  }

  setAutoRotate(enabled: boolean): void {
    if (enabled) {
      if (!this.autoRotateController) {
        this.autoRotateController = new AutoRotateController(this.controls, {
          autoRotateSpeed: this.config.autoRotateSpeed ?? 0.5,
          autoRotateDelay: this.config.autoRotateDelay ?? 3000,
        });
      }
      this.autoRotateController.start();
    } else {
      this.autoRotateController?.stop();
    }
  }

  screenshot(scale?: number): string {
    const s = scale ?? this.config.screenshotScale ?? 2;
    const size = this.renderer.getSize(new Vector2());

    this.renderer.setSize(size.width * s, size.height * s, false);
    try {
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    } catch {
      // SecurityError on tainted canvases (cross-origin textures)
      return '';
    } finally {
      this.renderer.setSize(size.width, size.height, false);
    }
  }

  downloadScreenshot(filename?: string, scale?: number): void {
    const dataUrl = this.screenshot(scale);
    const name = filename ?? this.config.screenshotFilename ?? 'screenshot';

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  playAnimation(indexOrName?: number | string): void {
    if (!this.mixer || this.clips.length === 0) return;

    let clip: AnimationClip | undefined;
    if (typeof indexOrName === 'number') {
      clip = this.clips[indexOrName];
    } else if (typeof indexOrName === 'string') {
      clip = this.clips.find((c) => c.name === indexOrName);
    } else {
      clip = this.clips[0];
    }

    if (!clip) return;

    if (this.currentAction) {
      this.currentAction.stop();
    }

    this.currentAction = this.mixer.clipAction(clip);
    this.currentAction.reset().play();
  }

  pauseAnimation(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
    }
  }

  stopAnimation(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
  }

  setAnimationSpeed(speed: number): void {
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }
  }

  getAnimations(): string[] {
    return this.clips.map((c) => c.name);
  }

  enterFullscreen(): void {
    const el = this.container;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  }

  exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  }

  isFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
  }

  update(config: Partial<CI3DViewConfig>): void {
    const oldConfig = { ...this.config };
    this.config = mergeConfig({ ...this.config, ...config });

    // Apply theme change
    if (config.theme !== undefined && config.theme !== oldConfig.theme) {
      if (config.theme === 'dark') {
        addClass(this.container, 'ci-3d-theme-dark');
      } else {
        removeClass(this.container, 'ci-3d-theme-dark');
      }
    }

    // Apply background change
    if (config.background !== undefined) {
      if (config.background === 'transparent') {
        this.scene.background = null;
      } else {
        this.scene.background = new Color(config.background);
      }
    }

    // Apply tone mapping change
    if (config.toneMapping !== undefined) {
      this.renderer.toneMapping = getToneMappingConstant(config.toneMapping);
    }
    if (config.toneMappingExposure !== undefined) {
      this.renderer.toneMappingExposure = config.toneMappingExposure;
    }

    // Apply shadow change
    if (config.shadows !== undefined) {
      this.renderer.shadowMap.enabled = config.shadows;
      if (!config.shadows && this.groundPlane) {
        disposeGroundPlane(this.groundPlane, this.scene);
        this.groundPlane = null;
      }
    }

    // Apply lighting change
    if (config.lighting && this.lights) {
      applyLightingConfig(this.lights, config.lighting);
    }

    // Apply shadow opacity change
    if (config.shadowOpacity !== undefined && this.groundPlane) {
      (this.groundPlane.material as any).opacity = config.shadowOpacity;
    }

    // Apply auto-rotate change
    if (config.autoRotate !== undefined) {
      this.setAutoRotate(config.autoRotate);
    }

    // Apply auto-rotate speed change
    if (config.autoRotateSpeed !== undefined && this.autoRotateController) {
      this.autoRotateController.setSpeed(config.autoRotateSpeed);
    }

    // Apply control changes
    if (this.controls) {
      if (config.damping !== undefined) {
        this.controls.enableDamping = config.damping;
      }
      if (config.dampingFactor !== undefined) {
        this.controls.dampingFactor = config.dampingFactor;
      }
      if (config.zoom !== undefined) {
        this.controls.enableZoom = config.zoom;
      }
      if (config.pan !== undefined) {
        this.controls.enablePan = config.pan;
      }
      if (config.controls !== undefined) {
        this.controls.enableRotate = config.controls;
      }
    }

    // Apply scrollToZoom change
    if (config.scrollToZoom !== undefined && config.scrollToZoom !== oldConfig.scrollToZoom) {
      if (config.scrollToZoom) {
        this.detachWheelInterception();
      } else {
        this.attachWheelInterception();
      }
    }

    // Reload model if src changed
    if (config.src !== undefined && config.src !== oldConfig.src) {
      this.loadModel(config.src, config.mtlSrc);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    // Cancel any pending camera reset animation
    this.cameraResetHandle?.cancel();
    this.cameraResetHandle = null;

    // Stop animation loop
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Dispose toolbar
    this.toolbar?.destroy();

    // Dispose auto-rotate
    this.autoRotateController?.destroy();

    // Dispose animation
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model!);
    }

    // Dispose model
    this.disposeModel();

    // Dispose lighting
    if (this.lights) {
      disposeLighting(this.lights, this.scene);
    }

    // Dispose environment
    disposeEnvironment(this.scene);

    // Dispose ground plane
    if (this.groundPlane) {
      disposeGroundPlane(this.groundPlane, this.scene);
    }

    // Dispose controls
    this.controls?.dispose();

    // Dispose renderer
    this.renderer.dispose();

    // Disconnect resize observer
    this.resizeObserver?.disconnect();

    // Remove wheel interception
    this.detachWheelInterception();
    this.hideScrollHint();

    // Remove fullscreen listener
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);

    // Remove DOM elements
    this.scrollHint?.remove();
    this.loadingOverlay?.remove();
    this.errorOverlay?.remove();
    this.controlsWrapper?.remove();
    this.canvas?.remove();

    // Remove container classes
    removeClass(this.container, 'ci-3d-container', 'ci-3d-theme-dark');
  }

  // === Private Methods ===

  private setupDOM(): void {
    addClass(this.container, 'ci-3d-container');

    if (this.config.theme === 'dark') {
      addClass(this.container, 'ci-3d-theme-dark');
    }

    // Container ARIA
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-roledescription', '3D viewer');
    this.container.setAttribute('aria-label', `3D model viewer: ${this.config.alt || '3D model'}`);
    this.container.setAttribute('tabindex', '0');

    // Canvas
    this.canvas = createElement('canvas', 'ci-3d-canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', this.config.alt || '3D model');
    this.container.appendChild(this.canvas);

    // Loading overlay
    this.loadingOverlay = createElement('div', 'ci-3d-loading', { 'aria-live': 'polite' });
    const spinner = createElement('div', 'ci-3d-loading-spinner');
    this.loadingText = createElement('div', 'ci-3d-loading-text');
    this.loadingText.textContent = 'Loading...';
    const progressBar = createElement('div', 'ci-3d-progress-bar');
    this.progressBarFill = createElement('div', 'ci-3d-progress-bar-fill');
    progressBar.appendChild(this.progressBarFill);
    this.loadingOverlay.appendChild(spinner);
    this.loadingOverlay.appendChild(this.loadingText);
    this.loadingOverlay.appendChild(progressBar);
    this.container.appendChild(this.loadingOverlay);

    // Error overlay
    this.errorOverlay = createElement('div', 'ci-3d-error', { 'role': 'alert', 'aria-live': 'assertive' });
    const errorIcon = createElement('div', 'ci-3d-error-icon');
    errorIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    const errorMessage = createElement('div', 'ci-3d-error-message');
    errorMessage.textContent = 'Failed to load model';
    const retryButton = createElement('button', 'ci-3d-error-retry');
    retryButton.textContent = 'Retry';
    retryButton.setAttribute('aria-label', 'Retry loading model');
    retryButton.addEventListener('click', () => {
      this.hideError();
      this.showLoading();
      this.loadModelInternal(this.config.src, this.config.mtlSrc);
    });
    this.errorOverlay.appendChild(errorIcon);
    this.errorOverlay.appendChild(errorMessage);
    this.errorOverlay.appendChild(retryButton);
    this.container.appendChild(this.errorOverlay);

    // Controls wrapper (top-right buttons)
    if (this.config.fullscreenButton || this.config.backgroundToggleButton) {
      this.controlsWrapper = createElement('div', 'ci-3d-controls');

      if (this.config.fullscreenButton) {
        const fullscreenBtn = createElement('button', 'ci-3d-fullscreen-btn', {
          'aria-label': 'Enter fullscreen',
          'aria-pressed': 'false',
        });
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
        fullscreenBtn.addEventListener('click', () => {
          if (this.isFullscreen()) {
            this.exitFullscreen();
          } else {
            this.enterFullscreen();
          }
        });
        this.controlsWrapper.appendChild(fullscreenBtn);
      }

      if (this.config.backgroundToggleButton) {
        this.isDarkBackground = this.config.theme === 'dark';

        this.bgToggleBtn = createElement('button', 'ci-3d-bg-toggle-btn', {
          'aria-label': this.isDarkBackground ? 'Switch to light background' : 'Switch to dark background',
        });
        this.updateBgToggleIcon();
        this.bgToggleBtn.addEventListener('click', () => {
          if (this.isDarkBackground) {
            this.update({ theme: 'light', background: '#ffffff' });
          } else {
            this.update({ theme: 'dark', background: '#1a1a1a' });
          }
          this.isDarkBackground = !this.isDarkBackground;
          this.updateBgToggleIcon();
          this.bgToggleBtn?.setAttribute(
            'aria-label',
            this.isDarkBackground ? 'Switch to light background' : 'Switch to dark background',
          );
        });
        this.controlsWrapper.appendChild(this.bgToggleBtn);
      }

      this.container.appendChild(this.controlsWrapper);
    }

    // Scroll hint overlay
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    this.scrollHint = createElement('div', 'ci-3d-scroll-hint');
    this.scrollHint.textContent = isMac ? '\u2318 + scroll to zoom' : 'Ctrl + scroll to zoom';
    this.container.appendChild(this.scrollHint);

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);
  }

  private onFullscreenChange = (): void => {
    const isFs = this.isFullscreen();

    if (isFs) {
      addClass(this.container, 'ci-3d-container--fullscreen');
    } else {
      removeClass(this.container, 'ci-3d-container--fullscreen');
    }

    // Update fullscreen button
    const btn = this.container.querySelector('.ci-3d-fullscreen-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', String(isFs));
      btn.setAttribute('aria-label', isFs ? 'Exit fullscreen' : 'Enter fullscreen');
    }

    this.config.onFullscreenChange?.(isFs);
  };

  private updateBgToggleIcon(): void {
    if (!this.bgToggleBtn) return;
    if (this.isDarkBackground) {
      // Moon icon (dark mode active → click for light)
      this.bgToggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    } else {
      // Sun icon (light mode active → click for dark)
      this.bgToggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    }
  }

  private setupThreeJS(): void {
    this.renderer = createRenderer(this.canvas, this.config);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.renderer.setSize(width, height, false);

    this.scene = createScene(this.config);
    this.camera = createCamera(this.config, width / height);

    // Setup controls eagerly so they're available before model loads
    this.controls = setupOrbitControls(this.camera, this.canvas, this.config);

    // Setup Ctrl+scroll zoom gating
    if (!this.config.scrollToZoom) {
      this.attachWheelInterception();
    }
  }

  private setupLighting(): void {
    this.lights = create3PointLighting(this.scene, this.config.lighting);
  }

  private startLoop(): void {
    const onCameraChange = this.config.onCameraChange;
    if (onCameraChange) {
      this.throttledCameraChange = throttle((pos, target) => {
        onCameraChange(pos, target);
      }, 1000 / 60);
    }

    const animate = (): void => {
      if (this.destroyed) return;
      this.animationId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      this.controls?.update();
      this.mixer?.update(delta);
      this.renderer.render(this.scene, this.camera);

      if (this.throttledCameraChange) {
        const pos = this.camera.position;
        const target = this.controls.target;
        this.throttledCameraChange(
          { x: pos.x, y: pos.y, z: pos.z },
          { x: target.x, y: target.y, z: target.z },
        );
      }
    };

    animate();
  }

  private async loadModelInternal(src: string, mtlSrc?: string): Promise<void> {
    const generation = ++this.loadGeneration;

    const loader = getLoader(src);
    if (!loader) {
      this.showError(`Unsupported model format: ${src}`);
      this.config.onError?.(new Error(`Unsupported model format: ${src}`));
      return;
    }

    try {
      const result = await loader.load(
        src,
        {
          mtlUrl: mtlSrc,
          draco: this.config.draco,
          dracoDecoderPath: this.config.dracoDecoderPath,
        },
        (progress) => {
          if (generation !== this.loadGeneration) return;
          this.updateProgress(progress);
          this.config.onProgress?.(progress);
        },
      );

      if (this.destroyed || generation !== this.loadGeneration) {
        // Stale load — dispose the result and bail out
        disposeObject3D(result.model);
        return;
      }

      this.model = result.model;
      this.clips = result.animations;

      // Scale first, then center (order matters: centering offset must be in scaled space)
      const box = computeBoundingBox(this.model);
      scaleToFit(this.model, box, 2);
      const scaledBox = computeBoundingBox(this.model);
      centerModel(this.model, scaledBox);

      // Enable shadow casting on model meshes
      if (this.config.shadows) {
        this.model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }

      this.scene.add(this.model);

      // Recompute bounds after centering/scaling
      const sphere = computeBoundingSphere(this.model);

      // Update controls constraints (reuse existing controls, don't recreate)
      updateControlsConstraints(this.controls, sphere, this.config);

      // Fit camera if no custom position set
      if (!this.config.cameraPosition) {
        fitCameraToModel(this.camera, sphere);
      }

      // Store initial camera state
      this.initialCameraPos.copy(this.camera.position);
      this.initialCameraTarget.copy(this.controls.target);

      // Setup shadows
      if (this.config.shadows) {
        this.groundPlane = createGroundPlane(scaledBox, {
          shadowOpacity: this.config.shadowOpacity ?? 0.3,
        });
        this.scene.add(this.groundPlane);
      }

      // Setup auto-rotate
      if (this.config.autoRotate) {
        this.setAutoRotate(true);
      }

      // Load environment map
      if (this.config.environmentMap) {
        await loadEnvironmentMap(
          this.config.environmentMap,
          this.renderer,
          this.scene,
          this.config.environmentBackground ?? false,
        );
        if (this.lights) {
          reduceLightingForIBL(this.lights);
        }
      }

      // Setup animation
      if (this.clips.length > 0) {
        this.mixer = new AnimationMixer(this.model);

        if (this.config.autoPlayAnimation) {
          this.playAnimation(this.config.animation);
        } else if (this.config.animation !== undefined) {
          this.playAnimation(this.config.animation);
        }

        if (this.config.animationSpeed !== undefined && this.config.animationSpeed !== 1) {
          this.setAnimationSpeed(this.config.animationSpeed);
        }
      }

      // Hide loading
      this.hideLoading();

      // Create toolbar
      this.createToolbar();

      // Fire onLoad
      this.config.onLoad?.(this);
    } catch (error) {
      if (this.destroyed) return;
      const err = error instanceof Error ? error : new Error(String(error));
      this.showError(err.message);
      this.config.onError?.(err);
    }
  }

  private createToolbar(): void {
    // Destroy previous toolbar if reloading model
    this.toolbar?.destroy();
    this.toolbar = null;

    this.toolbar = createToolbar(
      this.container,
      {
        resetCameraButton: this.config.resetCameraButton ?? true,
        autoRotateButton: this.config.autoRotateButton ?? true,
        animationButtons: this.config.animationButtons ?? true,
        screenshotButton: this.config.screenshotButton ?? false,
        hasAnimations: this.clips.length > 0,
        autoRotateActive: !!this.autoRotateController,
        position: this.config.toolbarPosition ?? 'bottom-center',
      },
      {
        onResetCamera: () => this.resetCamera(),
        onAutoRotate: (enabled) => this.setAutoRotate(enabled),
        onPlay: () => {
          this.playAnimation();
          this.toolbar?.setAnimationState(true);
        },
        onPause: () => {
          this.pauseAnimation();
          this.toolbar?.setAnimationState(false);
        },
        onStop: () => {
          this.stopAnimation();
          this.toolbar?.setAnimationState(false);
        },
        onScreenshot: () => this.downloadScreenshot(),
      },
    );

    // If auto-play animation is active, reflect that in toolbar
    if (this.currentAction && !this.currentAction.paused) {
      this.toolbar?.setAnimationState(true);
    }
  }

  private attachWheelInterception(): void {
    this.detachWheelInterception();
    this.wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Let event propagate to OrbitControls for 3D zoom
      } else {
        e.stopPropagation();
        // Do NOT preventDefault — allow page scroll
        this.showScrollHint();
      }
    };
    this.container.addEventListener('wheel', this.wheelHandler, { capture: true, passive: false });
  }

  private detachWheelInterception(): void {
    if (this.wheelHandler) {
      this.container.removeEventListener('wheel', this.wheelHandler, { capture: true } as EventListenerOptions);
      this.wheelHandler = null;
    }
  }

  private showScrollHint(): void {
    if (!this.scrollHint) return;
    addClass(this.scrollHint, 'ci-3d-scroll-hint--visible');

    if (this.scrollHintTimer !== null) {
      clearTimeout(this.scrollHintTimer);
    }
    this.scrollHintTimer = setTimeout(() => {
      this.hideScrollHint();
    }, 1500);
  }

  private hideScrollHint(): void {
    if (!this.scrollHint) return;
    removeClass(this.scrollHint, 'ci-3d-scroll-hint--visible');
    if (this.scrollHintTimer !== null) {
      clearTimeout(this.scrollHintTimer);
      this.scrollHintTimer = null;
    }
  }

  private disposeModel(): void {
    if (this.model) {
      this.scene.remove(this.model);
      disposeObject3D(this.model);
      this.model = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.currentAction = null;
    this.clips = [];
  }

  private showLoading(): void {
    if (this.loadingOverlay) {
      removeClass(this.loadingOverlay, 'ci-3d-loading--hidden');
    }
    if (this.loadingText) {
      this.loadingText.textContent = 'Loading...';
    }
    if (this.progressBarFill) {
      this.progressBarFill.style.width = '0%';
    }
  }

  private hideLoading(): void {
    if (this.loadingOverlay) {
      addClass(this.loadingOverlay, 'ci-3d-loading--hidden');
    }
  }

  private updateProgress(progress: number): void {
    const pct = Math.round(progress * 100);
    if (this.loadingText) {
      this.loadingText.textContent = `Loading... ${pct}%`;
    }
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${pct}%`;
    }
  }

  private showError(message: string): void {
    this.hideLoading();
    if (this.errorOverlay) {
      addClass(this.errorOverlay, 'ci-3d-error--visible');
      removeClass(this.errorOverlay, 'ci-3d-error--hidden');
      const msgEl = this.errorOverlay.querySelector('.ci-3d-error-message');
      if (msgEl) msgEl.textContent = message;

      // Focus retry button for a11y
      const retryBtn = this.errorOverlay.querySelector<HTMLButtonElement>('.ci-3d-error-retry');
      retryBtn?.focus();
    }
  }

  private hideError(): void {
    if (this.errorOverlay) {
      removeClass(this.errorOverlay, 'ci-3d-error--visible');
      addClass(this.errorOverlay, 'ci-3d-error--hidden');
    }
  }
}
