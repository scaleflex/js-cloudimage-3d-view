import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { KeyboardHandler } from '../src/a11y/keyboard';
import {
  setContainerAria,
  setCanvasAria,
  setButtonAria,
  setLoadingAria,
  setErrorAria,
  updateFullscreenAria,
} from '../src/a11y/aria';
import { setupFocusManagement } from '../src/a11y/focus';

// Mock OrbitControls
function createMockControls() {
  return {
    target: new Vector3(),
    update: vi.fn(),
    rotateLeft: vi.fn(),
    rotateUp: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('KeyboardHandler', () => {
  let container: HTMLElement;
  let camera: PerspectiveCamera;
  let controls: any;
  let handler: KeyboardHandler;

  beforeEach(() => {
    container = document.createElement('div');
    container.setAttribute('tabindex', '0');
    document.body.appendChild(container);

    camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 5);
    controls = createMockControls();
  });

  function createHandler(overrides = {}) {
    return new KeyboardHandler({
      camera,
      controls,
      container,
      ...overrides,
    });
  }

  function pressKey(key: string, target?: HTMLElement) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    (target || container).dispatchEvent(event);
  }

  it('rotates left on ArrowLeft', () => {
    handler = createHandler();
    container.focus();
    pressKey('ArrowLeft');

    expect(controls.rotateLeft).toHaveBeenCalled();
    expect(controls.update).toHaveBeenCalled();
    handler.destroy();
  });

  it('rotates right on ArrowRight', () => {
    handler = createHandler();
    container.focus();
    pressKey('ArrowRight');

    expect(controls.rotateLeft).toHaveBeenCalled();
    expect(controls.update).toHaveBeenCalled();
    handler.destroy();
  });

  it('rotates up on ArrowUp', () => {
    handler = createHandler();
    container.focus();
    pressKey('ArrowUp');

    expect(controls.rotateUp).toHaveBeenCalled();
    handler.destroy();
  });

  it('rotates down on ArrowDown', () => {
    handler = createHandler();
    container.focus();
    pressKey('ArrowDown');

    expect(controls.rotateUp).toHaveBeenCalled();
    handler.destroy();
  });

  it('zooms in on + key', () => {
    handler = createHandler();
    container.focus();
    const initialZ = camera.position.z;
    pressKey('+');

    // Camera should have moved closer
    expect(controls.update).toHaveBeenCalled();
    handler.destroy();
  });

  it('zooms out on - key', () => {
    handler = createHandler();
    container.focus();
    pressKey('-');

    expect(controls.update).toHaveBeenCalled();
    handler.destroy();
  });

  it('calls onResetCamera on 0 key', () => {
    const onResetCamera = vi.fn();
    handler = createHandler({ onResetCamera });
    container.focus();
    pressKey('0');

    expect(onResetCamera).toHaveBeenCalled();
    handler.destroy();
  });

  it('calls onToggleAutoRotate on R key', () => {
    const onToggleAutoRotate = vi.fn();
    handler = createHandler({ onToggleAutoRotate });
    container.focus();
    pressKey('R');

    expect(onToggleAutoRotate).toHaveBeenCalled();
    handler.destroy();
  });

  it('calls onToggleFullscreen on F key', () => {
    const onToggleFullscreen = vi.fn();
    handler = createHandler({ onToggleFullscreen });
    container.focus();
    pressKey('F');

    expect(onToggleFullscreen).toHaveBeenCalled();
    handler.destroy();
  });

  it('calls onToggleAnimation on Space', () => {
    const onToggleAnimation = vi.fn();
    handler = createHandler({ onToggleAnimation });
    container.focus();
    pressKey(' ');

    expect(onToggleAnimation).toHaveBeenCalled();
    handler.destroy();
  });

  it('ignores keys when container is not focused', () => {
    const onResetCamera = vi.fn();
    handler = createHandler({ onResetCamera });

    // Dispatch on document body (not container)
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));

    // The handler checks if container contains activeElement
    expect(onResetCamera).not.toHaveBeenCalled();
    handler.destroy();
  });

  it('destroy removes listener', () => {
    const onResetCamera = vi.fn();
    handler = createHandler({ onResetCamera });
    handler.destroy();

    container.focus();
    pressKey('0');
    expect(onResetCamera).not.toHaveBeenCalled();
  });
});

describe('ARIA utilities', () => {
  it('sets container ARIA attributes', () => {
    const el = document.createElement('div');
    setContainerAria(el, 'Test model');

    expect(el.getAttribute('role')).toBe('application');
    expect(el.getAttribute('aria-roledescription')).toBe('3D viewer');
    expect(el.getAttribute('aria-label')).toBe('3D model viewer: Test model');
  });

  it('sets container ARIA with default alt', () => {
    const el = document.createElement('div');
    setContainerAria(el);

    expect(el.getAttribute('aria-label')).toBe('3D model viewer: 3D model');
  });

  it('sets canvas ARIA attributes', () => {
    const canvas = document.createElement('canvas');
    setCanvasAria(canvas, 'Product view');

    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Product view');
  });

  it('sets button ARIA with pressed state', () => {
    const btn = document.createElement('button');
    setButtonAria(btn, 'Toggle fullscreen', false);

    expect(btn.getAttribute('aria-label')).toBe('Toggle fullscreen');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('sets loading ARIA', () => {
    const el = document.createElement('div');
    setLoadingAria(el);

    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('sets error ARIA', () => {
    const el = document.createElement('div');
    setErrorAria(el);

    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('updates fullscreen ARIA', () => {
    const btn = document.createElement('button');

    updateFullscreenAria(btn, true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Exit fullscreen');

    updateFullscreenAria(btn, false);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('Enter fullscreen');
  });
});

describe('Focus management', () => {
  it('sets tabindex on container', () => {
    const el = document.createElement('div');
    setupFocusManagement(el);

    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('does not override existing tabindex', () => {
    const el = document.createElement('div');
    el.setAttribute('tabindex', '-1');
    setupFocusManagement(el);

    expect(el.getAttribute('tabindex')).toBe('-1');
  });
});
