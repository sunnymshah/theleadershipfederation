/**
 * Vitest setup — polyfill browser APIs missing from jsdom that some
 * transitive imports (e.g. @dnd-kit, embla-carousel) reach for at module
 * load time, even when their consumer in the test isn't actually
 * exercising drag-and-drop / observer-based behaviour.
 */

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  root = null
  rootMargin = ""
  thresholds: number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

;(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
  (globalThis as unknown as { ResizeObserver?: typeof MockResizeObserver }).ResizeObserver ?? MockResizeObserver

;(globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
  (globalThis as unknown as { IntersectionObserver?: typeof MockIntersectionObserver }).IntersectionObserver ?? MockIntersectionObserver

// matchMedia — used by various Tailwind / responsive helpers.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList)
}
