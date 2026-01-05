export interface Item {
  id: number
  name: string
  itemCode: string
  price: number
  stockQuantity: number
  lowStockThreshold: number
  category: string | null
  expiryDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Sale {
  id: number
  saleDate: Date
  totalAmount: number
  paymentMethod: 'cash' | 'credit' | 'mobile_payment'
  customerName: string | null
  invoiceNumber: string
  createdAt: Date
  updatedAt: Date
}

export interface SaleItem {
  id: number
  saleId: number
  itemId: number
  itemName?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Category {
  id: number
  name: string
  createdAt: Date
}

export interface SaleWithItems extends Sale {
  items: SaleItem[]
}

export interface DashboardOverview {
  totalSales: number
  totalTransactions: number
  totalItems: number
  lowStockItems: number
  todaySales: number
  weekSales: number
  monthSales: number
}

export interface SalesSummary {
  date: string
  totalSales: number
  transactionCount: number
}

export interface TopSellingItem {
  itemId: number
  itemName: string
  totalQuantity: number
  totalRevenue: number
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface DashboardAlert {
  type: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  itemId?: number
  itemCode?: string
  name?: string
  stockQuantity?: number
  expiryDate?: Date
  daysUntilExpiry?: number
}

export interface ExpiryAlertSummary {
  expired: DashboardAlert[]
  expiringSoon: DashboardAlert[]
  totalExpired: number
  totalExpiringSoon: number
}
