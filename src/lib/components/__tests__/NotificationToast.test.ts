import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import NotificationToast from '../NotificationToast.svelte';

describe('NotificationToast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should render with message', () => {
    render(NotificationToast, {
      props: { message: 'Test notification', type: 'success', id: 'test-1', duration: 5000 }
    });
    expect(screen.getByText('Test notification')).toBeTruthy();
  });

  it('should render success type', () => {
    const { container } = render(NotificationToast, {
      props: { message: 'Success!', type: 'success', id: 'test-2', duration: 5000 }
    });
    expect(container.querySelector('.notification-toast')).toBeTruthy();
    expect(screen.getByText('Success!')).toBeTruthy();
  });

  it('should render error type', () => {
    render(NotificationToast, {
      props: { message: 'Error occurred', type: 'error', id: 'test-3', duration: 5000 }
    });
    expect(screen.getByText('Error occurred')).toBeTruthy();
  });

  it('should render warning type', () => {
    render(NotificationToast, {
      props: { message: 'Warning!', type: 'warning', id: 'test-4', duration: 5000 }
    });
    expect(screen.getByText('Warning!')).toBeTruthy();
  });

  it('should render info type', () => {
    render(NotificationToast, {
      props: { message: 'Info message', type: 'info', id: 'test-5', duration: 5000 }
    });
    expect(screen.getByText('Info message')).toBeTruthy();
  });

  it('should have close button', () => {
    const { container } = render(NotificationToast, {
      props: { message: 'Closable', type: 'info', id: 'test-6', duration: 5000 }
    });
    const closeButton = container.querySelector('.notification-close');
    expect(closeButton).toBeTruthy();
  });

  it('should render progress bar when duration > 0', () => {
    const { container } = render(NotificationToast, {
      props: { message: 'With progress', type: 'info', id: 'test-7', duration: 5000 }
    });
    const progressBar = container.querySelector('.notification-progress');
    expect(progressBar).toBeTruthy();
  });

  it('should render with long message', () => {
    const longMessage = 'A'.repeat(200);
    render(NotificationToast, {
      props: { message: longMessage, type: 'info', id: 'test-8', duration: 5000 }
    });
    expect(screen.getByText(longMessage)).toBeTruthy();
  });
});
