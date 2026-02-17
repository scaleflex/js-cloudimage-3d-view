import { describe, it, expect } from 'vitest';
import { Box3, Vector3, Object3D, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera } from 'three';
import {
  computeBoundingBox,
  computeBoundingSphere,
  centerModel,
  scaleToFit,
  fitCameraToModel,
  degreesToRadians,
  radiansToDegrees,
} from '../src/utils/math';

describe('math utils', () => {
  function createTestMesh(size = 4) {
    const geometry = new BoxGeometry(size, size, size);
    const material = new MeshBasicMaterial();
    return new Mesh(geometry, material);
  }

  describe('computeBoundingBox', () => {
    it('computes bounding box for a mesh', () => {
      const mesh = createTestMesh(4);
      const box = computeBoundingBox(mesh);
      expect(box.min.x).toBeCloseTo(-2);
      expect(box.max.x).toBeCloseTo(2);
    });
  });

  describe('computeBoundingSphere', () => {
    it('computes bounding sphere for a mesh', () => {
      const mesh = createTestMesh(4);
      const sphere = computeBoundingSphere(mesh);
      expect(sphere.center.x).toBeCloseTo(0);
      expect(sphere.radius).toBeGreaterThan(0);
    });
  });

  describe('centerModel', () => {
    it('centers a model at origin', () => {
      const mesh = createTestMesh(2);
      mesh.position.set(10, 20, 30);
      mesh.updateMatrixWorld(true);

      const box = computeBoundingBox(mesh);
      centerModel(mesh, box);
      mesh.updateMatrixWorld(true);

      const newBox = computeBoundingBox(mesh);
      const center = newBox.getCenter(new Vector3());
      expect(center.x).toBeCloseTo(0, 0);
      expect(center.y).toBeCloseTo(0, 0);
      expect(center.z).toBeCloseTo(0, 0);
    });
  });

  describe('scaleToFit', () => {
    it('scales model to fit target size', () => {
      const mesh = createTestMesh(10);
      const box = computeBoundingBox(mesh);
      const scale = scaleToFit(mesh, box, 2);

      expect(scale).toBeCloseTo(0.2);
    });

    it('returns 1 for zero-size model', () => {
      const obj = new Object3D();
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
      const scale = scaleToFit(obj, box, 2);
      expect(scale).toBe(1);
    });
  });

  describe('fitCameraToModel', () => {
    it('positions camera to frame model', () => {
      const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
      const mesh = createTestMesh(2);
      const sphere = computeBoundingSphere(mesh);

      fitCameraToModel(camera, sphere);

      expect(camera.position.z).toBeGreaterThan(0);
      expect(camera.near).toBeGreaterThan(0);
      expect(camera.far).toBeGreaterThan(camera.near);
    });
  });

  describe('degreesToRadians', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(degreesToRadians(0)).toBe(0);
    });

    it('converts 180 degrees to PI', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    });

    it('converts 90 degrees to PI/2', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('radiansToDegrees', () => {
    it('converts PI to 180 degrees', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    });
  });
});
