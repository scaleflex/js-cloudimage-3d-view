# Code Review Issues

Deep code review of the `js-cloudimage-3d-view` codebase. Issues organized by severity.

---

## Critical

### 1. Race condition: concurrent `loadModel` calls can corrupt state
**File:** `src/core/ci-3d-view.ts:133-143, 559-672`

`loadModel` is async and awaits network I/O. If called twice in quick succession (or `update()` with a new `src` while a load is in-flight), both proceed concurrently. The first to resolve sets up the model, the second overwrites it. `disposeModel()` only disposes whatever `this.model` is at that instant, resulting in duplicate models, orphaned Three.js objects, and corrupted state.

**Fix:** Implement a load cancellation token or generation counter. Discard stale results.

### 2. DRACOLoader WebWorker never disposed — memory leak per load
**File:** `src/loaders/gltf-loader.ts:17-21`

`DRACOLoader` spawns a Web Worker for decompression. A new instance is created inside every `load()` call and never disposed. Every GLTF load leaks a WebWorker.

**Fix:** Create a single `DRACOLoader` instance and reuse across loads, or call `draco.dispose()` after load completes.

### 3. React hook race condition: instance null during async import
**File:** `src/react/use-ci-3d-view.ts:17-21`

`CI3DView` is dynamically imported (async). `instance.current` is only set after the import resolves, but is returned immediately. Any imperative method called before initialization silently no-ops (e.g., `loadModel` returns `Promise.resolve()` without loading anything).

**Fix:** Expose a loading/ready state, or queue commands until the instance is initialized.

---

## High

### 4. OrbitControls leak on model reload
**File:** `src/core/ci-3d-view.ts:608`

When `loadModelInternal` completes, it creates a new `OrbitControls` instance without disposing the previous one. `OrbitControls` registers multiple DOM event listeners (pointerdown, wheel, keydown, etc.). Every model load leaks an entire set of event listeners.

**Fix:** Call `this.controls.dispose()` before reassigning, or reconfigure the existing instance instead of recreating.

### 5. AutoRotateController holds stale controls reference after recreation
**File:** `src/core/ci-3d-view.ts:608, 166-175`

Related to #4: `AutoRotateController` holds a reference to the old `OrbitControls` and has event listeners on it. After controls are recreated, auto-rotate manipulates the stale (leaked) controls object.

**Fix:** Destroy and recreate the `AutoRotateController` when controls are recreated, or stop recreating controls.

### 6. Auto-rotate resumes after interaction even when explicitly stopped
**File:** `src/controls/auto-rotate.ts:47-51`

`onInteractEnd` always schedules auto-rotate resumption. If a user calls `stop()` to explicitly disable auto-rotate, then interacts with the model, auto-rotate will resume after the delay.

**Fix:** Add an `enabled` flag. `stop()` sets it to `false`, `start()` sets it to `true`. Check it in `onInteractEnd` before scheduling resume.

### 7. `reduceLightingForIBL` is not idempotent — repeated calls keep halving intensity
**File:** `src/lighting/lighting.ts:99-104`

`intensity *= 0.5` is called each time. If the environment map is reloaded (e.g., via `update()`), intensities are halved again, eventually approaching zero.

**Fix:** Store original intensities and use absolute reduced values, or guard against repeated calls.

### 8. Double-dispose of same texture when `background === environment`
**File:** `src/lighting/environment.ts:47-56`

Both `scene.environment` and `scene.background` point to the same texture object when `showBackground` is true. `disposeEnvironment` disposes the texture twice.

**Fix:** Check `scene.background === scene.environment` before disposing the second time.

### 9. No cancellation for `smoothCameraReset` animation
**File:** `src/controls/camera-reset.ts:27-45`

The reset animation uses `requestAnimationFrame` with no cancel mechanism. Multiple concurrent resets fight over camera position. If `destroy()` is called mid-animation, the rAF callback continues running on disposed objects.

**Fix:** Return a cancel handle. Store and cancel any in-flight reset on destroy.

### 10. Unhandled Promise rejections from fullscreen API
**File:** `src/ui/fullscreen.ts:56-60, 68-69, 73-74`

`requestFullscreen()` and `exitFullscreen()` return Promises that can reject. None have `.catch()` handlers.

