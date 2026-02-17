import { describe, it, expect } from 'vitest';
import { parseDataAttributes, mergeConfig, validateConfig, DEFAULT_CONFIG } from '../src/core/config';

describe('parseDataAttributes', () => {
  it('parses string attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-src', 'model.glb');
    el.setAttribute('data-ci-3d-alt', 'A 3D model');

    const config = parseDataAttributes(el);
    expect(config.src).toBe('model.glb');
    expect(config.alt).toBe('A 3D model');
  });

  it('parses boolean attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-auto-rotate', 'true');
    el.setAttribute('data-ci-3d-shadows', 'false');

    const config = parseDataAttributes(el);
    expect(config.autoRotate).toBe(true);
    expect(config.shadows).toBe(false);
  });

  it('parses number attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-auto-rotate-speed', '0.5');
    el.setAttribute('data-ci-3d-shadow-opacity', '0.3');

    const config = parseDataAttributes(el);
    expect(config.autoRotateSpeed).toBe(0.5);
    expect(config.shadowOpacity).toBe(0.3);
  });

  it('parses JSON attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-camera-position', '[1, 2, 3]');

    const config = parseDataAttributes(el);
    expect(config.cameraPosition).toEqual([1, 2, 3]);
  });

  it('parses lighting JSON', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-lighting', '{"ambientIntensity": 0.6}');

    const config = parseDataAttributes(el);
    expect(config.lighting).toEqual({ ambientIntensity: 0.6 });
  });

  it('skips malformed JSON', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-camera-position', 'not-json');

    const config = parseDataAttributes(el);
    expect(config.cameraPosition).toBeUndefined();
  });

  it('ignores unknown attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-3d-nonexistent', 'foo');
    el.setAttribute('data-ci-3d-src', 'model.glb');

    const config = parseDataAttributes(el);
    expect(config.src).toBe('model.glb');
    expect((config as any).nonexistent).toBeUndefined();
  });

  it('parses animation as number or string', () => {
    const el1 = document.createElement('div');
    el1.setAttribute('data-ci-3d-animation', '0');
    expect(parseDataAttributes(el1).animation).toBe(0);

    const el2 = document.createElement('div');
    el2.setAttribute('data-ci-3d-animation', 'Walk');
    expect(parseDataAttributes(el2).animation).toBe('Walk');
  });
});

describe('mergeConfig', () => {
  it('uses defaults for missing values', () => {
    const config = mergeConfig({ src: 'model.glb' });
    expect(config.controls).toBe(true);
    expect(config.shadows).toBe(true);
    expect(config.toneMapping).toBe('aces');
  });

  it('overrides defaults with user values', () => {
    const config = mergeConfig({
      src: 'model.glb',
      shadows: false,
      autoRotate: true,
    });
    expect(config.shadows).toBe(false);
    expect(config.autoRotate).toBe(true);
  });

  it('preserves src', () => {
    const config = mergeConfig({ src: 'test.glb' });
    expect(config.src).toBe('test.glb');
  });
});

describe('validateConfig', () => {
  it('reports missing src', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: '' });
    expect(errors.some((e) => e.includes('src'))).toBe(true);
  });

  it('reports invalid theme', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: 'model.glb', theme: 'neon' as any });
    expect(errors.some((e) => e.includes('theme'))).toBe(true);
  });

  it('reports invalid toneMapping', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: 'model.glb', toneMapping: 'hdr' as any });
    expect(errors.some((e) => e.includes('toneMapping'))).toBe(true);
  });

  it('returns no errors for valid config', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, src: 'model.glb' });
    expect(errors).toHaveLength(0);
  });
});
