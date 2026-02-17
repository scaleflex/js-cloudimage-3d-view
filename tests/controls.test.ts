import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerspectiveCamera, Sphere, Vector3 } from 'three';
import { setupOrbitControls, updateControlsConstraints } from '../src/controls/orbit-controls';
import { AutoRotateController } from '../src/controls/auto-rotate';
import { degreesToRadians } from '../src/utils/math';

// Mock OrbitControls since it requires a real DOM renderer
vi.mock('three/addons/controls/OrbitControls.js', () => {
  const listeners: Record<string, Function[]> = {};
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
      rotateLeft: vi.fn(),
      rotateUp: vi.fn(),
      addEventListener: vi.fn((event: string, fn: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
      }),
      removeEventListener: vi.fn((event: string, fn: Function) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((f) => f !== fn);
        }
      }),
      // Helper to trigger events in tests
      _emit: (event: string) => {
        listeners[event]?.forEach((fn) => fn());
      },
      _listeners: listeners,
    })),
  };
});

describe('setupOrbitControls', () => {
  it('creates controls with damping enabled', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, {
      src: 'model.glb',
      damping: true,
      dampingFactor: 0.1,
    } as any);

    expect(controls.enableDamping).toBe(true);
    expect(controls.dampingFactor).toBe(0.1);
  });

  it('sets polar angle constraints from degrees', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, {
      src: 'model.glb',
      polarAngleMin: 10,
      polarAngleMax: 170,
    } as any);

    expect(controls.minPolarAngle).toBeCloseTo(degreesToRadians(10));
    expect(controls.maxPolarAngle).toBeCloseTo(degreesToRadians(170));
  });

  it('disables controls when configured', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, {
      src: 'model.glb',
      controls: false,
      zoom: false,
      pan: false,
    } as any);

    expect(controls.enableRotate).toBe(false);
    expect(controls.enableZoom).toBe(false);
    expect(controls.enablePan).toBe(false);
  });
});

describe('updateControlsConstraints', () => {
  it('sets zoom limits from model sphere', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, { src: 'model.glb' } as any);

    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    updateControlsConstraints(controls, sphere, { src: 'model.glb' } as any);

    expect(controls.minDistance).toBeCloseTo(2.4);
    expect(controls.maxDistance).toBeCloseTo(10);
  });

  it('respects custom zoom limits', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, { src: 'model.glb' } as any);

    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    updateControlsConstraints(controls, sphere, {
      src: 'model.glb',
      zoomMin: 1,
      zoomMax: 20,
    } as any);

    expect(controls.minDistance).toBe(1);
    expect(controls.maxDistance).toBe(20);
  });
});

describe('AutoRotateController', () => {
  it('starts auto-rotation with correct speed conversion', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, { src: 'model.glb' } as any);

    const autoRotate = new AutoRotateController(controls, {
      autoRotateSpeed: 0.5,
      autoRotateDelay: 3000,
    });

    autoRotate.start();

    expect(controls.autoRotate).toBe(true);
    expect(controls.autoRotateSpeed).toBe(30); // 0.5 * 60
  });

  it('stops auto-rotation', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, { src: 'model.glb' } as any);

    const autoRotate = new AutoRotateController(controls, {
      autoRotateSpeed: 0.5,
      autoRotateDelay: 3000,
    });

    autoRotate.start();
    autoRotate.stop();

    expect(controls.autoRotate).toBe(false);
  });

  it('pauses on interaction and resumes after delay', () => {
    vi.useFakeTimers();

    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const canvas = document.createElement('canvas');
    const controls = setupOrbitControls(camera, canvas, { src: 'model.glb' } as any);

    const autoRotate = new AutoRotateController(controls, {
      autoRotateSpeed: 0.5,
      autoRotateDelay: 3000,
    });

    autoRotate.start();
    expect(controls.autoRotate).toBe(true);

    // Simulate interaction start
    (controls as any)._emit('start');
    expect(controls.autoRotate).toBe(false);

    // Simulate interaction end
    (controls as any)._emit('end');

    // Still paused
    vi.advanceTimersByTime(2000);
    expect(controls.autoRotate).toBe(false);

    // Should resume after delay
    vi.advanceTimersByTime(1000);
    expect(controls.autoRotate).toBe(true);

    autoRotate.destroy();
    vi.useRealTimers();
  });
});
