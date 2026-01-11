// Core data types that all storage systems must support
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
  paymentMethod: string
  customerName: string | null
  invoiceNumber: string
  items?: CreateSaleItemData[]
  createdAt: Date
  updatedAt: Date
}

export interface SaleItem {
  id: number
  saleId: number
  itemId: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Category {
  id: number
  name: string
  createdAt: Date
}

// Input types for create operations
export interface CreateItemData {
  name: string
  itemCode: string
  price: number
  stockQuantity: number
  lowStockThreshold: number
  category?: string | null
  expiryDate?: Date | null
}

export interface UpdateItemData {
  name?: string
  itemCode?: string
  price?: number
  stockQuantity?: number
  lowStockThreshold?: number
  category?: string | null
  expiryDate?: Date | null
}

export interface CreateSaleData {
  saleDate: Date
  totalAmount: number
  paymentMethod: string
  customerName?: string | null
  invoiceNumber?: string
  items?: CreateSaleItemData[]
}

export interface CreateSaleItemData {
  itemId: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

// Query parameter types
export interface GetItemsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  sortBy?: 'name' | 'createdAt' | 'price' | 'stockQuantity'
  sortOrder?: 'asc' | 'desc'
}

export interface GetSalesParams {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  paymentMethod?: string
  customerName?: string
}

// Result types with pagination
export interface ItemResult {
  data: Item[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SaleResult {
  data: Sale[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Extended sale with items
export interface SaleWithItems extends Sale {
  items: (SaleItem & { itemName?: string; itemCode?: string })[]
}

// Statistics and analytics types
export interface DashboardStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalSales: number
  todaySales: number
  weeklySales: number
  monthlySales: number
  topSellingItems: Array<{
    itemId: number
    itemName: string
    itemCode: string
    totalSold: number
    revenue: number
  }>
  recentSales: Sale[]
  salesByCategory: Array<{
    categoryName: string
    totalSales: number
    revenue: number
  }>
}

// Health check result
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message: string
  details?: Record<string, any>
  timestamp: Date
}

// Storage operation result
export interface StorageOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, any>
}