import { writable } from 'svelte/store';
import type { Item, Sale, Notification } from '../types/types';

export const items = writable<Item[]>([]);
export const sales = writable<Sale[]>([]);
export const notifications = writable<Notification[]>([]);

// Alert store for notifications
export function addNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    notifications.update(n => [...n, { id: Date.now().toString(), message, type }]);
    setTimeout(() => {
        notifications.update(n => n.filter(notification => notification.message !== message));
    }, 3000);
}
