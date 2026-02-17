import { describe, it, expect, vi } from 'vitest';
import { AnimationClip, NumberKeyframeTrack, Object3D } from 'three';
import { AnimationMixerWrapper } from '../src/animation/animation-mixer';

function createTestClips(): AnimationClip[] {
  const track = new NumberKeyframeTrack('.position[x]', [0, 1], [0, 1]);
  return [
    new AnimationClip('Walk', 1, [track]),
    new AnimationClip('Run', 0.5, [track]),
  ];
}

describe('AnimationMixerWrapper', () => {
  it('returns animation names', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    expect(mixer.getAnimations()).toEqual(['Walk', 'Run']);
    mixer.dispose();
  });

  it('plays first animation by default', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play();
    expect(mixer.isPlaying()).toBe(true);
    mixer.dispose();
  });

  it('plays animation by index', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play(1);
    expect(mixer.isPlaying()).toBe(true);
    mixer.dispose();
  });

  it('plays animation by name', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play('Run');
    expect(mixer.isPlaying()).toBe(true);
    mixer.dispose();
  });

  it('pauses animation', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play();
    mixer.pause();
    // paused action still exists but is paused
    mixer.dispose();
  });

  it('stops animation', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play();
    mixer.stop();
    expect(mixer.isPlaying()).toBe(false);
    mixer.dispose();
  });

  it('sets playback speed', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play();
    mixer.setSpeed(2.0);
    // Just verify no errors
    mixer.dispose();
  });

  it('updates mixer with delta', () => {
    const model = new Object3D();
    const clips = createTestClips();
    const mixer = new AnimationMixerWrapper(model, clips);

    mixer.play();
    mixer.update(0.016);
    // Just verify no errors
    mixer.dispose();
  });

  it('handles empty clips', () => {
    const model = new Object3D();
    const mixer = new AnimationMixerWrapper(model, []);

    expect(mixer.getAnimations()).toEqual([]);
    mixer.play(); // should not throw
    mixer.dispose();
  });
});