**Fix:** Add `.catch()` to all fullscreen API calls.

### 11. `captureScreenshot` does not restore renderer state on error
**File:** `src/ui/screenshot.ts:8-16`

If `renderer.render()` or `toDataURL()` throws, the renderer size is left in the upscaled state.

**Fix:** Wrap in try/finally to always restore `renderer.setSize()`.

### 12. `toDataURL()` throws on tainted canvases with no error handling
**File:** `src/ui/screenshot.ts:13`

Cross-origin textures without CORS headers cause `SecurityError` on `toDataURL()`. No catch block exists.

**Fix:** Catch `SecurityError` and return empty string or descriptive error.

### 13. `emit()` handler throw stops all subsequent handlers
**File:** `src/utils/events.ts:18-20`

If any event handler throws, `forEach` stops and remaining handlers are never called.

**Fix:** Wrap each handler invocation in try/catch.

### 14. Set mutation during iteration in `once()` — re-entrant emit risk
**File:** `src/utils/events.ts:23-29`

The `once` wrapper calls `this.off()` during `forEach` iteration. Fragile with re-entrant emission.

**Fix:** Collect handlers to remove after iteration, or use a copy of the set.

---

## Medium

### 15. `webkitfullscreenchange` listener never removed on destroy
**File:** `src/core/ci-3d-view.ts:387, 488`

Two listeners registered (`fullscreenchange` + `webkitfullscreenchange`), but only `fullscreenchange` is removed in `destroy()`.

### 16. `mixer.uncacheRoot(this.model!)` when model may be null
**File:** `src/core/ci-3d-view.ts:358`

Non-null assertion `!` used, but `this.model` can be null if load never completed.

### 17. Unhandled promise rejection in `update()` when loading new src
**File:** `src/core/ci-3d-view.ts:337-339`

`this.loadModel()` promise is not awaited and has no `.catch()`.

### 18. Resize observer timeout fires after destroy
**File:** `src/core/renderer.ts:52-68`

When `observer.disconnect()` is called, a pending debounce timeout may still fire on a disposed renderer.

### 19. No WebGL context loss handling
**File:** `src/core/renderer.ts:23-45`

No `webglcontextlost`/`webglcontextrestored` listeners. If context is lost, the viewer becomes a black rectangle with no feedback.

### 20. No post-destroy guards on public methods
**File:** `src/core/ci-3d-view.ts` (all public methods)

After `destroy()`, calling `setCameraPosition`, `loadModel`, `screenshot`, etc. will use disposed Three.js objects. Only `destroy()` itself checks the `destroyed` flag.

### 21. `scaleToFit` uses `multiplyScalar` — compounds on repeated calls
**File:** `src/utils/math.ts:54`

`model.scale.multiplyScalar(scale)` multiplies the existing scale. If called multiple times (e.g., model reload), scale compounds.

**Fix:** Use `model.scale.setScalar(scale)` for absolute scaling.

### 22. `fitCameraToModel` ignores aspect ratio
**File:** `src/utils/math.ts:64`

Uses only vertical FOV. For wide models in tall viewports (aspect < 1), the model extends outside the horizontal frustum.

### 23. Skinned mesh bounding box uses bind pose, not animated pose
**File:** `src/utils/math.ts:17-26`

For `SkinnedMesh`, the base geometry bounding box doesn't account for bone transformations. The computed box represents the bind pose, not the current animated pose.

### 24. `disposeObject3D` only handles `isMesh` — misses Lines, Points, Sprites
**File:** `src/utils/dispose.ts:5`

`Line`, `LineSegments`, `Points`, and `Sprite` objects also have `geometry` and `material` that need disposal.

### 25. Shared materials/textures disposed multiple times
**File:** `src/utils/dispose.ts:12-21`

Multiple meshes sharing the same material or texture cause repeated `.dispose()` calls.

**Fix:** Use a `Set` to track already-disposed resources.

### 26. `once()` prevents `off()` from removing handler before event fires
**File:** `src/utils/events.ts:23-29`

The `once` wrapper replaces the original handler. `off(event, originalHandler)` cannot find and remove it.

### 27. Global mutable loader array with no dedup or cleanup
**File:** `src/loaders/loader-registry.ts:7-12, 56-58`

