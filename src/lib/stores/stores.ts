import { writable } from 'svelte/store';
import type { Item, Sale, Notification } from '../types';

export const items = writable<Item[]>([]);
export const sales = writable<Sale[]>([]);
export const notifications = writable<Notification[]>([]);

// Alert store for notifications
export function addNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const id = Math.random().toString(36).substr(2, 9);
    notifications.update(n => [...n, { id, message, type }]);
    setTimeout(() => {
        notifications.update(n => n.filter(notification => notification.id !== id));
    }, 5000);
}

export function removeNotification(id: string) {
    notifications.update(n => n.filter(notification => notification.id !== id));
}

export function clearNotifications() {
    notifications.set([]);
}
