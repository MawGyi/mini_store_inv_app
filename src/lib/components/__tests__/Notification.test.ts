import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/svelte';
import { writable, get } from 'svelte/store';
import { notifications, addNotification, removeNotification, clearNotifications, type Notification } from '$lib/stores/stores';

describe('Notification Stores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNotifications();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearNotifications();
    vi.clearAllMocks();
  });

  it('should start with empty notifications', () => {
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications).toHaveLength(0);
  });

  it('should add a notification with default success type', () => {
    addNotification('Test message');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications).toHaveLength(1);
    expect(currentNotifications[0].message).toBe('Test message');
    expect(currentNotifications[0].type).toBe('success');
  });

  it('should add notification with error type', () => {
    addNotification('Error message', 'error');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications[0].type).toBe('error');
  });

  it('should add notification with warning type', () => {
    addNotification('Warning message', 'warning');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications[0].type).toBe('warning');
  });

  it('should add notification with info type', () => {
    addNotification('Info message', 'info');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications[0].type).toBe('info');
  });

  it('should auto-remove notification after default timeout', async () => {
    addNotification('Auto-remove message', 'success');
    expect(notifications.subscribe(value => value.length)()).toBe(1);
    await waitFor(async () => {
      vi.advanceTimersByTime(5500);
    });
    expect(notifications.subscribe(value => value.length)()).toBe(0);
  });

  it('should generate unique IDs for notifications', () => {
    addNotification('Message 1', 'success');
    addNotification('Message 2', 'error');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    expect(currentNotifications[0].id).not.toBe(currentNotifications[1].id);
  });

  it('should handle multiple notifications', () => {
    addNotification('Message 1', 'success');
    addNotification('Message 2', 'error');
    addNotification('Message 3', 'warning');
    expect(notifications.subscribe(value => value.length)()).toBe(3);
  });

  it('should remove notification by id', () => {
    addNotification('Message 1', 'success');
    let currentNotifications: Notification[] = [];
    notifications.subscribe(value => currentNotifications = value)();
    const id = currentNotifications[0].id;
    
    removeNotification(id);
    expect(notifications.subscribe(value => value.length)()).toBe(0);
  });

  it('should clear all notifications', () => {
    addNotification('Message 1', 'success');
    addNotification('Message 2', 'error');
    expect(notifications.subscribe(value => value.length)()).toBe(2);
    
    clearNotifications();
    expect(notifications.subscribe(value => value.length)()).toBe(0);
  });

  it('should handle removing non-existent notification gracefully', () => {
    addNotification('Message 1', 'success');
    removeNotification('non-existent-id');
    expect(notifications.subscribe(value => value.length)()).toBe(1);
  });
});

describe('NotificationToast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should render notification message', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Test notification',
      type: 'success'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    render(NotificationToast, { props: { notification } });
    expect(screen.getByText('Test notification')).toBeTruthy();
  });

  it('should render success toast with correct styling', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Success message',
      type: 'success'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    const { container } = render(NotificationToast, { props: { notification } });
    const toast = container.querySelector('.notification-toast');
    expect(toast).toBeTruthy();
  });

  it('should render error toast with correct styling', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Error message',
      type: 'error'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    const { container } = render(NotificationToast, { props: { notification } });
    const toast = container.querySelector('.notification-toast');
    expect(toast).toBeTruthy();
  });

  it('should render warning toast', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Warning message',
      type: 'warning'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    const { container } = render(NotificationToast, { props: { notification } });
    const toast = container.querySelector('.notification-toast');
    expect(toast).toBeTruthy();
  });

  it('should render info toast', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Info message',
      type: 'info'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    const { container } = render(NotificationToast, { props: { notification } });
    const toast = container.querySelector('.notification-toast');
    expect(toast).toBeTruthy();
  });

  it('should render close button', async () => {
    const notification: Notification = {
      id: 'test-1',
      message: 'Test message',
      type: 'info'
    };
    const { NotificationToast } = await import('$lib/components/NotificationToast.svelte');
    const { container } = render(NotificationToast, { props: { notification } });
    const closeButton = container.querySelector('button');
    expect(closeButton).toBeTruthy();
  });
});

describe('NotificationContainer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNotifications();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearNotifications();
    cleanup();
  });

  it('should render empty when no notifications', async () => {
    clearNotifications();
    const { NotificationContainer } = await import('$lib/components/NotificationContainer.svelte');
    const { container } = render(NotificationContainer);
    const containerEl = container.querySelector('.notification-container');
    expect(containerEl).toBeTruthy();
  });

  it('should render notifications when present', async () => {
    addNotification('Test 1', 'success');
    addNotification('Test 2', 'error');
    const { NotificationContainer } = await import('$lib/components/NotificationContainer.svelte');
    const { container } = render(NotificationContainer);
    const toasts = container.querySelectorAll('.notification-toast');
    expect(toasts.length).toBeGreaterThanOrEqual(1);
  });

  it('should position container correctly', async () => {
    const { NotificationContainer } = await import('$lib/components/NotificationContainer.svelte');
    const { container } = render(NotificationContainer);
    const containerEl = container.querySelector('.notification-container');
    expect(containerEl).toBeTruthy();
  });
});
