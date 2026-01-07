import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { settings, formatCurrency, currencySymbol, type Settings } from '$lib/stores/settings';

describe('Settings Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    settings.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should have default settings', () => {
    const currentSettings = get(settings);
    expect(currentSettings.storeName).toBe('Mini Store');
    expect(currentSettings.currency).toBe('USD');
    expect(currentSettings.lowStockThreshold).toBe(10);
  });

  it('should update store name', () => {
    settings.update(s => ({ ...s, storeName: 'New Store' }));
    expect(get(settings).storeName).toBe('New Store');
  });

  it('should update currency', () => {
    settings.update(s => ({ ...s, currency: 'EUR' }));
    expect(get(settings).currency).toBe('EUR');
  });

  it('should update low stock threshold', () => {
    settings.update(s => ({ ...s, lowStockThreshold: 20 }));
    expect(get(settings).lowStockThreshold).toBe(20);
  });

  it('should update multiple settings at once', () => {
    const newSettings: Settings = {
      storeName: 'Updated Store',
      storeAddress: '456 New Street',
      storePhone: '555-9999',
      storeEmail: 'new@store.com',
      currency: 'GBP',
      timezone: 'Europe/London',
      lowStockThreshold: 15,
      enableNotifications: false,
      enableEmailReports: true
    };
    settings.set(newSettings);
    const current = get(settings);
    expect(current.storeName).toBe('Updated Store');
    expect(current.currency).toBe('GBP');
    expect(current.enableNotifications).toBe(false);
  });

  it('should reset to defaults', () => {
    settings.update(s => ({ ...s, storeName: 'Modified', currency: 'JPY' }));
    settings.reset();
    const current = get(settings);
    expect(current.storeName).toBe('Mini Store');
    expect(current.currency).toBe('USD');
  });

  it('should handle store address update', () => {
    settings.update(s => ({ ...s, storeAddress: '123 Test Ave' }));
    expect(get(settings).storeAddress).toBe('123 Test Ave');
  });

  it('should handle store phone update', () => {
    settings.update(s => ({ ...s, storePhone: '+1-800-123-4567' }));
    expect(get(settings).storePhone).toBe('+1-800-123-4567');
  });

  it('should handle store email update', () => {
    settings.update(s => ({ ...s, storeEmail: 'test@example.com' }));
    expect(get(settings).storeEmail).toBe('test@example.com');
  });

  it('should handle timezone update', () => {
    settings.update(s => ({ ...s, timezone: 'America/New_York' }));
    expect(get(settings).timezone).toBe('America/New_York');
  });

  it('should toggle notifications', () => {
    expect(get(settings).enableNotifications).toBe(true);
    settings.update(s => ({ ...s, enableNotifications: false }));
    expect(get(settings).enableNotifications).toBe(false);
  });

  it('should toggle email reports', () => {
    expect(get(settings).enableEmailReports).toBe(false);
    settings.update(s => ({ ...s, enableEmailReports: true }));
    expect(get(settings).enableEmailReports).toBe(true);
  });
});

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(10.99, 'USD')).toBe('$10.99');
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should format EUR correctly', () => {
    expect(formatCurrency(10.99, 'EUR')).toBe('€10.99');
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });

  it('should format GBP correctly', () => {
    expect(formatCurrency(10.99, 'GBP')).toBe('£10.99');
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
  });

  it('should format JPY correctly', () => {
    expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
    expect(formatCurrency(10000, 'JPY')).toBe('¥10,000');
  });

  it('should format CNY correctly', () => {
    expect(formatCurrency(10.99, 'CNY')).toBe('¥10.99');
  });

  it('should format THB correctly', () => {
    expect(formatCurrency(100, 'THB')).toBe('฿100.00');
    expect(formatCurrency(1000, 'THB')).toBe('฿1,000.00');
  });

  it('should format CAD correctly', () => {
    expect(formatCurrency(10.99, 'CAD')).toBe('C$10.99');
  });

  it('should format AUD correctly', () => {
    expect(formatCurrency(10.99, 'AUD')).toBe('A$10.99');
  });

  it('should format MMK correctly without decimals', () => {
    expect(formatCurrency(1000, 'MMK')).toBe('MMK 1,000');
    expect(formatCurrency(1000000, 'MMK')).toBe('MMK 1,000,000');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-10.99, 'USD')).toBe('-$10.99');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
    expect(formatCurrency(0, 'EUR')).toBe('€0.00');
  });

  it('should handle large values', () => {
    expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
  });

  it('should handle small decimal values', () => {
    expect(formatCurrency(0.01, 'USD')).toBe('$0.01');
  });

  it('should fallback to symbol for unknown currency', () => {
    expect(formatCurrency(10.99, 'XYZ')).toBe('XYZ10.99');
  });
});

describe('currencySymbol', () => {
  it('should return correct symbol for USD', () => {
    expect(currencySymbol('USD')).toBe('$');
  });

  it('should return correct symbol for EUR', () => {
    expect(currencySymbol('EUR')).toBe('€');
  });

  it('should return correct symbol for GBP', () => {
    expect(currencySymbol('GBP')).toBe('£');
  });

  it('should return correct symbol for JPY', () => {
    expect(currencySymbol('JPY')).toBe('¥');
  });

  it('should return correct symbol for CNY', () => {
    expect(currencySymbol('CNY')).toBe('¥');
  });

  it('should return correct symbol for THB', () => {
    expect(currencySymbol('THB')).toBe('฿');
  });

  it('should return correct symbol for CAD', () => {
    expect(currencySymbol('CAD')).toBe('C$');
  });

  it('should return correct symbol for AUD', () => {
    expect(currencySymbol('AUD')).toBe('A$');
  });

  it('should return MMK for MMK currency', () => {
    expect(currencySymbol('MMK')).toBe('MMK');
  });

  it('should return the currency code for unknown currency', () => {
    expect(currencySymbol('XYZ')).toBe('XYZ');
  });
});
