import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

const DEFAULT_DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

let sharedDraco: DRACOLoader | null = null;
let sharedDracoPath: string | null = null;

function getSharedDRACOLoader(decoderPath: string): DRACOLoader {
  if (!sharedDraco || sharedDracoPath !== decoderPath) {
    sharedDraco = new DRACOLoader();
    sharedDraco.setDecoderPath(decoderPath);
    sharedDracoPath = decoderPath;
  }
  return sharedDraco;
}

export class GLTFFormatLoader implements FormatLoader {
  extensions = ['.glb', '.gltf'];

  async load(
    url: string,
    options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const loader = new GLTFLoader();

    if (options.draco !== false) {
      const draco = getSharedDRACOLoader(options.dracoDecoderPath || DEFAULT_DRACO_PATH);
      loader.setDRACOLoader(draco);
    }

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          resolve({ model: gltf.scene, animations: gltf.animations });
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
