import { CI3DView } from '../src/core/ci-3d-view';
import type { CI3DViewConfig, ToneMappingMode } from '../src/core/types';

declare const Prism: { highlight(code: string, grammar: any, language: string): string; languages: Record<string, any> } | undefined;

const MODEL_URL = 'https://fbmjmuoeb.filerobot.com/3D%20Models/Turing-Borwo.stl?vh=828731&func=proxy';

interface ConfigState {
  autoRotate: boolean;
  autoRotateSpeed: number;
  shadows: boolean;
  shadowOpacity: number;
  toneMapping: ToneMappingMode;
  toneMappingExposure: number;
  theme: 'light' | 'dark';
  background: string;
  fullscreenButton: boolean;
  backgroundToggleButton: boolean;
  screenshotButton: boolean;
  damping: boolean;
}

const DEFAULT_STATE: ConfigState = {
  autoRotate: true,
  autoRotateSpeed: 0.5,
  shadows: true,
  shadowOpacity: 0.3,
  toneMapping: 'aces',
  toneMappingExposure: 1.0,
  theme: 'light',
  background: '#f5f5f5',
  fullscreenButton: true,
  backgroundToggleButton: true,
  screenshotButton: true,
  damping: true,
};

// Module-scoped state persists across activations so user settings are preserved.
const state: ConfigState = { ...DEFAULT_STATE };
let instance: CI3DView | null = null;
let activeContainer: HTMLElement | null = null;
let listenersAttached = false;

function buildViewerConfig(
  extra?: Partial<CI3DViewConfig>,
): Partial<CI3DViewConfig> {
  return {
    src: MODEL_URL,
    autoRotate: state.autoRotate,
    autoRotateSpeed: state.autoRotateSpeed,
    shadows: state.shadows,
    shadowOpacity: state.shadowOpacity,
    toneMapping: state.toneMapping,
    toneMappingExposure: state.toneMappingExposure,
    theme: state.theme,
    background: state.background,
    fullscreenButton: state.fullscreenButton,
    backgroundToggleButton: state.backgroundToggleButton,
    screenshotButton: state.screenshotButton,
    damping: state.damping,
    alt: 'Configurator demo model',
    ...extra,
  };
}

/** Destroy the current viewer and create a fresh one, preserving camera. */
function recreateViewer(): void {
  if (!activeContainer) return;

  let cameraPosition: [number, number, number] | undefined;
  let cameraTarget: [number, number, number] | undefined;

  if (instance) {
    try {
      const { camera, controls } = instance.getThreeObjects();
      cameraPosition = [camera.position.x, camera.position.y, camera.position.z];
      cameraTarget = [controls.target.x, controls.target.y, controls.target.z];
    } catch { /* model may not be loaded yet */ }
    instance.destroy();
    instance = null;
  }

  instance = new CI3DView(
    activeContainer,
    buildViewerConfig({ cameraPosition, cameraTarget }),
  );
  updateCode();
}

/** Apply a live update (for slider changes — no recreation needed). */
function liveUpdate(partial: Partial<CI3DViewConfig>): void {
  instance?.update(partial);
  updateCode();
}

function updateCode(): void {
  const codeEl = document.getElementById('configurator-code');
  if (!codeEl) return;

  const lines = [`const viewer = new CI3DView('#container', {`];
  lines.push(`  src: 'model.glb',`);
  if (state.autoRotate) lines.push(`  autoRotate: true,`);
  if (state.autoRotate && state.autoRotateSpeed !== 0.5) {
    lines.push(`  autoRotateSpeed: ${state.autoRotateSpeed},`);
  }
  if (state.shadows) lines.push(`  shadows: true,`);
  if (state.shadows && state.shadowOpacity !== 0.3) {
    lines.push(`  shadowOpacity: ${state.shadowOpacity},`);
  }
  if (state.toneMapping !== 'aces') {
    lines.push(`  toneMapping: '${state.toneMapping}',`);
  }
  if (state.toneMappingExposure !== 1.0) {
    lines.push(`  toneMappingExposure: ${state.toneMappingExposure},`);
  }
  if (state.theme !== 'light') lines.push(`  theme: '${state.theme}',`);
  if (state.background !== '#f5f5f5') lines.push(`  background: '${state.background}',`);
  if (state.fullscreenButton) lines.push(`  fullscreenButton: true,`);
  if (state.backgroundToggleButton) lines.push(`  backgroundToggleButton: true,`);
  if (state.screenshotButton) lines.push(`  screenshotButton: true,`);
  if (!state.damping) lines.push(`  damping: false,`);
  lines.push(`});`);

  const raw = lines.join('\n');

  // Highlight with Prism if available
  if (typeof Prism !== 'undefined' && Prism.languages.javascript) {
    codeEl.innerHTML = Prism.highlight(raw, Prism.languages.javascript, 'javascript');
  } else {
    codeEl.textContent = raw;
  }
}

