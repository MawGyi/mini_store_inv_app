import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { auth, currentUser, isAuthenticated, isLoading, type User } from '$lib/stores/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
    auth.logout();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
    auth.logout();
  });

  it('should have initial unauthenticated state', () => {
    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should set loading state during login', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '1', email: 'test@test.com', name: 'Test', role: 'Admin' } })
      })
    );
    const loginPromise = auth.login('test@test.com', 'password');
    expect(get(auth).isLoading).toBe(true);
    await loginPromise;
    expect(get(auth).isLoading).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '123', email: 'admin@ministore.com', name: 'Admin', role: 'Administrator' },
          redirectTo: '/dashboard'
        })
      })
    );
    const result = await auth.login('admin@ministore.com', 'admin123');
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe('/dashboard');

    const state = get(auth);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('admin@ministore.com');
    expect(state.user?.role).toBe('Administrator');
  });

  it('should login successfully with remember me flag', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '123', email: 'test@test.com', name: 'Test', role: 'User' },
          redirectTo: '/dashboard'
        })
      })
    );
    await auth.login('test@test.com', 'password123', true);
    expect(get(auth).isAuthenticated).toBe(true);
  });

  it('should fail login with invalid credentials', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Invalid email or password' })
      })
    );
    const result = await auth.login('wrong@test.com', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid email or password');
    expect(get(auth).isAuthenticated).toBe(false);
  });

  it('should fail login with network error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    const result = await auth.login('test@test.com', 'password');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Connection error');
  });

  it('should logout successfully', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '1', email: 'admin@ministore.com', name: 'Admin', role: 'Administrator' }
        })
      })
    );

    await auth.login('admin@ministore.com', 'admin123');
    expect(get(auth).isAuthenticated).toBe(true);

    await auth.logout();

    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should logout even on network error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    await auth.logout();

    const state = get(auth);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should use email prefix as default name', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '1', email: 'john.doe@test.com', role: 'User' },
          redirectTo: '/dashboard'
        })
      })
    );
    await auth.login('john.doe@test.com', 'password');
    expect(get(auth).user?.name).toBe('john.doe');
  });

  it('should use provided name in login response', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '1', email: 'test@test.com', name: 'Custom Name', role: 'User' },
          redirectTo: '/dashboard'
        })
      })
    );
    await auth.login('test@test.com', 'password');
    expect(get(auth).user?.name).toBe('Custom Name');
  });

  it('should handle missing user role with default', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '1', email: 'test@test.com', name: 'Test' },
          redirectTo: '/dashboard'
        })
      })
    );
    await auth.login('test@test.com', 'password');
    expect(get(auth).user?.role).toBe('Administrator');
  });
});

describe('Derived Auth Stores', () => {
  beforeEach(() => {
    auth.logout();
  });

  afterEach(() => {
    auth.logout();
  });

  it('currentUser should return null when not authenticated', () => {
    expect(get(currentUser)).toBeNull();
  });

  it('currentUser should return user when authenticated', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: '1', email: 'test@test.com', name: 'Test', role: 'User' }
        })
      })
    );
    auth.login('test@test.com', 'password');
    await waitFor(() => {
      expect(get(currentUser)?.email).toBe('test@test.com');
    });
  });

  it('isAuthenticated should be false initially', () => {
    expect(get(isAuthenticated)).toBe(false);
  });

  it('isAuthenticated should be true after login', async () => {
    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '1', email: 'test@test.com', name: 'Test', role: 'User' } })
      })
    );
    await auth.login('test@test.com', 'password');
    expect(get(isAuthenticated)).toBe(true);
  });

  it('isLoading should be false initially after logout', () => {
    expect(get(isLoading)).toBe(false);
  });

  it('isLoading should be true during login', async () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100)).then(() => ({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '1', email: 'test@test.com', name: 'Test', role: 'User' } })
      }))
    );
    const loginPromise = auth.login('test@test.com', 'password');
    expect(get(isLoading)).toBe(true);
    await loginPromise;
    expect(get(isLoading)).toBe(false);
  });
});
