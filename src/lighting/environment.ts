import {
  PMREMGenerator,
  WebGLRenderer,
  Scene,
} from 'three';

export async function loadEnvironmentMap(
  url: string,
  renderer: WebGLRenderer,
  scene: Scene,
  showBackground: boolean,
): Promise<void> {
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const cleanUrl = url.split('?')[0].split('#')[0];
  const isExr = cleanUrl.toLowerCase().endsWith('.exr');

  let loader: any;
  if (isExr) {
    const { EXRLoader } = await import('three/addons/loaders/EXRLoader.js');
    loader = new EXRLoader();
  } else {
    const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
    loader = new RGBELoader();
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture: any) => {
        // Create new envMap first, then dispose old (so old survives if this throws)
        const envMap = pmrem.fromEquirectangular(texture).texture;

        // Dispose old environment only after new envMap created successfully
        disposeEnvironment(scene);
        scene.environment = envMap;
        if (showBackground) scene.background = envMap;
        texture.dispose();
        pmrem.dispose();
        resolve();
      },
      undefined,
      (error: any) => {
        pmrem.dispose();
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

export function disposeEnvironment(scene: Scene): void {
  const sameTexture = scene.background != null && scene.background === scene.environment;

  if (scene.environment) {
    (scene.environment as any).dispose?.();
    scene.environment = null;
  }
  if (scene.background && typeof (scene.background as any).dispose === 'function') {
    // Only dispose background if it's a different texture than environment
    // and it is actually a texture (not a Color set by the theme)
    if (!sameTexture) {
      (scene.background as any).dispose();
    }
    scene.background = null;
  }
  // Don't null out Color backgrounds — they belong to the theme, not the environment
}
