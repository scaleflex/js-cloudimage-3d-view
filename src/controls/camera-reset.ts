import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraResetHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export function smoothCameraReset(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  initialPos: Vector3,
  initialTarget: Vector3,
  duration = 500,
): CameraResetHandle {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    camera.position.copy(initialPos);
    controls.target.copy(initialTarget);
    controls.update();
    return { promise: Promise.resolve(), cancel: () => {} };
  }

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  let rafId: number | null = null;
  let cancelled = false;

  const promise = new Promise<void>((resolve) => {
    function animate() {
      if (cancelled) {
        resolve();
        return;
      }

      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      camera.position.lerpVectors(startPos, initialPos, eased);
      controls.target.lerpVectors(startTarget, initialTarget, eased);
      controls.update();

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
        resolve();
      }
    }

    rafId = requestAnimationFrame(animate);
  });

  const cancel = () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { promise, cancel };
}
