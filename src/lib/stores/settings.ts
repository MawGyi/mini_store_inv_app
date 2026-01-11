import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export interface Settings {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  currency: string
  timezone: string
  lowStockThreshold: number
  enableNotifications: boolean
  enableEmailReports: boolean
}

const defaultSettings: Settings = {
  storeName: 'Mini Store',
  storeAddress: '123 Main Street, City',
  storePhone: '+1 234 567 8900',
  storeEmail: 'contact@ministore.com',
  currency: 'USD',
  timezone: 'Asia/Bangkok',
  lowStockThreshold: 10,
  enableNotifications: true,
  enableEmailReports: false
}

function createSettingsStore() {
  const stored = browser ? localStorage.getItem('app_settings') : null
  const initial = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  
  const { subscribe, set, update } = writable<Settings>(initial)
  
  return {
    subscribe,
    set: (settings: Settings) => {
      if (browser) {
        localStorage.setItem('app_settings', JSON.stringify(settings))
      }
      set(settings)
    },
    update: (fn: (s: Settings) => Settings) => {
      update(s => {
        const newSettings = fn(s)
        if (browser) {
          localStorage.setItem('app_settings', JSON.stringify(newSettings))
        }
        return newSettings
      })
    },
    load: () => {
      if (browser) {
        const stored = localStorage.getItem('app_settings')
        if (stored) {
          set({ ...defaultSettings, ...JSON.parse(stored) })
        }
      }
    },
    reset: () => {
      if (browser) {
        localStorage.removeItem('app_settings')
      }
      set(defaultSettings)
    }
  }
}

export const settings = createSettingsStore()

export const currencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    THB: '฿',
    JPY: '¥',
    CNY: '¥',
    MMK: 'MMK'
  }
  return symbols[currency] || currency
}

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  if (currency === 'MMK') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value)
  } catch {
    return `${currencySymbol(currency)}${value.toFixed(2)}`
  }
}
