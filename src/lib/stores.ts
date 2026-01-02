import { writable, derived } from 'svelte/store'
import type { Item, Sale, Notification } from '$lib/types'

export const items = writable<Item[]>([])
export const sales = writable<Sale[]>([])
export const notifications = writable<Notification[]>([])
export const loading = writable(false)

export const lowStockItems = derived(items, $items => 
  $items.filter(item => item.stockQuantity <= item.lowStockThreshold)
)

export const totalInventoryValue = derived(items, $items => 
  $items.reduce((sum, item) => sum + (item.price * item.stockQuantity), 0)
)

export const todaySales = derived(sales, $sales => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return $sales.filter(sale => new Date(sale.saleDate) >= today)
})

export const todayRevenue = derived(todaySales, $todaySales =>
  $todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
)

export function addNotification(notification: Omit<Notification, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9)
  notifications.update(n => [...n, { ...notification, id }])
  
  if (notification.duration !== 0) {
    setTimeout(() => {
      removeNotification(id)
    }, notification.duration || 5000)
  }
}

export function removeNotification(id: string) {
  notifications.update(n => n.filter(notification => notification.id !== id))
}

export function clearNotifications() {
  notifications.set([])
}
