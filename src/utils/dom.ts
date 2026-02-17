export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getElement(selectorOrElement: HTMLElement | string): HTMLElement {
  if (typeof selectorOrElement === 'string') {
    const el = document.querySelector<HTMLElement>(selectorOrElement);
    if (!el) {
      throw new Error(`CI3DView: Element not found for selector "${selectorOrElement}"`);
    }
    return el;
  }
  return selectorOrElement;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

export function addClass(el: HTMLElement, ...classNames: string[]): void {
  el.classList.add(...classNames);
}

export function removeClass(el: HTMLElement, ...classNames: string[]): void {
  el.classList.remove(...classNames);
}

export function toggleClass(el: HTMLElement, className: string, force?: boolean): void {
  el.classList.toggle(className, force);
}

export function injectStyles(css: string, id: string): void {
  if (!isBrowser()) return;
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
