import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import SkeletonLoader from '../SkeletonLoader.svelte';

describe('SkeletonLoader Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render text skeleton by default', () => {
    const { container } = render(SkeletonLoader);
    const skeleton = container.querySelector('.skeleton-text');
    expect(skeleton).toBeTruthy();
  });

  it('should render text skeleton with custom width', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'text', width: '50%' }
    });
    const skeleton = container.querySelector('.skeleton-text');
    expect(skeleton).toBeTruthy();
  });

  it('should render avatar skeleton', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'avatar' }
    });
    const skeleton = container.querySelector('.skeleton-avatar');
    expect(skeleton).toBeTruthy();
  });

  it('should render card skeleton', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'card', lines: 3 }
    });
    const skeleton = container.querySelector('.skeleton-card');
    expect(skeleton).toBeTruthy();
    const header = container.querySelector('.skeleton-card-header');
    expect(header).toBeTruthy();
    const body = container.querySelector('.skeleton-card-body');
    expect(body).toBeTruthy();
  });

  it('should render table-row skeleton', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'table-row' }
    });
    const skeleton = container.querySelector('.skeleton-table-row');
    expect(skeleton).toBeTruthy();
  });

  it('should render multiple lines in card', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'card', lines: 5 }
    });
    const lines = container.querySelectorAll('.skeleton-line');
    expect(lines).toHaveLength(5);
  });

  it('should render table cells', () => {
    const { container } = render(SkeletonLoader, {
      props: { type: 'table-row' }
    });
    const cells = container.querySelectorAll('.skeleton-cell');
    expect(cells.length).toBeGreaterThan(0);
  });
});
