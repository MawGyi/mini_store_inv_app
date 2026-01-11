import type {
  Item,
  Sale,
  SaleItem,
  Category,
  CreateItemData,
  UpdateItemData,
  CreateSaleData,
  GetItemsParams,
  GetSalesParams,
  ItemResult,
  SaleResult,
  SaleWithItems,
  DashboardStats,
  HealthCheckResult,
  StorageOperationResult
} from './types'

// Main storage interface that all adapters must implement
export interface StorageAdapter {
  // Health and initialization
  healthCheck(): Promise<HealthCheckResult>
  initialize(): Promise<void>
  cleanup(): Promise<void>

  // Items CRUD operations
  getItems(params?: GetItemsParams): Promise<ItemResult>
  getItemById(id: number): Promise<Item | null>
  getItemByCode(itemCode: string): Promise<Item | null>
  createItem(data: CreateItemData): Promise<StorageOperationResult<Item>>
  updateItem(id: number, data: UpdateItemData): Promise<StorageOperationResult<Item>>
  deleteItem(id: number): Promise<StorageOperationResult<Item>>
  searchItems(query: string): Promise<Item[]>

  // Sales CRUD operations
  getSales(params?: GetSalesParams): Promise<SaleResult>
  getSaleById(id: number): Promise<Sale | null>
  getSaleWithItems(id: number): Promise<SaleWithItems | null>
  createSale(data: CreateSaleData): Promise<StorageOperationResult<Sale>>
  updateSale(id: number, data: Partial<CreateSaleData>): Promise<StorageOperationResult<Sale>>
  deleteSale(id: number): Promise<StorageOperationResult<Sale>>

  // Categories operations
  getCategories(): Promise<Category[]>
  getCategoryById(id: number): Promise<Category | null>
  getCategoryByName(name: string): Promise<Category | null>
  createCategory(name: string): Promise<StorageOperationResult<Category>>
  updateCategory(id: number, name: string): Promise<StorageOperationResult<Category>>
  deleteCategory(id: number): Promise<StorageOperationResult<Category>>

  // Dashboard and analytics
  getDashboardStats(): Promise<DashboardStats>
  getLowStockItems(threshold?: number): Promise<Item[]>
  getOutOfStockItems(): Promise<Item[]>
  getTopSellingItems(limit?: number, startDate?: Date, endDate?: Date): Promise<Array<{
    itemId: number
    itemName: string
    itemCode: string
    totalSold: number
    revenue: number
  }>>
  getSalesReport(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    salesByPaymentMethod: Array<{ method: string; count: number; revenue: number }>
    salesByCategory: Array<{ category: string; count: number; revenue: number }>
    dailySales: Array<{ date: string; sales: number; revenue: number }>
  }>

  // Inventory management
  updateStock(itemId: number, quantity: number, operation: 'set' | 'add' | 'subtract'): Promise<StorageOperationResult<Item>>
  bulkUpdateStock(updates: Array<{ itemId: number; quantity: number; operation: 'set' | 'add' | 'subtract' }>): Promise<StorageOperationResult<Item[]>>

  // Data validation and integrity
  validateItemData(data: CreateItemData | UpdateItemData): Promise<{ isValid: boolean; errors: string[] }>
  validateSaleData(data: CreateSaleData): Promise<{ isValid: boolean; errors: string[] }>
  checkDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }>

  // Backup and restore (optional implementations)
  exportData?(): Promise<{ items: Item[]; sales: Sale[]; categories: Category[] }>
  importData?(data: { items: Item[]; sales: Sale[]; categories: Category[] }): Promise<StorageOperationResult<void>>
}

// Storage factory interface
export interface StorageFactory {
  create(type: string, config?: any): StorageAdapter
  getAvailableTypes(): string[]
  validateConfig(type: string, config: any): { isValid: boolean; errors: string[] }
}

// Migration interface
export interface Migration {
  version: string
  name: string
  up: (adapter: StorageAdapter) => Promise<void>
  down: (adapter: StorageAdapter) => Promise<void>
  description?: string
}

// Migration runner interface
export interface MigrationRunner {
  addMigration(migration: Migration): void
  runMigrations(targetVersion?: string): Promise<void>
  rollbackMigration(version: string): Promise<void>
  getCurrentVersion(): Promise<string>
  getPendingMigrations(): Promise<Migration[]>
}

// Storage configuration interface
export interface StorageConfig {
  type: 'sqlite' | 'postgres' | 'mock'
  url?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  path?: string
  inMemory?: boolean
  poolSize?: number
  connectionTimeout?: number
  idleTimeout?: number
  enableCache?: boolean
  cacheTtl?: number
  readonly?: boolean
}

// Storage metrics interface
export interface StorageMetrics {
  connectionPool: {
    active: number
    idle: number
    total: number
    waiting: number
  }
  performance: {
    averageQueryTime: number
    slowQueries: number
    totalQueries: number
    errorRate: number
  }
  data: {
    totalItems: number
    totalSales: number
    totalCategories: number
    databaseSize: number
  }
  timestamp: Date
}

// Storage event types
export interface StorageEvent {
  type: 'created' | 'updated' | 'deleted' | 'error'
  entity: 'item' | 'sale' | 'category'
  entityId: number | string
  data?: any
  error?: string
  timestamp: Date
}

// Storage event listener interface
export interface StorageEventListener {
  onEvent(event: StorageEvent): void
}

// Storage transaction interface (for databases that support it)
export interface StorageTransaction {
  commit(): Promise<void>
  rollback(): Promise<void>
  getAdapter(): StorageAdapter
}