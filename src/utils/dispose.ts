import type { Object3D, Material, Texture } from 'three';

export function disposeObject3D(object: Object3D): void {
  object.traverse((child: any) => {
    if (child.isMesh) {
      child.geometry?.dispose();

      const materials: Material[] = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const mat of materials) {
        if (!mat) continue;
        for (const key of Object.keys(mat)) {
          const value = (mat as any)[key];
          if (value && typeof value === 'object' && 'isTexture' in value && value.isTexture) {
            (value as Texture).dispose();
          }
        }
        mat.dispose();
      }
    }
  });
}
