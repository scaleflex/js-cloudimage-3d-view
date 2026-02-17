import { WebGLRenderer, Scene, PerspectiveCamera, Vector2 } from 'three';

export function captureScreenshot(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  scale = 2,
): string {
  const size = renderer.getSize(new Vector2());

  renderer.setSize(size.width * scale, size.height * scale, false);
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');
  renderer.setSize(size.width, size.height, false);

  return dataUrl;
}

export function downloadScreenshot(dataUrl: string, filename = 'screenshot'): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
