import { AMFLoader } from 'three/addons/loaders/AMFLoader.js';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';

export class AMFFormatLoader implements FormatLoader {
  extensions = ['.amf'];

  async load(
    url: string,
    _options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const loader = new AMFLoader();

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
