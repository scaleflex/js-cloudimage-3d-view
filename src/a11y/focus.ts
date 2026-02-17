export function setupFocusManagement(
  container: HTMLElement,
): void {
  // Ensure container is focusable
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '0');
  }
}

export function moveFocusToContainer(container: HTMLElement): void {
  container.focus();
}

export function moveFocusToElement(element: HTMLElement | null): void {
  element?.focus();
}
