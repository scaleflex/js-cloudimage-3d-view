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

export function detectFormat(url: string): string {
  // Strip query string and hash
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Extract just the pathname/filename (after the last /)
  const lastSlash = cleanUrl.lastIndexOf('/');
  const filename = lastSlash !== -1 ? cleanUrl.substring(lastSlash + 1) : cleanUrl;

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
  if (!ext && !hasFileExtension(url)) {
    return loaders[0]; // GLTFFormatLoader
  }

  return null;
}

function hasFileExtension(url: string): boolean {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const lastSlash = cleanUrl.lastIndexOf('/');
  const filename = lastSlash !== -1 ? cleanUrl.substring(lastSlash + 1) : cleanUrl;
  return filename.includes('.');
}

export function registerLoader(loader: FormatLoader): void {
  loaders.push(loader);
}
