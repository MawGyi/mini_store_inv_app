import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
    items,
    sales,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
} from '$lib/stores/stores';

describe('Notification Store Functions', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearNotifications();
    });

    afterEach(() => {
        vi.useRealTimers();
        clearNotifications();
    });

    describe('addNotification', () => {
        it('should add a notification with auto-generated ID', () => {
            addNotification('Test message', 'success');
            const current = get(notifications);

            expect(current).toHaveLength(1);
            expect(current[0].message).toBe('Test message');
            expect(current[0].type).toBe('success');
            expect(current[0].id).toBeDefined();
        });

        it('should default to success type', () => {
            addNotification('Success message');
            const current = get(notifications);

            expect(current[0].type).toBe('success');
        });

        it('should add error notification', () => {
            addNotification('Error message', 'error');
            const current = get(notifications);

            expect(current[0].type).toBe('error');
        });

        it('should add warning notification', () => {
            addNotification('Warning message', 'warning');
            const current = get(notifications);

            expect(current[0].type).toBe('warning');
        });

        it('should add info notification', () => {
            addNotification('Info message', 'info');
            const current = get(notifications);

            expect(current[0].type).toBe('info');
        });

        it('should add multiple notifications', () => {
            addNotification('First message', 'success');
            addNotification('Second message', 'error');
            addNotification('Third message', 'warning');

            const current = get(notifications);
            expect(current).toHaveLength(3);
        });

        it('should generate unique IDs for each notification', () => {
            addNotification('First');
            addNotification('Second');

            const current = get(notifications);
            expect(current[0].id).not.toBe(current[1].id);
        });

        it('should auto-remove notification after 5 seconds', () => {
            addNotification('Auto-remove message');

            expect(get(notifications)).toHaveLength(1);

            // Advance timers by 5 seconds
            vi.advanceTimersByTime(5000);

            expect(get(notifications)).toHaveLength(0);
        });

        it('should auto-remove only the specific notification after timeout', () => {
            addNotification('First message');
            vi.advanceTimersByTime(2000);

            addNotification('Second message');

            // Advance 3 more seconds - first should be removed
            vi.advanceTimersByTime(3000);

            const current = get(notifications);
            expect(current).toHaveLength(1);
            expect(current[0].message).toBe('Second message');
        });
    });

    describe('removeNotification', () => {
        it('should remove notification by ID', () => {
            addNotification('Test message');
            const current = get(notifications);
            const id = current[0].id;

            removeNotification(id);

            expect(get(notifications)).toHaveLength(0);
        });

        it('should only remove the specified notification', () => {
            addNotification('First');
            addNotification('Second');
            addNotification('Third');

            const current = get(notifications);
            const secondId = current[1].id;

            removeNotification(secondId);

            const remaining = get(notifications);
            expect(remaining).toHaveLength(2);
            expect(remaining[0].message).toBe('First');
            expect(remaining[1].message).toBe('Third');
        });

        it('should handle removing non-existent ID gracefully', () => {
            addNotification('Test');

            // Should not throw
            removeNotification('non-existent-id');

            expect(get(notifications)).toHaveLength(1);
        });
    });

    describe('clearNotifications', () => {
        it('should clear all notifications', () => {
            addNotification('First');
            addNotification('Second');
            addNotification('Third');

            expect(get(notifications)).toHaveLength(3);

            clearNotifications();

            expect(get(notifications)).toHaveLength(0);
        });

        it('should work when no notifications exist', () => {
            // Should not throw
            clearNotifications();

            expect(get(notifications)).toHaveLength(0);
        });
    });
});

describe('Items Store', () => {
    beforeEach(() => {
        items.set([]);
    });

    it('should start with empty array', () => {
        expect(get(items)).toEqual([]);
    });

    it('should store items', () => {
        const testItems = [
            { id: 1, name: 'Item 1', itemCode: 'I001', price: 10, stockQuantity: 50, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
        ];
        items.set(testItems);

        expect(get(items)).toHaveLength(1);
        expect(get(items)[0].name).toBe('Item 1');
    });
});

describe('Sales Store', () => {
    beforeEach(() => {
        sales.set([]);
    });

    it('should start with empty array', () => {
        expect(get(sales)).toEqual([]);
    });

    it('should store sales', () => {
        const testSales = [
            { id: 1, saleDate: new Date(), totalAmount: 100, paymentMethod: 'cash' as const, customerName: null, invoiceNumber: 'INV-001', createdAt: new Date(), updatedAt: new Date() }
        ];
        sales.set(testSales);

        expect(get(sales)).toHaveLength(1);
        expect(get(sales)[0].totalAmount).toBe(100);
    });
});
