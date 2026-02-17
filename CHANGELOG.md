# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-01

### Added
- Core 3D viewer with Three.js integration
- GLB/glTF format support with Draco compression
- OBJ + MTL format support with material auto-detection
- Orbit controls with damping, zoom, and rotation constraints
- Auto-rotate with configurable speed and pause-on-interact
- 3-point lighting system (ambient + key/fill/rim)
- HDR/EXR environment map support via PMREMGenerator
- ACES filmic, Reinhard, Cineon, and Linear tone mapping
- Shadow rendering with transparent ground plane
- Animation playback (play/pause/stop/speed) via AnimationMixer
- Screenshot capture and download
- Fullscreen toggle with browser API
- Light and dark theme support via CSS variables
- 40+ HTML data-attributes for declarative configuration
- `CI3DView.autoInit()` for automatic element discovery
- Smooth camera reset with ease-out cubic interpolation
- WCAG 2.1 AA accessibility (keyboard navigation, ARIA attributes, focus management)
- `prefers-reduced-motion` support (disables auto-rotate, instant camera transitions)
- React wrapper component (`CI3DViewer`) with SSR safety
- React hook (`useCI3DView`) for custom integrations
- Full TypeScript support with strict mode
- ESM, CJS, and UMD output formats
- Zero runtime dependencies (Three.js as peer dependency)
- Comprehensive test suite (164 tests)
- Interactive demo site with configurator
- GitHub Actions for demo deployment
