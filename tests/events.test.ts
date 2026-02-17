import { describe, it, expect, vi } from 'vitest';
import { EventEmitter, addListener, throttle } from '../src/utils/events';

describe('EventEmitter', () => {
  it('calls handler on emit', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on('test', handler);
    emitter.emit('test', 'arg1', 'arg2');

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('removes handler with off', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles once listener', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.once('test', handler);
    emitter.emit('test');
    emitter.emit('test');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes all listeners', () => {
    const emitter = new EventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('a', handler1);
    emitter.on('b', handler2);
    emitter.removeAllListeners();
    emitter.emit('a');
    emitter.emit('b');

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});

describe('addListener', () => {
  it('adds and removes event listener', () => {
    const el = document.createElement('div');
    const handler = vi.fn();

    const cleanup = addListener(el, 'click', handler);
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  it('calls function immediately on first invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throttles subsequent calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
