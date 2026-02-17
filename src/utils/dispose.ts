import type { Object3D, Material, Texture } from 'three';

export function disposeObject3D(object: Object3D): void {
  const disposedMaterials = new Set<Material>();
  const disposedTextures = new Set<Texture>();

  object.traverse((child: any) => {
    // Handle Mesh, Line, LineSegments, Points, Sprite
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      const materials: Material[] = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const mat of materials) {
        if (!mat || disposedMaterials.has(mat)) continue;
        disposedMaterials.add(mat);

        for (const key of Object.keys(mat)) {
          const value = (mat as any)[key];
          if (value && typeof value === 'object' && 'isTexture' in value && value.isTexture) {
            if (!disposedTextures.has(value)) {
              disposedTextures.add(value);
              (value as Texture).dispose();
            }
          }
        }
        mat.dispose();
      }
    }
  });
}
