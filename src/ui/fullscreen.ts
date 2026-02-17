import { createElement } from '../utils/dom';

const MAXIMIZE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
const MINIMIZE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

export interface FullscreenController {
  button: HTMLButtonElement;
  enterFullscreen(): void;
  exitFullscreen(): void;
  isFullscreen(): boolean;
  toggle(): void;
  destroy(): void;
}

export function isFullscreenAvailable(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled
  );
}

export function createFullscreenButton(
  container: HTMLElement,
  targetElement: HTMLElement,
  onChange?: (isFullscreen: boolean) => void,
): FullscreenController | null {
  if (!isFullscreenAvailable()) return null;

  const button = createElement('button', 'ci-3d-fullscreen-btn', {
    'aria-label': 'Enter fullscreen',
    'aria-pressed': 'false',
  });
  button.innerHTML = MAXIMIZE_SVG;

  function isFs(): boolean {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
  }

  function updateButton(): void {
    const fs = isFs();
    button.innerHTML = fs ? MINIMIZE_SVG : MAXIMIZE_SVG;
    button.setAttribute('aria-pressed', String(fs));
    button.setAttribute('aria-label', fs ? 'Exit fullscreen' : 'Enter fullscreen');
  }

  const onFullscreenChange = (): void => {
    updateButton();
    onChange?.(isFs());
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  button.addEventListener('click', () => {
    if (isFs()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } else {
      if (targetElement.requestFullscreen) targetElement.requestFullscreen();
      else if ((targetElement as any).webkitRequestFullscreen) (targetElement as any).webkitRequestFullscreen();
    }
  });

  return {
    button,

    enterFullscreen() {
      if (targetElement.requestFullscreen) targetElement.requestFullscreen();
      else if ((targetElement as any).webkitRequestFullscreen) (targetElement as any).webkitRequestFullscreen();
    },

    exitFullscreen() {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    },

    isFullscreen: isFs,

    toggle() {
      if (isFs()) this.exitFullscreen();
      else this.enterFullscreen();
    },

    destroy() {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      button.remove();
    },
  };
}
