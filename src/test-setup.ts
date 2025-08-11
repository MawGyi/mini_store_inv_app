import { expect, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import matchers from '@testing-library/jest-dom/matchers';
import { configure } from '@testing-library/svelte';

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  toBeInTheDocument(element: HTMLElement) {
    const pass = element !== null && element !== undefined;
    return {
      pass,
      message: () => `Expected element ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  toHaveClass(element: HTMLElement, className: string) {
    const pass = element.classList.contains(className);
    return {
      pass,
      message: () => `Expected element to ${pass ? 'not ' : ''}have class '${className}'`,
    };
  },
});

// Test IDs for querying elements in tests
export const TEST_IDS = {
  EDIT_BUTTON: 'edit-button',
  DELETE_BUTTON: 'delete-button',
  SALE_BUTTON: 'sale-button',
} as const;

configure({
  testIdAttribute: 'data-testid',
});

// Run cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock global objects needed for tests
beforeAll(() => {
  // Mock matchMedia
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

  // Mock IntersectionObserver
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    
    constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    
    observe(target: Element): void {
      // Immediately trigger the callback with the target being visible
      this.callback([{ 
        isIntersecting: true, 
        target,
        // Add other required properties with default values
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
  
  // @ts-ignore
  window.IntersectionObserver = MockIntersectionObserver;
});
