import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

export class FBXFormatLoader implements FormatLoader {
  extensions = ['.fbx'];

  async load(
    url: string,
    _options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const loader = new FBXLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (group) => {
          resolve({ model: group, animations: group.animations || [] });
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
