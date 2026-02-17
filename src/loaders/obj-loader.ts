import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { MeshStandardMaterial } from 'three';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

function inferMtlUrl(objUrl: string): string {
  return objUrl.replace(/\.obj(\?.*)?$/i, '.mtl$1');
}

export class OBJFormatLoader implements FormatLoader {
  extensions = ['.obj'];

  async load(
    url: string,
    options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const objLoader = new OBJLoader();

    // Only attempt MTL loading if explicitly provided
    if (options.mtlUrl) {
      try {
        const materials = await this.loadMtl(options.mtlUrl);
        if (materials) {
          materials.preload();
          objLoader.setMaterials(materials);
        }
      } catch {
        // MTL failed — continue without materials
      }
    }

    return new Promise((resolve, reject) => {
      objLoader.load(
        url,
        (group) => {
          // Upgrade MeshPhongMaterial to MeshStandardMaterial
          group.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              if (mat.type === 'MeshPhongMaterial') {
                const standard = new MeshStandardMaterial({
                  color: mat.color,
                  map: mat.map,
                  roughness: 0.7,
                  metalness: 0.0,
                });
                child.material = standard;
                mat.dispose();
              }
            }
          });

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

  private loadMtl(url: string): Promise<any> {
    const loader = new MTLLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }
}