`registerLoader()` pushes to a module-level array. No `unregisterLoader`, no deduplication. HMR or multiple calls accumulate loaders without bound.

### 28. OBJ material upgrade may break shared textures
**File:** `src/loaders/obj-loader.ts:38-51`

When `MeshPhongMaterial.dispose()` is called, the shared `map` texture transferred to `MeshStandardMaterial` may also be disposed. Multi-material arrays are not handled.

### 29. Environment map URL format detection fragile with query strings
**File:** `src/lighting/environment.ts:16`

`url.toLowerCase().endsWith('.exr')` doesn't strip query strings. URL like `env.exr?v=123` won't be detected as EXR.

### 30. Shadow camera frustum hardcoded — doesn't adapt to model size
**File:** `src/lighting/lighting.ts:66-75`

Fixed [-10, 10] frustum with far=50. Very small or very large models get incorrect shadow rendering.

### 31. Progress callbacks can report values > 1.0
**File:** All loaders (`gltf-loader.ts:30`, `obj-loader.ts:57`, `stl-loader.ts:34`, `fbx-loader.ts:20`)

With gzip/brotli compression, `event.loaded` (decompressed) can exceed `event.total` (compressed Content-Length).

**Fix:** Clamp with `Math.min(event.loaded / event.total, 1)`.

### 32. Loading overlay progress not clamped
**File:** `src/ui/loading.ts:29`

`updateProgress(progress)` doesn't clamp input. Values > 1 or < 0 produce "Loading... 150%" or negative widths.

### 33. Progress bar missing ARIA attributes
**File:** `src/ui/loading.ts:16-17`

