import type { FormatLoader } from '../core/types';

/** Maps an extension (e.g. '.glb') to a dynamic import that returns a FormatLoader. */
const loaderImports: Record<string, () => Promise<FormatLoader>> = {
  '.glb':  () => import('./gltf-loader').then((m) => new m.GLTFFormatLoader()),
  '.gltf': () => import('./gltf-loader').then((m) => new m.GLTFFormatLoader()),
  '.obj':  () => import('./obj-loader').then((m) => new m.OBJFormatLoader()),
  '.stl':  () => import('./stl-loader').then((m) => new m.STLFormatLoader()),
  '.fbx':  () => import('./fbx-loader').then((m) => new m.FBXFormatLoader()),
  '.3ds':  () => import('./tds-loader').then((m) => new m.TDSFormatLoader()),
  '.amf':  () => import('./amf-loader').then((m) => new m.AMFFormatLoader()),
};

/** Cache of already-loaded loader instances (keyed by extension). */
const loaderCache = new Map<string, FormatLoader>();

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

export async function getLoader(url: string): Promise<FormatLoader | null> {
  let ext = detectFormat(url);

  // Default to GLTF for extensionless URLs (e.g. CDN hashed paths)
  if (!ext && !extractFilename(url).includes('.')) {
    ext = '.glb';
  }

  if (!ext) return null;

  // Return cached instance if available
  const cached = loaderCache.get(ext);
  if (cached) return cached;

  // Check dynamic import map
  const importFn = loaderImports[ext];
  if (!importFn) return null;

  const loader = await importFn();
  loaderCache.set(ext, loader);

  // Cache shared extensions (e.g. .glb and .gltf share the same loader)
  for (const loaderExt of loader.extensions) {
    if (!loaderCache.has(loaderExt)) {
      loaderCache.set(loaderExt, loader);
    }
  }

  return loader;
}

export function registerLoader(loader: FormatLoader): void {
  for (const ext of loader.extensions) {
    if (!loaderCache.has(ext)) {
      loaderCache.set(ext, loader);
    }
  }
}
