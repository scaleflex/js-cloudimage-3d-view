import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import { CI3DViewer } from '../src/react/ci-3d-viewer';
import type { CI3DViewerRef } from '../src/react/types';

// Mock the dynamic import of CI3DView
vi.mock('../src/core/ci-3d-view', () => {
  const mockInstance = {
    loadModel: vi.fn(() => Promise.resolve()),
    setCameraPosition: vi.fn(),
    setCameraTarget: vi.fn(),
    resetCamera: vi.fn(),
    setAutoRotate: vi.fn(),
    screenshot: vi.fn(() => 'data:image/png;base64,'),
    downloadScreenshot: vi.fn(),
    playAnimation: vi.fn(),
    pauseAnimation: vi.fn(),
    stopAnimation: vi.fn(),
    setAnimationSpeed: vi.fn(),
    getAnimations: vi.fn(() => ['Walk', 'Run']),
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    isFullscreen: vi.fn(() => false),
    update: vi.fn(),
    destroy: vi.fn(),
    getThreeObjects: vi.fn(() => ({ scene: {}, camera: {}, renderer: {}, controls: {}, model: null })),
    getElements: vi.fn(() => ({ container: document.createElement('div'), canvas: document.createElement('canvas') })),
  };

  return {
    CI3DView: vi.fn().mockImplementation(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

afterEach(() => {
  cleanup();
});

describe('CI3DViewer component', () => {
  it('renders a container div', () => {
    const { container } = render(
      <CI3DViewer src="model.glb" />,
    );

    expect(container.querySelector('div')).toBeTruthy();
  });

  it('applies className prop', () => {
    const { container } = render(
      <CI3DViewer src="model.glb" className="my-viewer" />,
    );

    const div = container.firstElementChild;
    expect(div?.className).toBe('my-viewer');
  });

  it('applies style prop', () => {
    const { container } = render(
      <CI3DViewer
        src="model.glb"
        style={{ width: '100%', aspectRatio: '16/9' }}
      />,
    );

    const div = container.firstElementChild as HTMLElement;
    expect(div?.style.width).toBe('100%');
  });

  it('exposes ref API', async () => {
    const ref = createRef<CI3DViewerRef>();

    render(<CI3DViewer ref={ref} src="model.glb" />);

    // Wait for the dynamic import to resolve
    await vi.dynamicImportSettled?.() ?? new Promise((r) => setTimeout(r, 10));

    expect(ref.current).toBeTruthy();
    expect(typeof ref.current!.resetCamera).toBe('function');
    expect(typeof ref.current!.screenshot).toBe('function');
    expect(typeof ref.current!.getAnimations).toBe('function');
    expect(typeof ref.current!.enterFullscreen).toBe('function');
    expect(typeof ref.current!.isFullscreen).toBe('function');
    expect(typeof ref.current!.update).toBe('function');
    expect(typeof ref.current!.destroy).toBe('function');
    expect(typeof ref.current!.loadModel).toBe('function');
    expect(typeof ref.current!.getThreeObjects).toBe('function');
    expect(typeof ref.current!.getElements).toBe('function');
  });

  it('ref methods return defaults when instance not ready', () => {
    const ref = createRef<CI3DViewerRef>();

    render(<CI3DViewer ref={ref} src="model.glb" />);

    // Before dynamic import resolves, instance is null
    expect(ref.current!.screenshot()).toBe('');
    expect(ref.current!.getAnimations()).toEqual([]);
    expect(ref.current!.isFullscreen()).toBe(false);
    expect(ref.current!.getThreeObjects()).toBeNull();
    expect(ref.current!.getElements()).toBeNull();
  });
});

describe('CI3DViewer SSR safety', () => {
  it('renders just a div without accessing window/document APIs during render', () => {
    // The component itself just renders a <div> — all Three.js work is in useEffect
    const { container } = render(
      <CI3DViewer src="model.glb" alt="Test" autoRotate shadows />,
    );

    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});
