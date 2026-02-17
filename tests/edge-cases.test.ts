import { describe, it, expect, vi, afterEach } from 'vitest';
import { CI3DView } from '../src/core/ci-3d-view';
import { validateConfig, DEFAULT_CONFIG } from '../src/core/config';
import { detectFormat, getLoader } from '../src/loaders/loader-registry';

// Mocks
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

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad, _onProgress, onError) => {
      if (url.includes('fail')) {
        onError(new Error('Load failed'));
      } else {
        const { Group } = require('three');
        onLoad({ scene: new Group(), animations: [] });
      }
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

afterEach(() => {
  document.getElementById('ci-3d-styles')?.remove();
});

describe('Edge cases', () => {
  it('validates missing src', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates invalid theme', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: 'a.glb', theme: 'neon' as any });
    expect(errors.some((e) => e.includes('theme'))).toBe(true);
  });

  it('validates invalid toneMapping', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: 'a.glb', toneMapping: 'hdr' as any });
    expect(errors.some((e) => e.includes('toneMapping'))).toBe(true);
  });

  it('handles unsupported format gracefully', () => {
    const loader = getLoader('model.dwg');
    expect(loader).toBeNull();
  });

  it('handles URLs with no extension', () => {
    const ext = detectFormat('https://cdn.example.com/abc123');
    expect(ext).toBe('');
  });

  it('handles URLs with query strings and hashes', () => {
    expect(detectFormat('model.glb?v=2&token=abc')).toBe('.glb');
    expect(detectFormat('model.obj#section')).toBe('.obj');
    expect(detectFormat('model.gltf?v=1#top')).toBe('.gltf');
  });

  it('rapid init and destroy does not throw', () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const i1 = new CI3DView(c, { src: 'model.glb' });
    i1.destroy();

    const c2 = document.createElement('div');
    c2.style.width = '400px';
    c2.style.height = '300px';
    document.body.appendChild(c2);

    const i2 = new CI3DView(c2, { src: 'model.glb' });
    i2.destroy();

    document.body.removeChild(c);
    document.body.removeChild(c2);
  });

  it('double destroy is safe', () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const instance = new CI3DView(c, { src: 'model.glb' });
    instance.destroy();
    expect(() => instance.destroy()).not.toThrow();

    document.body.removeChild(c);
  });

  it('handles loading failure with onError callback', async () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const onError = vi.fn();
    const instance = new CI3DView(c, {
      src: 'fail.glb',
      onError,
    });

    // Wait for async load to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

    // Error overlay should be visible
    const errorOverlay = c.querySelector('.ci-3d-error');
    expect(errorOverlay?.classList.contains('ci-3d-error--visible')).toBe(true);

    instance.destroy();
    document.body.removeChild(c);
  });

  it('handles element not found', () => {
    expect(() => new CI3DView('#nonexistent', { src: 'model.glb' })).toThrow(
      'Element not found',
    );
  });

  it('update with partial config does not break', () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const instance = new CI3DView(c, { src: 'model.glb' });

    // Should not throw
    instance.update({ shadows: false });
    instance.update({ damping: false });
    instance.update({ theme: 'dark' });
    instance.update({ theme: 'light' });

    instance.destroy();
    document.body.removeChild(c);
  });

  it('getAnimations returns empty when no model loaded', () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const instance = new CI3DView(c, { src: 'model.glb' });
    expect(instance.getAnimations()).toEqual([]);

    instance.destroy();
    document.body.removeChild(c);
  });

  it('playAnimation is safe when no model loaded', () => {
    const c = document.createElement('div');
    c.style.width = '400px';
    c.style.height = '300px';
    document.body.appendChild(c);

    const instance = new CI3DView(c, { src: 'model.glb' });

    // Should not throw
    instance.playAnimation();
    instance.pauseAnimation();
    instance.stopAnimation();
    instance.setAnimationSpeed(2);

    instance.destroy();
    document.body.removeChild(c);
  });
});
