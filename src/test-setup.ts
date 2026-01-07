import { expect, vi, beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import { configure } from '@testing-library/svelte';

configure({
  testIdAttribute: 'data-testid',
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    
    constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    
    observe(target: Element): void {
      this.callback([{ 
        isIntersecting: true, 
        target,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        isVisible: true,
        rootBounds: null,
        time: 0
      } as IntersectionObserverEntry], this);
    }
    
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  
  window.IntersectionObserver = MockIntersectionObserver as any;
});
