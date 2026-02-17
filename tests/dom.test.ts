import { describe, it, expect } from 'vitest';
import {
  isBrowser,
  getElement,
  createElement,
  addClass,
  removeClass,
  toggleClass,
  injectStyles,
} from '../src/utils/dom';

describe('dom utils', () => {
  describe('isBrowser', () => {
    it('returns true in jsdom environment', () => {
      expect(isBrowser()).toBe(true);
    });
  });

  describe('getElement', () => {
    it('returns element from selector', () => {
      const el = document.createElement('div');
      el.id = 'test-el';
      document.body.appendChild(el);

      expect(getElement('#test-el')).toBe(el);
      document.body.removeChild(el);
    });

    it('returns element directly', () => {
      const el = document.createElement('div');
      expect(getElement(el)).toBe(el);
    });

    it('throws for missing selector', () => {
      expect(() => getElement('#nonexistent')).toThrow('Element not found');
    });
  });

  describe('createElement', () => {
    it('creates element with tag', () => {
      const el = createElement('div');
      expect(el.tagName).toBe('DIV');
    });

    it('creates element with className', () => {
      const el = createElement('div', 'my-class');
      expect(el.className).toBe('my-class');
    });

    it('creates element with attrs', () => {
      const el = createElement('button', undefined, { 'aria-label': 'test' });
      expect(el.getAttribute('aria-label')).toBe('test');
    });
  });

  describe('class manipulation', () => {
    it('adds class', () => {
      const el = document.createElement('div');
      addClass(el, 'foo', 'bar');
      expect(el.classList.contains('foo')).toBe(true);
      expect(el.classList.contains('bar')).toBe(true);
    });

    it('removes class', () => {
      const el = document.createElement('div');
      el.className = 'foo bar';
      removeClass(el, 'foo');
      expect(el.classList.contains('foo')).toBe(false);
      expect(el.classList.contains('bar')).toBe(true);
    });

    it('toggles class', () => {
      const el = document.createElement('div');
      toggleClass(el, 'active');
      expect(el.classList.contains('active')).toBe(true);
      toggleClass(el, 'active');
      expect(el.classList.contains('active')).toBe(false);
    });

    it('toggles class with force', () => {
      const el = document.createElement('div');
      toggleClass(el, 'active', true);
      expect(el.classList.contains('active')).toBe(true);
      toggleClass(el, 'active', true);
      expect(el.classList.contains('active')).toBe(true);
    });
  });

  describe('injectStyles', () => {
    it('injects style element', () => {
      injectStyles('.test { color: red; }', 'test-style');
      const style = document.getElementById('test-style');
      expect(style).toBeTruthy();
      expect(style?.textContent).toContain('.test');
      style?.remove();
    });

    it('is idempotent', () => {
      injectStyles('.test { color: red; }', 'test-idem');
      injectStyles('.test { color: blue; }', 'test-idem');
      const styles = document.querySelectorAll('#test-idem');
      expect(styles.length).toBe(1);
      styles.forEach((s) => s.remove());
    });
  });
});
