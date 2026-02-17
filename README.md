# js-cloudimage-3d-view

[![npm version](https://img.shields.io/npm/v/js-cloudimage-3d-view.svg)](https://www.npmjs.com/package/js-cloudimage-3d-view)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

A lightweight Three.js-powered TypeScript library for interactive 3D model viewers with orbit controls, lighting, environment maps, shadows, animation playback, and WCAG 2.1 AA accessibility.

[Demo](https://scaleflex.github.io/js-cloudimage-3d-view/) | [Documentation](#api-reference) | [React](#react)

## Features

- **Format Support** — GLB/glTF (with Draco compression), OBJ + MTL
- **Orbit Controls** — Damping, zoom/rotation constraints, auto-rotate with pause-on-interact
- **Lighting** — 3-point lighting, HDR/EXR environment maps, configurable shadows
- **Tone Mapping** — ACES Filmic, Reinhard, Cineon, Linear
- **Animation** — Play/pause/stop with speed control for models with embedded animations
- **Screenshots** — Capture and download at configurable resolution
- **Fullscreen** — One-click fullscreen toggle
- **Theming** — Light/dark themes with CSS variable customization
- **Accessibility** — WCAG 2.1 AA keyboard navigation, ARIA attributes, focus management
- **React Wrapper** — First-class React component with SSR safety
- **TypeScript** — Full type definitions with strict mode
- **Zero Dependencies** — Three.js is the only peer dependency
- **Declarative** — 40+ HTML data-attributes for no-code configuration

## Installation

### npm

```bash
npm install js-cloudimage-3d-view three
```

### CDN

```html
<!-- Three.js (required) -->
<script src="https://unpkg.com/three/build/three.min.js"></script>

<!-- js-cloudimage-3d-view -->
<script src="https://unpkg.com/js-cloudimage-3d-view"></script>
```

## Quick Start

### JavaScript

```js
import { CI3DView } from 'js-cloudimage-3d-view';

const viewer = new CI3DView('#container', {
  src: 'model.glb',
  autoRotate: true,
  shadows: true,
});
```

### HTML Data Attributes

```html
<div
  data-ci-3d-src="model.glb"
  data-ci-3d-auto-rotate="true"
  data-ci-3d-shadows="true"
  style="width: 100%; aspect-ratio: 16/9"
></div>

<script>
  CI3DView.autoInit();
</script>
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | `''` | Model URL (GLB, glTF, OBJ) |
| `alt` | `string` | `'3D model viewer'` | Accessible label |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `background` | `string` | `'#f5f5f5'` | Scene background color |
| `autoRotate` | `boolean` | `false` | Enable auto-rotation |
| `autoRotateSpeed` | `number` | `0.5` | Rotation speed (rev/s) |
| `autoRotateDelay` | `number` | `3000` | Resume delay after interaction (ms) |
| `damping` | `boolean` | `true` | Smooth orbit damping |
| `dampingFactor` | `number` | `0.05` | Damping strength |
| `zoom` | `boolean` | `true` | Enable zoom |
| `pan` | `boolean` | `true` | Enable panning |
| `rotate` | `boolean` | `true` | Enable rotation |
| `minDistance` | `number` | `0` | Minimum zoom distance |
| `maxDistance` | `number` | `Infinity` | Maximum zoom distance |
| `polarAngleMin` | `number` | `0` | Minimum vertical angle (degrees) |
| `polarAngleMax` | `number` | `180` | Maximum vertical angle (degrees) |
| `toneMapping` | `string` | `'aces'` | Tone mapping mode |
| `toneMappingExposure` | `number` | `1.0` | Exposure value |
| `shadows` | `boolean` | `false` | Enable ground shadows |
| `shadowOpacity` | `number` | `0.3` | Shadow darkness |
| `environmentMap` | `string` | `''` | HDR/EXR environment map URL |
| `environmentMapIntensity` | `number` | `1.0` | Environment map intensity |
| `autoPlayAnimation` | `boolean` | `false` | Auto-play first animation on load |
| `animation` | `string \| number` | `undefined` | Animation name or index to play |
| `animationSpeed` | `number` | `1.0` | Playback speed |
| `fullscreenButton` | `boolean` | `false` | Show fullscreen button |
| `screenshotButton` | `boolean` | `false` | Show screenshot button |
| `dracoDecoderPath` | `string` | CDN default | Draco WASM decoder URL |

## API Reference

### Constructor

```js
const viewer = new CI3DView(element, config);
```

- `element` — CSS selector string or HTMLElement
- `config` — Configuration object (see table above)

### Methods

```js
// Model loading
viewer.loadModel(url)                    // Load a new model

// Camera
viewer.setCameraPosition(x, y, z)       // Set camera position
viewer.setCameraTarget(x, y, z)         // Set orbit target
viewer.resetCamera()                    // Animated camera reset
viewer.setAutoRotate(enabled)           // Toggle auto-rotation

// Screenshot
viewer.screenshot(scale?)               // Returns data URL
viewer.downloadScreenshot(filename?, scale?)

// Animation
viewer.playAnimation(indexOrName?)      // Play animation
viewer.pauseAnimation()                 // Pause at current frame
viewer.stopAnimation()                  // Stop and reset
viewer.setAnimationSpeed(speed)         // Change playback speed
viewer.getAnimations()                  // List animation names

// Fullscreen
viewer.enterFullscreen()
viewer.exitFullscreen()
viewer.isFullscreen()

// Updates
viewer.update(partialConfig)            // Update config without recreating
viewer.destroy()                        // Clean up all resources

// Internals
viewer.getThreeObjects()                // { scene, camera, renderer, controls, model }
viewer.getElements()                    // { container, canvas }
```

### Static Methods

```js
CI3DView.autoInit(root?)               // Auto-discover data-ci-3d-src elements
```

### Callbacks

```js
new CI3DView('#container', {
  src: 'model.glb',
  onLoadStart: () => {},
  onLoad: (model) => {},
  onLoadProgress: (progress) => {},
  onError: (error) => {},
});
```

## React

### Component

```jsx
import { CI3DViewer } from 'js-cloudimage-3d-view/react';

function App() {
  const ref = useRef(null);

  return (
    <CI3DViewer
      ref={ref}
      src="model.glb"
      autoRotate
      shadows
      theme="light"
      style={{ width: '100%', aspectRatio: '16/9' }}
      onLoad={() => console.log('Loaded!')}
    />
  );
}
```

### Hook

```jsx
import { useCI3DView } from 'js-cloudimage-3d-view/react';

function CustomViewer() {
  const { containerRef, instance } = useCI3DView({
    src: 'model.glb',
    autoRotate: true,
  });

  return <div ref={containerRef} style={{ width: '100%', height: 400 }} />;
}
```

### Ref API

The `CI3DViewer` component exposes all instance methods via `ref`:

```js
ref.current.loadModel(url)
ref.current.resetCamera()
ref.current.screenshot()
ref.current.playAnimation()
ref.current.update({ shadows: false })
ref.current.getThreeObjects()
// ... all methods from the API reference
```

## Theming

### CSS Variables

Override the built-in CSS variables for custom styling:

```css
.ci-3d-container {
  --ci3d-bg: #ffffff;
  --ci3d-loading-bg: rgba(255, 255, 255, 0.9);
  --ci3d-loading-spinner: #0058a3;
  --ci3d-error-bg: rgba(255, 255, 255, 0.95);
  --ci3d-error-color: #dc2626;
  --ci3d-btn-bg: rgba(255, 255, 255, 0.9);
  --ci3d-btn-color: #374151;
  --ci3d-btn-hover-bg: rgba(255, 255, 255, 1);
}
```

### Dark Theme

```js
new CI3DView('#container', { src: 'model.glb', theme: 'dark' });
```

Or with data attributes:

```html
<div data-ci-3d-src="model.glb" data-ci-3d-theme="dark"></div>
```

## Accessibility

- **Keyboard Navigation:** Arrow keys (orbit), +/- (zoom), 0 (reset), R (auto-rotate), F (fullscreen), Space (animation toggle), Escape (exit fullscreen)
- **ARIA Attributes:** `role="application"`, `aria-roledescription="3D viewer"`, `aria-label`, `aria-live` for loading states
- **Focus Management:** Visible focus outlines, tab-navigable controls
- **Reduced Motion:** Respects `prefers-reduced-motion` — disables auto-rotate, instant camera transitions

## TypeScript

Full type definitions are included:

```ts
import { CI3DView } from 'js-cloudimage-3d-view';
import type {
  CI3DViewConfig,
  CI3DViewInstance,
  LightingConfig,
  ToneMappingMode,
} from 'js-cloudimage-3d-view';

// React types
import type {
  CI3DViewerProps,
  CI3DViewerRef,
} from 'js-cloudimage-3d-view/react';
```

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

Requires WebGL 2.0 support.

## License

[MIT](LICENSE) - Scaleflex
