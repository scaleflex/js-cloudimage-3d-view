import { createElement, addClass, removeClass } from '../utils/dom';

export interface LoadingOverlay {
  element: HTMLElement;
  updateProgress(progress: number): void;
  hide(): void;
  show(): void;
  destroy(): void;
}

export function createLoadingOverlay(container: HTMLElement): LoadingOverlay {
  const element = createElement('div', 'ci-3d-loading', { 'aria-live': 'polite' });
  const spinner = createElement('div', 'ci-3d-loading-spinner');
  const text = createElement('div', 'ci-3d-loading-text');
  text.textContent = 'Loading...';
  const progressBar = createElement('div', 'ci-3d-progress-bar');
  const fill = createElement('div', 'ci-3d-progress-bar-fill');

  progressBar.appendChild(fill);
  element.appendChild(spinner);
  element.appendChild(text);
  element.appendChild(progressBar);
  container.appendChild(element);

  return {
    element,

    updateProgress(progress: number) {
      const pct = Math.round(progress * 100);
      text.textContent = `Loading... ${pct}%`;
      fill.style.width = `${pct}%`;
    },

    hide() {
      addClass(element, 'ci-3d-loading--hidden');
    },

    show() {
      removeClass(element, 'ci-3d-loading--hidden');
      text.textContent = 'Loading...';
      fill.style.width = '0%';
    },

    destroy() {
      element.remove();
    },
  };
}
