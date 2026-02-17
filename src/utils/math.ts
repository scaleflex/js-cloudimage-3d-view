import {
  Box3,
  Vector3,
  Sphere,
  Object3D,
  PerspectiveCamera,
} from 'three';

export function computeBoundingBox(object: Object3D): Box3 {
  // Update world matrices first
  object.updateWorldMatrix(true, true);

  const box = new Box3();

  // Compute from mesh geometries directly for accuracy (avoids skeleton bone inflation)
  object.traverse((child: any) => {
    if (child.isMesh && child.geometry) {
      child.geometry.computeBoundingBox();
      const geomBox = child.geometry.boundingBox;
      if (geomBox && !geomBox.isEmpty()) {
        const worldBox = geomBox.clone().applyMatrix4(child.matrixWorld);
        box.union(worldBox);
      }
    }
  });

  // Fallback to setFromObject if no mesh geometries found
  if (box.isEmpty()) {
    box.setFromObject(object);
  }

  return box;
}

export function computeBoundingSphere(object: Object3D): Sphere {
  const box = computeBoundingBox(object);
  const sphere = new Sphere();
  box.getBoundingSphere(sphere);
  return sphere;
}

export function centerModel(model: Object3D, box: Box3): Vector3 {
  const center = box.getCenter(new Vector3());
  model.position.sub(center);
  return center;
}

export function scaleToFit(model: Object3D, box: Box3, targetSize = 2): number {
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim === 0) return 1;
  const scale = targetSize / maxDim;
  model.scale.set(scale, scale, scale);
  return scale;
}

export function fitCameraToModel(
  camera: PerspectiveCamera,
  sphere: Sphere,
  padding = 1.2,
): void {
  const fov = camera.fov * (Math.PI / 180);
  const distance = (sphere.radius * padding) / Math.sin(fov / 2);
  camera.position.set(0, sphere.radius * 0.5, distance);
  camera.lookAt(0, 0, 0);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}
