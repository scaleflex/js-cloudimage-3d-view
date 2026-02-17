import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Mesh, MeshStandardMaterial, Group } from 'three';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

export class STLFormatLoader implements FormatLoader {
  extensions = ['.stl'];

  async load(
    url: string,
    _options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (geometry) => {
          // Merge coincident vertices so computeVertexNormals produces
          // smooth (averaged) normals instead of per-face flat normals.
          const merged = mergeVertices(geometry);
          merged.computeVertexNormals();

          const hasVertexColors = !!merged.getAttribute('color');
          const material = new MeshStandardMaterial({
            color: hasVertexColors ? 0xffffff : 0x808080,
            vertexColors: hasVertexColors,
            roughness: 0.5,
            metalness: 0.3,
            flatShading: false,
          });
          const mesh = new Mesh(merged, material);
          const group = new Group();
          group.add(mesh);

          resolve({ model: group, animations: [] });
        },
        (event) => {
          if (event.total > 0 && onProgress) {
            onProgress(Math.min(event.loaded / event.total, 1));
          }
        },
        (error) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }
}
