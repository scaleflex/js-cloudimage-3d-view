import { createElement } from '../utils/dom';
import type { AnimationMixerWrapper } from './animation-mixer';

const PLAY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const PAUSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
const STOP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';

export interface AnimationControlsUI {
  element: HTMLElement;
  destroy(): void;
}

export function createAnimationControls(
  container: HTMLElement,
  mixer: AnimationMixerWrapper,
): AnimationControlsUI | null {
  const animations = mixer.getAnimations();
  if (animations.length === 0) return null;

  const element = createElement('div', 'ci-3d-animation-controls');

  const playBtn = createElement('button', 'ci-3d-animation-play', { 'aria-label': 'Play animation' });
  playBtn.innerHTML = PLAY_SVG;

  const pauseBtn = createElement('button', 'ci-3d-animation-pause', { 'aria-label': 'Pause animation' });
  pauseBtn.innerHTML = PAUSE_SVG;

  const stopBtn = createElement('button', 'ci-3d-animation-stop', { 'aria-label': 'Stop animation' });
  stopBtn.innerHTML = STOP_SVG;

  const select = createElement('select', 'ci-3d-animation-select', { 'aria-label': 'Select animation' });
  animations.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = name || `Animation ${index}`;
    select.appendChild(option);
  });

  const onPlay = () => {
    const selectedIndex = parseInt(select.value, 10);
    mixer.play(selectedIndex);
  };
  const onPause = () => mixer.pause();
  const onStop = () => mixer.stop();
  const onSelect = () => {
    const selectedIndex = parseInt(select.value, 10);
    mixer.play(selectedIndex);
  };

  playBtn.addEventListener('click', onPlay);
  pauseBtn.addEventListener('click', onPause);
  stopBtn.addEventListener('click', onStop);
  select.addEventListener('change', onSelect);

  element.appendChild(playBtn);
  element.appendChild(pauseBtn);
  element.appendChild(stopBtn);
  if (animations.length > 1) {
    element.appendChild(select);
  }
  container.appendChild(element);

  return {
    element,

    destroy() {
      playBtn.removeEventListener('click', onPlay);
      pauseBtn.removeEventListener('click', onPause);
      stopBtn.removeEventListener('click', onStop);
      select.removeEventListener('change', onSelect);
      element.remove();
    },
  };
}
