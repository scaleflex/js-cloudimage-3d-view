import { STLLoader } from 'three/addons/loaders/STLLoader.js';
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
          geometry.computeVertexNormals();

          const hasVertexColors = !!geometry.getAttribute('color');
          const material = new MeshStandardMaterial({
            color: hasVertexColors ? 0xffffff : 0x808080,
            vertexColors: hasVertexColors,
            roughness: 0.5,
            metalness: 0.3,
          });
          const mesh = new Mesh(geometry, material);
          const group = new Group();
          group.add(mesh);

          resolve({ model: group, animations: [] });
        },
        (event) => {
          if (event.total > 0 && onProgress) {
            onProgress(event.loaded / event.total);
          }
        },
        (error) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }
}
