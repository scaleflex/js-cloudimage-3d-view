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
    })),
  };
});

// Mock loaders
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

// Need to mock the CSS import
vi.mock('../src/styles/index.css?inline', () => ({
  default: '.ci-3d-container { position: relative; }',
}));

describe('CI3DView', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Clean up injected styles
    document.getElementById('ci-3d-styles')?.remove();
  });

  it('instantiates with an element', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    expect(instance).toBeTruthy();
    instance.destroy();
  });

  it('instantiates with a selector', () => {
    container.id = 'test-viewer';
    const instance = new CI3DView('#test-viewer', { src: 'model.glb' });
    expect(instance).toBeTruthy();
    instance.destroy();
  });

  it('applies container classes', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    expect(container.classList.contains('ci-3d-container')).toBe(true);
    instance.destroy();
  });

  it('applies dark theme class', () => {
    const instance = new CI3DView(container, { src: 'model.glb', theme: 'dark' });
    expect(container.classList.contains('ci-3d-theme-dark')).toBe(true);
    instance.destroy();
  });

  it('creates canvas element', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    const canvas = container.querySelector('.ci-3d-canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.tagName).toBe('CANVAS');
    instance.destroy();
  });

  it('creates loading overlay', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    const loading = container.querySelector('.ci-3d-loading');
    expect(loading).toBeTruthy();
    instance.destroy();
  });

  it('creates error overlay', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    const error = container.querySelector('.ci-3d-error');
    expect(error).toBeTruthy();
    instance.destroy();
  });

  it('creates fullscreen button when configured', () => {
    const instance = new CI3DView(container, { src: 'model.glb', fullscreenButton: true });
    const btn = container.querySelector('.ci-3d-fullscreen-btn');
    expect(btn).toBeTruthy();
    instance.destroy();
  });

  it('creates screenshot button when configured', () => {
    const instance = new CI3DView(container, {
      src: 'model.glb',
      screenshotButton: true,
    });
    const btn = container.querySelector('.ci-3d-screenshot-btn');
    expect(btn).toBeTruthy();
    instance.destroy();
  });

  it('sets ARIA attributes on container', () => {
    const instance = new CI3DView(container, {
      src: 'model.glb',
      alt: 'Test model',
    });

    expect(container.getAttribute('role')).toBe('application');
    expect(container.getAttribute('aria-roledescription')).toBe('3D viewer');
    expect(container.getAttribute('aria-label')).toBe('3D model viewer: Test model');
    expect(container.getAttribute('tabindex')).toBe('0');
    instance.destroy();
  });

  it('sets ARIA attributes on canvas', () => {
    const instance = new CI3DView(container, {
      src: 'model.glb',
      alt: 'Test model',
    });

    const canvas = container.querySelector('.ci-3d-canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toBe('Test model');
    instance.destroy();
  });

  it('destroy removes DOM elements', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });

    expect(container.querySelector('.ci-3d-canvas')).toBeTruthy();
    expect(container.querySelector('.ci-3d-loading')).toBeTruthy();

    instance.destroy();

    expect(container.querySelector('.ci-3d-canvas')).toBeNull();
    expect(container.querySelector('.ci-3d-loading')).toBeNull();
    expect(container.classList.contains('ci-3d-container')).toBe(false);
  });

  it('destroy is idempotent', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    instance.destroy();
    instance.destroy(); // Should not throw
  });

  it('getElements returns container and canvas', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    const elements = instance.getElements();

    expect(elements.container).toBe(container);
    expect(elements.canvas).toBeTruthy();
    instance.destroy();
  });

  it('getThreeObjects returns scene, camera, renderer', () => {
    const instance = new CI3DView(container, { src: 'model.glb' });
    const objects = instance.getThreeObjects();

    expect(objects.scene).toBeTruthy();
    expect(objects.camera).toBeTruthy();
    expect(objects.renderer).toBeTruthy();
    instance.destroy();
  });
});

describe('CI3DView.autoInit', () => {
  it('initializes elements with data-ci-3d-src', () => {
    const el1 = document.createElement('div');
    el1.setAttribute('data-ci-3d-src', 'model1.glb');
    el1.style.width = '400px';
    el1.style.height = '300px';
    document.body.appendChild(el1);

    const el2 = document.createElement('div');
    el2.setAttribute('data-ci-3d-src', 'model2.glb');
    el2.style.width = '400px';
    el2.style.height = '300px';
    document.body.appendChild(el2);

    const instances = CI3DView.autoInit();
    expect(instances.length).toBe(2);

    instances.forEach((i) => i.destroy());
    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });
});
