import { forwardRef, useImperativeHandle } from 'react';
import { useCI3DView } from './use-ci-3d-view';
import type { CI3DViewerProps, CI3DViewerRef } from './types';

export const CI3DViewer = forwardRef<CI3DViewerRef, CI3DViewerProps>(
  function CI3DViewer(props, ref) {
    const { className, style, ...options } = props;
    const { containerRef, instance } = useCI3DView(options);

    useImperativeHandle(
      ref,
      () => ({
        loadModel: (...args) => instance.current?.loadModel(...args) ?? Promise.resolve(),
        setCameraPosition: (...args) => instance.current?.setCameraPosition(...args),
        setCameraTarget: (...args) => instance.current?.setCameraTarget(...args),
        resetCamera: () => instance.current?.resetCamera(),
        setAutoRotate: (enabled) => instance.current?.setAutoRotate(enabled),
        screenshot: (scale) => instance.current?.screenshot(scale) ?? '',
        downloadScreenshot: (...args) => instance.current?.downloadScreenshot(...args),
        playAnimation: (...args) => instance.current?.playAnimation(...args),
        pauseAnimation: () => instance.current?.pauseAnimation(),
        stopAnimation: () => instance.current?.stopAnimation(),
        setAnimationSpeed: (speed) => instance.current?.setAnimationSpeed(speed),
        getAnimations: () => instance.current?.getAnimations() ?? [],
        enterFullscreen: () => instance.current?.enterFullscreen(),
        exitFullscreen: () => instance.current?.exitFullscreen(),
        isFullscreen: () => instance.current?.isFullscreen() ?? false,
        update: (config) => instance.current?.update(config),
        destroy: () => instance.current?.destroy(),
        getThreeObjects: () => instance.current?.getThreeObjects() ?? null,
        getElements: () => instance.current?.getElements() ?? null,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    return <div ref={containerRef} className={className} style={style} />;
  },
);
