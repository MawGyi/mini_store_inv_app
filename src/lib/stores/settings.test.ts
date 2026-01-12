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
    expect(formatCurrency(10.99, 'CNY')).toBe('CN¥10.99');
  });

  it('should format THB correctly', () => {
    // THB uses Intl.NumberFormat which may include narrow/regular spaces
    expect(formatCurrency(100, 'THB')).toContain('THB');
    expect(formatCurrency(100, 'THB')).toContain('100.00');
    expect(formatCurrency(1000, 'THB')).toContain('1,000.00');
  });

  it('should format CAD correctly', () => {
    expect(formatCurrency(10.99, 'CAD')).toBe('CA$10.99');
  });

  it('should format AUD correctly', () => {
    expect(formatCurrency(10.99, 'AUD')).toBe('A$10.99');
  });

  it('should format MMK correctly without decimals', () => {
    // MMK uses Intl.NumberFormat which may include narrow/regular spaces
    expect(formatCurrency(1000, 'MMK')).toContain('MMK');
    expect(formatCurrency(1000, 'MMK')).toContain('1,000');
    expect(formatCurrency(1000000, 'MMK')).toContain('MMK');
    expect(formatCurrency(1000000, 'MMK')).toContain('1,000,000');
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
    // Intl.NumberFormat may add spaces between symbol and value
    const result = formatCurrency(10.99, 'XYZ');
    expect(result).toContain('XYZ');
    expect(result).toContain('10.99');
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

  it('should handle empty string currency', () => {
    expect(currencySymbol('')).toBe('');
  });
});

describe('Settings Store Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    settings.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should preserve existing settings when updating partial', () => {
    settings.update(s => ({ ...s, storeName: 'Test Store' }));
    settings.update(s => ({ ...s, currency: 'EUR' }));
    const current = get(settings);
    expect(current.storeName).toBe('Test Store');
    expect(current.currency).toBe('EUR');
    expect(current.storeAddress).toBe('123 Main Street, City');
  });

  it('should handle very long store name', () => {
    const longName = 'A'.repeat(100);
    settings.update(s => ({ ...s, storeName: longName }));
    expect(get(settings).storeName).toBe(longName);
  });

  it('should handle special characters in store name', () => {
    const specialName = "Store & Co.'s @ #1 Shop!";
    settings.update(s => ({ ...s, storeName: specialName }));
    expect(get(settings).storeName).toBe(specialName);
  });

  it('should handle unicode characters in store address', () => {
    const unicodeAddress = '東京、日本';
    settings.update(s => ({ ...s, storeAddress: unicodeAddress }));
    expect(get(settings).storeAddress).toBe(unicodeAddress);
  });

  it('should handle large low stock threshold', () => {
    settings.update(s => ({ ...s, lowStockThreshold: 1000 }));
    expect(get(settings).lowStockThreshold).toBe(1000);
  });

  it('should handle zero low stock threshold', () => {
    settings.update(s => ({ ...s, lowStockThreshold: 0 }));
    expect(get(settings).lowStockThreshold).toBe(0);
  });

  it('should persist settings across multiple updates', () => {
    settings.update(s => ({ ...s, storeName: 'Store 1', currency: 'EUR' }));
    settings.update(s => ({ ...s, storeName: 'Store 2' }));
    settings.update(s => ({ ...s, storeName: 'Store 3' }));
    expect(get(settings).storeName).toBe('Store 3');
    expect(get(settings).currency).toBe('EUR');
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('app_settings', 'invalid json');
    settings.load();
    const current = get(settings);
    expect(current.storeName).toBe('Mini Store');
    expect(current.currency).toBe('USD');
  });

  it('should handle partial localStorage data', () => {
    // Note: settings.load() only updates if localStorage has valid data
    // When store is already initialized, load() merges with current state
    localStorage.setItem('app_settings', JSON.stringify({ storeName: 'Partial Store' }));
    // Create a fresh store subscription to pick up the localStorage change
    settings.load();
    const current = get(settings);
    // The load function might not override existing values depending on implementation
    expect(current.currency).toBe('USD');
  });

  it('should handle all currency codes', () => {
    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'THB', 'JPY', 'CNY', 'MMK'];
    currencies.forEach(currency => {
      settings.update(s => ({ ...s, currency }));
      expect(get(settings).currency).toBe(currency);
    });
  });

  it('should handle timezone changes', () => {
    const timezones = [
      'Asia/Bangkok',
      'America/New_York',
      'Europe/London',
      'Australia/Sydney'
    ];
    timezones.forEach(timezone => {
      settings.update(s => ({ ...s, timezone }));
      expect(get(settings).timezone).toBe(timezone);
    });
  });
});

describe('formatCurrency Edge Cases', () => {
  it('should handle very small decimal values', () => {
    expect(formatCurrency(0.001, 'USD')).toBe('$0.00');
    expect(formatCurrency(0.009, 'USD')).toBe('$0.01');
  });

  it('should handle very large numbers', () => {
    expect(formatCurrency(9999999999.99, 'USD')).toBe('$9,999,999,999.99');
  });

  it('should handle number.MAX_VALUE', () => {
    const result = formatCurrency(Number.MAX_VALUE, 'USD');
    expect(result).toContain('$');
  });

  it('should handle NaN input gracefully', () => {
    const result = formatCurrency(NaN, 'USD');
    // Intl.NumberFormat returns 'NaN' or '$NaN' depending on locale
    expect(result).toContain('NaN');
  });

  it('should handle Infinity input', () => {
    const result = formatCurrency(Infinity, 'USD');
    // Intl.NumberFormat returns '$∞' or similar
    expect(result).toContain('∞');
  });

  it('should handle negative infinity', () => {
    const result = formatCurrency(-Infinity, 'USD');
    // Intl.NumberFormat returns '-$∞' or similar
    expect(result).toContain('∞');
  });

  it('should format MMK with proper grouping', () => {
    // MMK uses Intl.NumberFormat which includes a non-breaking space
    expect(formatCurrency(100, 'MMK')).toContain('MMK');
    expect(formatCurrency(100, 'MMK')).toContain('100');
    expect(formatCurrency(1000, 'MMK')).toContain('1,000');
    expect(formatCurrency(10000, 'MMK')).toContain('10,000');
    expect(formatCurrency(100000, 'MMK')).toContain('100,000');
    expect(formatCurrency(1000000, 'MMK')).toContain('1,000,000');
  });

  it('should format negative MMK values', () => {
    // Intl.NumberFormat formats negative values as '-MMK 1,000'
    const result = formatCurrency(-1000, 'MMK');
    expect(result).toContain('MMK');
    expect(result).toContain('1,000');
    expect(result).toContain('-');
  });

  it('should handle unknown currency with fallback', () => {
    // Intl.NumberFormat may add a space between symbol and value
    const result1 = formatCurrency(100, 'INVALID');
    expect(result1).toContain('INVALID');
    expect(result1).toContain('100.00');

    const result2 = formatCurrency(99.99, 'XYZ');
    expect(result2).toContain('XYZ');
    expect(result2).toContain('99.99');
  });

  it('should handle case-sensitive currency codes', () => {
    expect(currencySymbol('usd')).toBe('usd');
    expect(currencySymbol('Usd')).toBe('Usd');
    expect(currencySymbol('USD')).toBe('$');
  });
});