No `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen readers can't convey progress.

### 34. Error overlay `retryBtn.focus()` steals focus unconditionally
**File:** `src/ui/error.ts:45`

Focus is stolen even if the user is interacting elsewhere. Disorienting for screen reader users.

### 35. Escape key toggles fullscreen instead of only exiting
**File:** `src/a11y/keyboard.ts:93-95`

Pressing Escape calls `onToggleFullscreen()` — could enter fullscreen if not already in it. Should only exit.

### 36. Keyboard zoom bypasses OrbitControls min/max distance
**File:** `src/a11y/keyboard.ts:119-132`

Direct camera position manipulation ignores `controls.minDistance` and `controls.maxDistance`. Camera can go inside or behind the model.

### 37. `role="application"` without keyboard instructions
**File:** `src/a11y/aria.ts:1-8`

Screen reader navigation shortcuts are disabled inside `role="application"`. No `aria-describedby` tells the user what keyboard shortcuts are available.

### 38. `screenshot()` returns empty string when React instance not ready
**File:** `src/react/ci-3d-viewer.tsx:18`

No way to distinguish "not ready" from "screenshot failed". Consider returning `null` or exposing a ready state.

### 39. React `destroy()` on ref can cause double-destroy
**File:** `src/react/ci-3d-viewer.tsx:29`

`destroy()` is exposed on the ref, but `useCI3DView` also calls it in cleanup. Manual + automatic destroy = double call.

### 40. React hook only re-inits on `src` change
**File:** `src/react/use-ci-3d-view.ts:30`

Changes to other props (`autoRotate`, `theme`, callbacks) don't trigger re-initialization. Options baked into the constructor won't update.

### 41. `autoPlayAnimation` vs `animation` logic is identical
**File:** `src/core/ci-3d-view.ts:650-654`

Both branches do `this.playAnimation(this.config.animation)`. `autoPlayAnimation` has no distinct behavior.

### 42. `.usdz` in known extensions but no loader supports it
**File:** `src/loaders/loader-registry.ts:28`

Misleading — suggests support that doesn't exist. `getLoader` returns null for `.usdz`.

### 43. `throttle` return type cast is unsound
**File:** `src/utils/events.ts:68`

Cast to `T` loses return type. Throttled function always returns `undefined`.

### 44. Old environment not disposed before overwriting with new one
**File:** `src/lighting/environment.ts:31-33`

Setting a new environment map overwrites the previous one without disposing it — GPU texture leak.

### 45. `screenshot()` scale parameter not validated
**File:** `src/ui/screenshot.ts:7`

Values of 0, negative, or very large numbers could cause WebGL errors or crash the browser.

### 46. `AnimationMixerWrapper.play()` after dispose() will crash
**File:** `src/animation/animation-mixer.ts:13-33, 72-75`

No `disposed` flag guards against usage after disposal.

### 47. Animation controls don't indicate current playback state
**File:** `src/animation/animation-controls.ts:22-29`

No `aria-pressed`, no active/disabled state, no visual feedback for current state.

### 48. React `CI3DViewerRef` types claim always-valid returns
**File:** `src/react/types.ts:63-83`

Types say `screenshot()` returns `string`, but implementation returns `''` when instance is null. Types should reflect nullable returns or document the behavior.

### 49. Polar angle and zoom range validation missing
**File:** `src/controls/orbit-controls.ts:19-24, 49-54`

No validation that `polarAngleMin <= polarAngleMax` or `zoomMin <= zoomMax`. Invalid ranges produce broken OrbitControls behavior.

### 50. `updateControlsConstraints` with radius=0 locks zoom
**File:** `src/controls/orbit-controls.ts:44-47`

If bounding sphere radius is 0, `minDistance` and `maxDistance` both become 0, disabling zoom entirely.

---

## Low

### 51. `groundPlane` typed as `any`
**File:** `src/core/ci-3d-view.ts:45`

### 52. `LoadResult.animations` typed as `any[]`
**File:** `src/core/types.ts:112` — should be `AnimationClip[]`

### 53. `CI3DViewInstance.controls` typed as `any`
**File:** `src/core/types.ts:77` — should be `OrbitControls`

### 54. `loadMtl` return type is `Promise<any>`
**File:** `src/loaders/obj-loader.ts:68`

### 55. `toBool` only checks `'true'` — `'1'`, `'yes'`, empty attribute all return `false`
**File:** `src/core/config.ts:35-37`

### 56. `JSON.parse` failure in data attributes silently swallowed
**File:** `src/core/config.ts:96-100` — no `console.warn` for malformed attributes

### 57. `Number()` coercion: `Number('')` returns 0
**File:** `src/core/config.ts` (various numeric attrs) — empty attribute silently becomes 0

### 58. `validateConfig` doesn't validate numeric ranges
**File:** `src/core/config.ts:123-139` — no checks for negative values, out-of-range angles, etc.

### 59. Camera `near`/`far` planes not dynamically adjusted
**File:** `src/core/scene.ts:16` — hardcoded `near=0.01, far=1000`, wastes z-buffer precision

### 60. `detectFormat` and `hasFileExtension` duplicate URL parsing logic
**File:** `src/loaders/loader-registry.ts:14-30, 49-54`

### 61. Unused `SkinnedMesh` import
**File:** `src/utils/math.ts:7`

### 62. `any` type in `computeBoundingBox` traverse callback
**File:** `src/utils/math.ts:17`

### 63. Injected styles never removed on destroy
**File:** `src/utils/dom.ts:43-51` — style tag stays in DOM after all instances destroyed

### 64. `throttle` has no `cancel()` method
**File:** `src/utils/events.ts:46-71` — trailing call fires after destroy

### 65. `onCameraChange` fires every frame even when camera hasn't moved
**File:** `src/core/ci-3d-view.ts:546-553`

### 66. SVG icons missing `aria-hidden="true"`
**File:** `src/ui/error.ts`, `src/ui/fullscreen.ts`, `src/animation/animation-controls.ts`

### 67. `AnimationMixerWrapper.setSpeed()` only affects current action
**File:** `src/animation/animation-mixer.ts:54-58` — speed lost when switching animations

### 68. Ground plane too small for tall/thin models
**File:** `src/lighting/shadows.ts:14-15` — uses `max(x, z)`, ignores `y`

### 69. `disposeEnvironment` nulling background overwrites theme background
**File:** `src/lighting/environment.ts:54`

### 70. `cameraPosition`/`cameraTarget` tuple length not validated at runtime
**File:** `src/core/types.ts:56-58` — `JSON.parse("[1,2]")` produces 2-element array, `set(1, 2, undefined)` → NaN

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 11 |
| Medium | 36 |
| Low | 20 |
| **Total** | **70** |
