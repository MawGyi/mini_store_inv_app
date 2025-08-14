import { expect, vi, beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import { configure } from '@testing-library/svelte';

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
  // Mock performance.now
  Object.defineProperty(global, 'performance', {
    writable: true,
    value: {
      now: vi.fn(() => 100),
    },
  });

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

  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 50,
    height: 20,
    top: 0,
    left: 0,
    bottom: 20,
    right: 50,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  } as DOMRect));

  // Mock createRange
  global.Range = vi.fn(() => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  })) as any;

  document.createRange = vi.fn(() => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    createContextualFragment: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    })),
    getClientRects: vi.fn(() => ({
      length: 0,
      item: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    })),
  }));
});
