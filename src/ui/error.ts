import { createElement, addClass, removeClass } from '../utils/dom';

const ALERT_TRIANGLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

export interface ErrorOverlay {
  element: HTMLElement;
  show(message: string): void;
  hide(): void;
  destroy(): void;
}

export function createErrorOverlay(
  container: HTMLElement,
  onRetry: () => void,
): ErrorOverlay {
  const element = createElement('div', 'ci-3d-error', {
    'role': 'alert',
    'aria-live': 'assertive',
  });

  const icon = createElement('div', 'ci-3d-error-icon');
  icon.innerHTML = ALERT_TRIANGLE_SVG;

  const message = createElement('div', 'ci-3d-error-message');
  message.textContent = 'Failed to load model';

  const retryBtn = createElement('button', 'ci-3d-error-retry', {
    'aria-label': 'Retry loading model',
  });
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', onRetry);

  element.appendChild(icon);
  element.appendChild(message);
  element.appendChild(retryBtn);
  container.appendChild(element);

  return {
    element,

    show(msg: string) {
      message.textContent = msg;
      addClass(element, 'ci-3d-error--visible');
      removeClass(element, 'ci-3d-error--hidden');
      retryBtn.focus();
    },

    hide() {
      removeClass(element, 'ci-3d-error--visible');
      addClass(element, 'ci-3d-error--hidden');
    },

    destroy() {
      retryBtn.removeEventListener('click', onRetry);
      element.remove();
    },
  };
}
