import { WebGLRenderer, Scene, PerspectiveCamera, Vector2 } from 'three';

export function captureScreenshot(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  scale = 2,
): string {
  const size = renderer.getSize(new Vector2());

  renderer.setSize(size.width * scale, size.height * scale, false);
  try {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  } catch {
    return '';
  } finally {
    renderer.setSize(size.width, size.height, false);
  }
}

export function downloadScreenshot(dataUrl: string, filename = 'screenshot'): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
