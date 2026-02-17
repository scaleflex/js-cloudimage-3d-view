import { vi } from 'vitest';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = MockResizeObserver as any;

// Mock requestAnimationFrame / cancelAnimationFrame
let rafId = 0;
globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return ++rafId;
}) as any;
globalThis.cancelAnimationFrame = vi.fn() as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock WebGL rendering context
const mockWebGLContext = {
  getExtension: vi.fn(() => null),
  getParameter: vi.fn(() => 0),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  clear: vi.fn(),
  viewport: vi.fn(),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texParameteri: vi.fn(),
  texImage2D: vi.fn(),
  createFramebuffer: vi.fn(() => ({})),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  createRenderbuffer: vi.fn(() => ({})),
  bindRenderbuffer: vi.fn(),
  renderbufferStorage: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  getShaderInfoLog: vi.fn(() => ''),
  getProgramInfoLog: vi.fn(() => ''),
  canvas: document.createElement('canvas'),
};

const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, options?: any) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return mockWebGLContext as any;
  }
  return (originalGetContext as any).call(this, contextId, options);
} as any;

// Three.js WebGLRenderer mock
class MockWebGLRenderer {
  domElement = document.createElement('canvas');
  shadowMap = { enabled: false, type: 0 };
  toneMapping = 0;
  toneMappingExposure = 1;
  outputColorSpace = 'srgb';
  setSize = vi.fn();
  setPixelRatio = vi.fn();
  render = vi.fn();
  dispose = vi.fn();
  getContext = vi.fn(() => mockWebGLContext);
  getSize = vi.fn(() => ({ width: 800, height: 600 }));
  setClearColor = vi.fn();
  setAnimationLoop = vi.fn();
  getRenderTarget = vi.fn(() => null);
  setRenderTarget = vi.fn();
  clear = vi.fn();
  info = { render: { frame: 0 }, memory: {} };
  capabilities = { isWebGL2: true, maxTextures: 16 };
  properties = { get: vi.fn(() => ({})) };
  state = { reset: vi.fn() };
}

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});
