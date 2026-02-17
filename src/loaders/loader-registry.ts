import type { FormatLoader } from '../core/types';
import { GLTFFormatLoader } from './gltf-loader';
import { OBJFormatLoader } from './obj-loader';
import { STLFormatLoader } from './stl-loader';
import { FBXFormatLoader } from './fbx-loader';
import { TDSFormatLoader } from './tds-loader';
import { AMFFormatLoader } from './amf-loader';

const loaders: FormatLoader[] = [
  new GLTFFormatLoader(),
  new OBJFormatLoader(),
  new STLFormatLoader(),
  new FBXFormatLoader(),
  new TDSFormatLoader(),
  new AMFFormatLoader(),
];

function extractFilename(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const lastSlash = cleanUrl.lastIndexOf('/');
  return lastSlash !== -1 ? cleanUrl.substring(lastSlash + 1) : cleanUrl;
}

export function detectFormat(url: string): string {
  const filename = extractFilename(url);

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';

  const ext = filename.substring(lastDot).toLowerCase();

  // Only return known 3D format extensions
  const knownExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.3ds', '.amf'];
  return knownExtensions.includes(ext) ? ext : '';
}

export function getLoader(url: string): FormatLoader | null {
  const ext = detectFormat(url);

  for (const loader of loaders) {
    if (loader.extensions.includes(ext)) {
      return loader;
    }
  }

  // Default to GLTF for extensionless URLs (e.g. CDN hashed paths)
  if (!ext && !extractFilename(url).includes('.')) {
    return loaders[0]; // GLTFFormatLoader
  }

  return null;
}

export function registerLoader(loader: FormatLoader): void {
  // Deduplicate: skip if a loader for the same extensions already exists
  const isDuplicate = loaders.some((existing) =>
    existing.extensions.some((ext) => loader.extensions.includes(ext)),
  );
  if (!isDuplicate) {
    loaders.push(loader);
  }
}
