import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

export class TDSFormatLoader implements FormatLoader {
  extensions = ['.3ds'];

  async load(
    url: string,
    _options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const loader = new TDSLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (group) => {
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
