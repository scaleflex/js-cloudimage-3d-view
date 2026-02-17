import { describe, it, expect } from 'vitest';
import { Scene, Box3, Vector3 } from 'three';
import { create3PointLighting, applyLightingConfig, reduceLightingForIBL, disposeLighting } from '../src/lighting/lighting';
import { createGroundPlane, disposeGroundPlane } from '../src/lighting/shadows';

describe('3-point lighting', () => {
  it('creates 4 lights (ambient + 3 directional)', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    expect(lights.ambient).toBeTruthy();
    expect(lights.key).toBeTruthy();
    expect(lights.fill).toBeTruthy();
    expect(lights.rim).toBeTruthy();
  });

  it('uses default intensities', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    expect(lights.ambient.intensity).toBe(0.4);
    expect(lights.key.intensity).toBe(1.0);
    expect(lights.fill.intensity).toBe(0.5);
    expect(lights.rim.intensity).toBe(0.7);
  });

  it('key light casts shadows by default', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    expect(lights.key.castShadow).toBe(true);
    expect(lights.fill.castShadow).toBe(false);
    expect(lights.rim.castShadow).toBe(false);
  });

  it('applies custom lighting config', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    applyLightingConfig(lights, {
      ambientIntensity: 0.8,
      keyLight: { intensity: 1.5 },
    });

    expect(lights.ambient.intensity).toBe(0.8);
    expect(lights.key.intensity).toBe(1.5);
  });

  it('applies custom config on creation', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene, {
      ambientIntensity: 0.6,
      keyLight: { intensity: 2.0, position: [10, 10, 10] },
    });

    expect(lights.ambient.intensity).toBe(0.6);
    expect(lights.key.intensity).toBe(2.0);
    expect(lights.key.position.x).toBe(10);
  });

  it('reduces lighting for IBL', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    reduceLightingForIBL(lights);

    expect(lights.ambient.intensity).toBeCloseTo(0.2);
    expect(lights.key.intensity).toBeCloseTo(0.5);
    expect(lights.fill.intensity).toBeCloseTo(0.25);
    expect(lights.rim.intensity).toBeCloseTo(0.35);
  });

  it('disposes all lights', () => {
    const scene = new Scene();
    const lights = create3PointLighting(scene);

    expect(scene.children.length).toBe(4);
    disposeLighting(lights, scene);
    expect(scene.children.length).toBe(0);
  });
});

describe('ground plane shadows', () => {
  it('creates a ground plane sized to model footprint', () => {
    const box = new Box3(
      new Vector3(-1, -1, -1),
      new Vector3(1, 1, 1),
    );

    const plane = createGroundPlane(box, { shadowOpacity: 0.3 });

    expect(plane).toBeTruthy();
    expect(plane.receiveShadow).toBe(true);
    expect(plane.position.y).toBe(-1);
    expect(plane.rotation.x).toBeCloseTo(-Math.PI / 2);
  });

  it('uses configured shadow opacity', () => {
    const box = new Box3(
      new Vector3(-2, 0, -2),
      new Vector3(2, 4, 2),
    );

    const plane = createGroundPlane(box, { shadowOpacity: 0.5 });
    expect((plane.material as any).opacity).toBe(0.5);
  });

  it('disposes ground plane', () => {
    const scene = new Scene();
    const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
    const plane = createGroundPlane(box, { shadowOpacity: 0.3 });
    scene.add(plane);

    expect(scene.children.length).toBe(1);
    disposeGroundPlane(plane, scene);
    expect(scene.children.length).toBe(0);
  });
});
