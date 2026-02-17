export function setContainerAria(
  container: HTMLElement,
  alt?: string,
): void {
  container.setAttribute('role', 'application');
  container.setAttribute('aria-roledescription', '3D viewer');
  container.setAttribute('aria-label', `3D model viewer: ${alt || '3D model'}`);
}

export function setCanvasAria(
  canvas: HTMLCanvasElement,
  alt?: string,
): void {
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', alt || '3D model');
}

export function setButtonAria(
  button: HTMLElement,
  label: string,
  pressed?: boolean,
): void {
  button.setAttribute('aria-label', label);
  if (pressed !== undefined) {
    button.setAttribute('aria-pressed', String(pressed));
  }
}

export function setLoadingAria(overlay: HTMLElement): void {
  overlay.setAttribute('aria-live', 'polite');
}

export function setErrorAria(overlay: HTMLElement): void {
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
}

export function updateFullscreenAria(
  button: HTMLElement,
  isFullscreen: boolean,
): void {
  button.setAttribute('aria-pressed', String(isFullscreen));
  button.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
}
