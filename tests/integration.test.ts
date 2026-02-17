import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CI3DView } from '../src/core/ci-3d-view';

// Mock OrbitControls
vi.mock('three/addons/controls/OrbitControls.js', () => {
  const { Vector3 } = require('three');
  return {
    OrbitControls: vi.fn().mockImplementation(() => ({
      enableDamping: false,
      dampingFactor: 0.05,
      enableZoom: true,
      enablePan: true,
      enableRotate: true,
      minDistance: 0,
      maxDistance: Infinity,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      autoRotate: false,
      autoRotateSpeed: 2.0,
      target: new Vector3(),
      update: vi.fn(),
      dispose: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      rotateLeft: vi.fn(),
      rotateUp: vi.fn(),
    })),
  };
});

// Mock GLTF loader
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      const { Group } = require('three');
      onLoad({ scene: new Group(), animations: [] });
    }),
    setDRACOLoader: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/DRACOLoader.js', () => ({
  DRACOLoader: vi.fn().mockImplementation(() => ({
    setDecoderPath: vi.fn(),
  })),
}));

vi.mock('../src/styles/index.css?inline', () => ({
  default: '.ci-3d-container {}',
}));

describe('Integration: CI3DView lifecycle', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    document.getElementById('ci-3d-styles')?.remove();
  });

  it('full init → DOM creation → destroy lifecycle', async () => {
    const onLoadStart = vi.fn();
    const instance = new CI3DView(container, {
      src: 'model.glb',
      alt: 'Test model',
      fullscreenButton: true,
      screenshotButton: true,
      onLoadStart,
    });

    // DOM structure created (synchronous)
    expect(container.classList.contains('ci-3d-container')).toBe(true);
    expect(container.querySelector('.ci-3d-canvas')).toBeTruthy();
    expect(container.querySelector('.ci-3d-loading')).toBeTruthy();
    expect(container.querySelector('.ci-3d-error')).toBeTruthy();
    expect(container.querySelector('.ci-3d-controls')).toBeTruthy();
    expect(container.querySelector('.ci-3d-fullscreen-btn')).toBeTruthy();

    // Toolbar is created after async model load
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector('.ci-3d-toolbar-btn[aria-label="Take screenshot"]')).toBeTruthy();

    // ARIA attributes
    expect(container.getAttribute('role')).toBe('application');
    expect(container.getAttribute('aria-roledescription')).toBe('3D viewer');
    expect(container.getAttribute('tabindex')).toBe('0');

    // Canvas ARIA
    const canvas = container.querySelector('.ci-3d-canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toBe('Test model');

    // Loading overlay has ARIA
    const loading = container.querySelector('.ci-3d-loading');
    expect(loading?.getAttribute('aria-live')).toBe('polite');

    // Error overlay has ARIA
    const error = container.querySelector('.ci-3d-error');
    expect(error?.getAttribute('role')).toBe('alert');

    // onLoadStart was called
    expect(onLoadStart).toHaveBeenCalled();

    // Three.js objects are available
    const threeObjects = instance.getThreeObjects();
    expect(threeObjects.scene).toBeTruthy();
    expect(threeObjects.camera).toBeTruthy();
    expect(threeObjects.renderer).toBeTruthy();

    // Destroy cleans up everything
    instance.destroy();
    expect(container.querySelector('.ci-3d-canvas')).toBeNull();
    expect(container.querySelector('.ci-3d-loading')).toBeNull();
    expect(container.querySelector('.ci-3d-error')).toBeNull();
    expect(container.querySelector('.ci-3d-controls')).toBeNull();
    expect(container.classList.contains('ci-3d-container')).toBe(false);
  });

  it('theme switching via update()', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });

    expect(container.classList.contains('ci-3d-theme-dark')).toBe(false);

    instance.update({ theme: 'dark' });
    expect(container.classList.contains('ci-3d-theme-dark')).toBe(true);

    instance.update({ theme: 'light' });
    expect(container.classList.contains('ci-3d-theme-dark')).toBe(false);

    instance.destroy();
  });

  it('multiple instances on same page', () => {
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    c1.style.width = '400px';
    c1.style.height = '300px';
    c2.style.width = '400px';
    c2.style.height = '300px';
    document.body.appendChild(c1);
    document.body.appendChild(c2);

    const i1 = new CI3DView(c1, { src: 'model1.glb' });
    const i2 = new CI3DView(c2, { src: 'model2.glb' });

    expect(c1.querySelector('.ci-3d-canvas')).toBeTruthy();
    expect(c2.querySelector('.ci-3d-canvas')).toBeTruthy();

    // CSS is injected once (idempotent)
    const styles = document.querySelectorAll('#ci-3d-styles');
    expect(styles.length).toBe(1);

    i1.destroy();
    i2.destroy();
    document.body.removeChild(c1);
    document.body.removeChild(c2);
  });

  it('autoInit discovers elements and initializes them', () => {
    const el1 = document.createElement('div');
    el1.setAttribute('data-ci-3d-src', 'auto1.glb');
    el1.setAttribute('data-ci-3d-alt', 'Auto model 1');
    el1.setAttribute('data-ci-3d-theme', 'dark');
    el1.style.width = '400px';
    el1.style.height = '300px';
    document.body.appendChild(el1);

    const instances = CI3DView.autoInit();
    expect(instances.length).toBeGreaterThanOrEqual(1);

    // The element should be initialized
    expect(el1.classList.contains('ci-3d-container')).toBe(true);
    expect(el1.classList.contains('ci-3d-theme-dark')).toBe(true);

    instances.forEach((i) => i.destroy());
    document.body.removeChild(el1);
  });

  it('controls visibility matches config', () => {
    // No buttons
    const i1 = new CI3DView(container, {
      src: 'model.glb',
      fullscreenButton: false,
      screenshotButton: false,
    });
    expect(container.querySelector('.ci-3d-controls')).toBeNull();
    i1.destroy();

    // Only fullscreen
    const c2 = document.createElement('div');
    c2.style.width = '800px';
    c2.style.height = '600px';
    document.body.appendChild(c2);
    const i2 = new CI3DView(c2, {
      src: 'model.glb',
      fullscreenButton: true,
      screenshotButton: false,
    });
    expect(c2.querySelector('.ci-3d-fullscreen-btn')).toBeTruthy();
    expect(c2.querySelector('.ci-3d-toolbar-btn[aria-label="Take screenshot"]')).toBeNull();
    i2.destroy();
    document.body.removeChild(c2);
  });
});
