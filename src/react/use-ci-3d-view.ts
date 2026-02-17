import { useEffect, useRef, useState } from 'react';
import type { CI3DViewInstance } from '../core/types';
import type { UseCI3DViewOptions, UseCI3DViewReturn } from './types';

export function useCI3DView(options: UseCI3DViewOptions): UseCI3DViewReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instance = useRef<CI3DViewInstance | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import CI3DView to avoid SSR issues
    let destroyed = false;
    setReady(false);

    import('../core/ci-3d-view').then(({ CI3DView }) => {
      if (destroyed || !containerRef.current) return;

      instance.current = new CI3DView(containerRef.current, optionsRef.current);
      setReady(true);
    });

    return () => {
      destroyed = true;
      instance.current?.destroy();
      instance.current = null;
      setReady(false);
    };
    // Re-init when src changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.src]);

  // Forward prop changes to instance.update() without full re-init
  useEffect(() => {
    if (!instance.current) return;

    const { src, className, style, ...updatableProps } = optionsRef.current as any;
    instance.current.update(updatableProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.autoRotate,
    options.autoRotateSpeed,
    options.theme,
    options.background,
    options.shadows,
    options.toneMapping,
    options.toneMappingExposure,
    options.damping,
    options.dampingFactor,
    options.zoom,
    options.pan,
    options.controls,
  ]);

  return { containerRef, instance, ready };
}
