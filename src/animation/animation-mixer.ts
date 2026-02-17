import { AnimationMixer, AnimationAction, AnimationClip, Object3D } from 'three';

export class AnimationMixerWrapper {
  private mixer: AnimationMixer;
  private clips: AnimationClip[];
  private currentAction: AnimationAction | null = null;

  constructor(model: Object3D, clips: AnimationClip[]) {
    this.mixer = new AnimationMixer(model);
    this.clips = clips;
  }

  play(indexOrName?: number | string): void {
    if (this.clips.length === 0) return;

    let clip: AnimationClip | undefined;
    if (typeof indexOrName === 'number') {
      clip = this.clips[indexOrName];
    } else if (typeof indexOrName === 'string') {
      clip = this.clips.find((c) => c.name === indexOrName);
    } else {
      clip = this.clips[0];
    }

    if (!clip) return;

    if (this.currentAction) {
      this.currentAction.stop();
    }

    this.currentAction = this.mixer.clipAction(clip);
    this.currentAction.reset().play();
  }

  pause(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
    }
  }

  resume(): void {
    if (this.currentAction) {
      this.currentAction.paused = false;
    }
  }

  stop(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
  }

  setSpeed(speed: number): void {
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }
  }

  getAnimations(): string[] {
    return this.clips.map((c) => c.name);
  }

  update(delta: number): void {
    this.mixer.update(delta);
  }

  isPlaying(): boolean {
    return this.currentAction !== null && this.currentAction.isRunning();
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