/** Attach event listeners to configurator controls (called once). */
function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  const el = (id: string) =>
    document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;

  // --- Sliders (live update via update(), no recreation) ---

  el('cfg-rotate-speed')?.addEventListener('input', (e) => {
    state.autoRotateSpeed = parseFloat((e.target as HTMLInputElement).value);
    const valEl = document.getElementById('cfg-rotate-speed-val');
    if (valEl) valEl.textContent = String(state.autoRotateSpeed);
    liveUpdate({ autoRotateSpeed: state.autoRotateSpeed });
  });

  el('cfg-shadow-opacity')?.addEventListener('input', (e) => {
    state.shadowOpacity = parseFloat((e.target as HTMLInputElement).value);
    const valEl = document.getElementById('cfg-shadow-opacity-val');
    if (valEl) valEl.textContent = String(state.shadowOpacity);
    liveUpdate({ shadowOpacity: state.shadowOpacity });
  });

  el('cfg-exposure')?.addEventListener('input', (e) => {
    state.toneMappingExposure = parseFloat((e.target as HTMLInputElement).value);
    const valEl = document.getElementById('cfg-exposure-val');
    if (valEl) valEl.textContent = state.toneMappingExposure.toFixed(1);
    liveUpdate({ toneMappingExposure: state.toneMappingExposure });
  });

  // --- Selects & color (recreate viewer to ensure full consistency) ---

  el('cfg-tone-mapping')?.addEventListener('change', (e) => {
    state.toneMapping = (e.target as HTMLSelectElement).value as ToneMappingMode;
    recreateViewer();
  });

  el('cfg-theme')?.addEventListener('change', (e) => {
    state.theme = (e.target as HTMLSelectElement).value as 'light' | 'dark';
    recreateViewer();
  });

  el('cfg-background')?.addEventListener('input', (e) => {
    state.background = (e.target as HTMLInputElement).value;
    liveUpdate({ background: state.background });
  });

  // --- Checkboxes (recreate viewer to reflect DOM-level changes) ---

  el('cfg-auto-rotate')?.addEventListener('change', (e) => {
    state.autoRotate = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  el('cfg-shadows')?.addEventListener('change', (e) => {
    state.shadows = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  el('cfg-fullscreen')?.addEventListener('change', (e) => {
    state.fullscreenButton = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  el('cfg-bg-toggle')?.addEventListener('change', (e) => {
    state.backgroundToggleButton = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  el('cfg-screenshot')?.addEventListener('change', (e) => {
    state.screenshotButton = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  el('cfg-damping')?.addEventListener('change', (e) => {
    state.damping = (e.target as HTMLInputElement).checked;
    recreateViewer();
  });

  // Copy button
  const copyBtn = document.getElementById('configurator-copy');
  copyBtn?.addEventListener('click', () => {
    const text = document.getElementById('configurator-code')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.classList.add('copied');
      setTimeout(() => copyBtn.classList.remove('copied'), 2000);
    });
  });
}

export function initConfigurator(container: HTMLElement): void {
  activeContainer = container;

  // Pin min-height to prevent layout shift
  const rect = container.getBoundingClientRect();
  container.style.minHeight = `${rect.height || 400}px`;

  // Create instance
  instance = new CI3DView(container, buildViewerConfig());

  // Enable all controls (they start disabled/muted in the HTML)
  const controlsPanel = document.getElementById('configurator-controls');
  if (controlsPanel) {
    controlsPanel.classList.remove('configurator__controls--muted');
    controlsPanel.querySelectorAll<HTMLElement>('input, select, button').forEach((ctrl) => {
      ctrl.removeAttribute('disabled');
    });
  }

  attachListeners();

  // Initial code generation (with highlighting)
  updateCode();
}

export function destroyConfigurator(): void {
  instance?.destroy();
  instance = null;
  activeContainer = null;

  const controlsPanel = document.getElementById('configurator-controls');
  if (controlsPanel) {
    controlsPanel.classList.add('configurator__controls--muted');
    controlsPanel.querySelectorAll<HTMLElement>('input, select, button').forEach((ctrl) => {
      ctrl.setAttribute('disabled', '');
    });
  }
}
