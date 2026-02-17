import {
  Box3,
  Vector3,
  PlaneGeometry,
  ShadowMaterial,
  Mesh,
  Scene,
} from 'three';

export function createGroundPlane(
  box: Box3,
  config: { shadowOpacity: number },
): Mesh {
  const size = box.getSize(new Vector3());
  const diameter = Math.max(size.x, size.y, size.z) * 3;

  const geometry = new PlaneGeometry(diameter, diameter);
  const material = new ShadowMaterial({ opacity: config.shadowOpacity });
  const plane = new Mesh(geometry, material);

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = box.min.y;
  plane.receiveShadow = true;

  return plane;
}

export function disposeGroundPlane(plane: Mesh, scene: Scene): void {
  scene.remove(plane);
  plane.geometry.dispose();
  (plane.material as ShadowMaterial).dispose();
}
