import type { Object3D, Material, Texture } from 'three';

export function disposeObject3D(object: Object3D): void {
  const disposedMaterials = new Set<Material>();
  const disposedTextures = new Set<Texture>();

  object.traverse((child) => {
    // Handle Mesh, Line, LineSegments, Points, Sprite
    const meshLike = child as Object3D & { geometry?: { dispose(): void }; material?: Material | Material[] };

    if (meshLike.geometry) {
      meshLike.geometry.dispose();
    }

    if (meshLike.material) {
      const materials: Material[] = Array.isArray(meshLike.material)
        ? meshLike.material
        : [meshLike.material];

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
