import { describe, it, expect, vi } from 'vitest';
import { createLoadingOverlay } from '../src/ui/loading';
import { createErrorOverlay } from '../src/ui/error';
import { isFullscreenAvailable } from '../src/ui/fullscreen';

describe('Loading overlay', () => {
  it('creates loading overlay with spinner, text, and progress bar', () => {
    const container = document.createElement('div');
    const overlay = createLoadingOverlay(container);

    expect(container.querySelector('.ci-3d-loading')).toBeTruthy();
    expect(container.querySelector('.ci-3d-loading-spinner')).toBeTruthy();
    expect(container.querySelector('.ci-3d-loading-text')).toBeTruthy();
    expect(container.querySelector('.ci-3d-progress-bar')).toBeTruthy();
    expect(container.querySelector('.ci-3d-progress-bar-fill')).toBeTruthy();

    overlay.destroy();
  });

  it('updates progress text and bar width', () => {
    const container = document.createElement('div');
    const overlay = createLoadingOverlay(container);

    overlay.updateProgress(0.45);

    const text = container.querySelector('.ci-3d-loading-text')!;
    const fill = container.querySelector<HTMLElement>('.ci-3d-progress-bar-fill')!;

    expect(text.textContent).toBe('Loading... 45%');
    expect(fill.style.width).toBe('45%');

    overlay.destroy();
  });

  it('hides with hidden class', () => {
    const container = document.createElement('div');
    const overlay = createLoadingOverlay(container);

    overlay.hide();
    expect(overlay.element.classList.contains('ci-3d-loading--hidden')).toBe(true);

    overlay.destroy();
  });

  it('shows by removing hidden class', () => {
    const container = document.createElement('div');
    const overlay = createLoadingOverlay(container);

    overlay.hide();
    overlay.show();
    expect(overlay.element.classList.contains('ci-3d-loading--hidden')).toBe(false);

    overlay.destroy();
  });

  it('destroy removes element', () => {
    const container = document.createElement('div');
    const overlay = createLoadingOverlay(container);
    overlay.destroy();

    expect(container.querySelector('.ci-3d-loading')).toBeNull();
  });
});

describe('Error overlay', () => {
  it('creates error overlay with icon, message, and retry button', () => {
    const container = document.createElement('div');
    const overlay = createErrorOverlay(container, vi.fn());

    expect(container.querySelector('.ci-3d-error')).toBeTruthy();
    expect(container.querySelector('.ci-3d-error-icon')).toBeTruthy();
    expect(container.querySelector('.ci-3d-error-message')).toBeTruthy();
    expect(container.querySelector('.ci-3d-error-retry')).toBeTruthy();

    overlay.destroy();
  });

  it('show displays message and adds visible class', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const overlay = createErrorOverlay(container, vi.fn());

    overlay.show('Network error');

    const msg = container.querySelector('.ci-3d-error-message')!;
    expect(msg.textContent).toBe('Network error');
    expect(overlay.element.classList.contains('ci-3d-error--visible')).toBe(true);

    overlay.destroy();
    document.body.removeChild(container);
  });

  it('hide removes visible class', () => {
    const container = document.createElement('div');
    const overlay = createErrorOverlay(container, vi.fn());

    overlay.show('Error');
    overlay.hide();

    expect(overlay.element.classList.contains('ci-3d-error--visible')).toBe(false);
    expect(overlay.element.classList.contains('ci-3d-error--hidden')).toBe(true);

    overlay.destroy();
  });

  it('retry button calls onRetry', () => {
    const container = document.createElement('div');
    const onRetry = vi.fn();
    const overlay = createErrorOverlay(container, onRetry);

    const retryBtn = container.querySelector<HTMLButtonElement>('.ci-3d-error-retry')!;
    retryBtn.click();

    expect(onRetry).toHaveBeenCalledTimes(1);

    overlay.destroy();
  });

  it('has correct ARIA attributes', () => {
    const container = document.createElement('div');
    const overlay = createErrorOverlay(container, vi.fn());

    expect(overlay.element.getAttribute('role')).toBe('alert');
    expect(overlay.element.getAttribute('aria-live')).toBe('assertive');

    overlay.destroy();
  });
});

describe('Fullscreen', () => {
  it('detects fullscreen availability', () => {
    // jsdom doesn't support fullscreen
    const available = isFullscreenAvailable();
    expect(typeof available).toBe('boolean');
  });
});
