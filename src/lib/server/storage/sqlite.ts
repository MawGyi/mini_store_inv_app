import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, desc, count, like, or, and, gte, lte, gt } from 'drizzle-orm'
import type { StorageAdapter } from './interfaces'
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
import { schemas as schemaExports, createIndexes } from './schema'

const sqliteSchema = schemaExports.sqlite

export class SqliteAdapter implements StorageAdapter {
  private client: any
  private db: any
  private config: any
  private initialized = false

  constructor(config?: any) {
    this.config = config || { url: 'file:sqlite.db' }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.client = createClient({ url: this.config.url })
      this.db = drizzle(this.client, { schema: sqliteSchema })
      
      // Create tables and indexes
      await this.createTables()
      await createIndexes(this.client, 'sqlite')
      
      this.initialized = true
      console.log('✅ SQLite storage initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize SQLite storage:', error)
      throw error
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      if (!this.initialized) {
        return {
          status: 'unhealthy',
          message: 'Storage not initialized',
          timestamp: new Date()
        }
      }

      await this.client.execute('SELECT 1')
      
      return {
        status: 'healthy',
        message: 'SQLite storage is healthy',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `SQLite health check failed: ${(error as Error).message}`,
        timestamp: new Date(),
        details: { error: (error as Error).message }
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.initialized = false
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        item_code TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        low_stock_threshold INTEGER NOT NULL,
        category TEXT,
        expiry_date TEXT,
        created_at TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_date TEXT NOT NULL DEFAULT '',
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        customer_name TEXT,
        invoice_number TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL
      )`
    ]

    for (const sql of tables) {
      await this.client.execute(sql)
    }
  }

  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null
    return new Date(dateValue)
  }

  private formatDate(date: Date): string {
    return date.toISOString()
  }

  // Items CRUD operations
  async getItems(params: GetItemsParams = {}): Promise<ItemResult> {
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)
    const offset = (page - 1) * limit
    const search = params.search || ''
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'

    let query = this.db.select().from(sqliteSchema.items)

    if (search) {
      query = query.where(
        or(
          like(sqliteSchema.items.name, `%${search}%`),
          like(sqliteSchema.items.itemCode, `%${search}%`)
        )
      )
    }

    if (params.category) {
      query = query.where(eq(sqliteSchema.items.category, params.category))
    }

    // Use specific column mapping for ordering
    let orderColumn
    switch (sortBy) {
      case 'name':
        orderColumn = sqliteSchema.items.name
        break
      case 'price':
        orderColumn = sqliteSchema.items.price
        break
      case 'stockQuantity':
        orderColumn = sqliteSchema.items.stockQuantity
        break
      case 'createdAt':
      default:
        orderColumn = sqliteSchema.items.createdAt
        break
    }
    
    query = query.order(sortOrder === 'asc' ? orderColumn : desc(orderColumn))

    const items = await query.limit(limit).offset(offset)
    const parsedItems = items.map((item: any) => ({
      ...item,
      createdAt: this.parseDate(item.createdAt),
      updatedAt: this.parseDate(item.updatedAt),
      expiryDate: this.parseDate(item.expiryDate)
    }))

    let countQuery = this.db.select({ count: count() }).from(sqliteSchema.items)
    
    if (search) {
      countQuery = countQuery.where(
        or(
          like(sqliteSchema.items.name, `%${search}%`),
          like(sqliteSchema.items.itemCode, `%${search}%`)
        )
      )
    }
    
    if (params.category) {
      countQuery = countQuery.where(eq(sqliteSchema.items.category, params.category))
    }

    const [totalResult] = await countQuery
    const total = totalResult?.count || 0

    return {
      data: parsedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getItemById(id: number): Promise<Item | null> {
    const [item] = await this.db
      .select()
      .from(sqliteSchema.items)
      .where(eq(sqliteSchema.items.id, id))
      .limit(1)

    if (!item) return null

    return {
      ...item,
      createdAt: this.parseDate((item as any).createdAt),
      updatedAt: this.parseDate((item as any).updatedAt),
      expiryDate: this.parseDate((item as any).expiryDate)
    }
  }

  async getItemByCode(itemCode: string): Promise<Item | null> {
    const [item] = await this.db
      .select()
      .from(sqliteSchema.items)
      .where(eq(sqliteSchema.items.itemCode, itemCode))
      .limit(1)

    if (!item) return null

    return {
      ...item,
      createdAt: this.parseDate((item as any).createdAt),
      updatedAt: this.parseDate((item as any).updatedAt),
      expiryDate: this.parseDate((item as any).expiryDate)
    }
  }

  async createItem(data: CreateItemData): Promise<StorageOperationResult<Item>> {
    try {
      const now = new Date()
      const [item] = await this.db
        .insert(sqliteSchema.items)
        .values({
          name: data.name,
          itemCode: data.itemCode,
          price: data.price,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
          category: data.category || null,
          expiryDate: data.expiryDate ? this.formatDate(data.expiryDate) : null,
          createdAt: this.formatDate(now),
          updatedAt: this.formatDate(now)
        })
        .returning()

      return {
        success: true,
        data: {
          ...item,
          createdAt: this.parseDate((item as any).createdAt),
          updatedAt: this.parseDate((item as any).updatedAt),
          expiryDate: this.parseDate((item as any).expiryDate)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create item: ${(error as Error).message}`
      }
    }
  }

  async updateItem(id: number, data: UpdateItemData): Promise<StorageOperationResult<Item>> {
    try {
      const [item] = await this.db
        .update(sqliteSchema.items)
        .set({
          ...data,
          updatedAt: this.formatDate(new Date())
        })
        .where(eq(sqliteSchema.items.id, id))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: {
          ...item,
          createdAt: this.parseDate((item as any).createdAt),
          updatedAt: this.parseDate((item as any).updatedAt),
          expiryDate: this.parseDate((item as any).expiryDate)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update item: ${(error as Error).message}`
      }
    }
  }

  async deleteItem(id: number): Promise<StorageOperationResult<Item>> {
    try {
      const [item] = await this.db
        .delete(sqliteSchema.items)
        .where(eq(sqliteSchema.items.id, id))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: {
          ...item,
          createdAt: this.parseDate((item as any).createdAt),
          updatedAt: this.parseDate((item as any).updatedAt),
          expiryDate: this.parseDate((item as any).expiryDate)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete item: ${(error as Error).message}`
      }
    }
  }

  async searchItems(query: string): Promise<Item[]> {
    const items = await this.db
      .select()
      .from(sqliteSchema.items)
      .where(
        or(
          like(sqliteSchema.items.name, `%${query}%`),
          like(sqliteSchema.items.itemCode, `%${query}%`),
          like(sqliteSchema.items.category, `%${query}%`)
        )
      )
      .limit(50)

    return items.map((item: any) => ({
      ...item,
      createdAt: this.parseDate(item.createdAt),
      updatedAt: this.parseDate(item.updatedAt),
      expiryDate: this.parseDate(item.expiryDate)
    }))
  }

  // Sales CRUD operations
  async getSales(params: GetSalesParams = {}): Promise<SaleResult> {
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)
    const offset = (page - 1) * limit

    let query = this.db.select().from(sqliteSchema.sales)

    if (params.startDate) {
      query = query.where(gte(sqliteSchema.sales.saleDate, this.formatDate(params.startDate)))
    }

    if (params.endDate) {
      query = query.where(lte(sqliteSchema.sales.saleDate, this.formatDate(params.endDate)))
    }

    if (params.paymentMethod) {
      query = query.where(eq(sqliteSchema.sales.paymentMethod, params.paymentMethod))
    }

    if (params.customerName) {
      query = query.where(like(sqliteSchema.sales.customerName, `%${params.customerName}%`))
    }

    const sales = await query
      .orderBy(desc(sqliteSchema.sales.saleDate))
      .limit(limit)
      .offset(offset)

    const parsedSales = sales.map((sale: any) => ({
      ...sale,
      saleDate: this.parseDate(sale.saleDate),
      createdAt: this.parseDate(sale.createdAt),
      updatedAt: this.parseDate(sale.updatedAt)
    }))

    let countQuery = this.db.select({ count: count() }).from(sqliteSchema.sales)
    
    if (params.startDate) {
      countQuery = countQuery.where(gte(sqliteSchema.sales.saleDate, this.formatDate(params.startDate)))
    }
    
    if (params.endDate) {
      countQuery = countQuery.where(lte(sqliteSchema.sales.saleDate, this.formatDate(params.endDate)))
    }

    const [totalResult] = await countQuery
    const total = totalResult?.count || 0

    return {
      data: parsedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getSaleById(id: number): Promise<Sale | null> {
    const [sale] = await this.db
      .select()
      .from(sqliteSchema.sales)
      .where(eq(sqliteSchema.sales.id, id))
      .limit(1)

    if (!sale) return null

    return {
      ...sale,
      saleDate: this.parseDate((sale as any).saleDate),
      createdAt: this.parseDate((sale as any).createdAt),
      updatedAt: this.parseDate((sale as any).updatedAt)
    }
  }

  async getSaleWithItems(id: number): Promise<SaleWithItems | null> {
    const sale = await this.getSaleById(id)
    if (!sale) return null

    const items = await this.db
      .select({
        id: sqliteSchema.saleItems.id,
        saleId: sqliteSchema.saleItems.saleId,
        itemId: sqliteSchema.saleItems.itemId,
        quantity: sqliteSchema.saleItems.quantity,
        unitPrice: sqliteSchema.saleItems.unitPrice,
        totalPrice: sqliteSchema.saleItems.totalPrice,
        itemName: sqliteSchema.items.name,
        itemCode: sqliteSchema.items.itemCode
      })
      .from(sqliteSchema.saleItems)
      .leftJoin(sqliteSchema.items, eq(sqliteSchema.saleItems.itemId, sqliteSchema.items.id))
      .where(eq(sqliteSchema.saleItems.saleId, id))

    return {
      ...sale,
      items: items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }
  }

  async createSale(data: CreateSaleData): Promise<StorageOperationResult<Sale>> {
    try {
      const now = new Date()
      const [sale] = await this.db
        .insert(sqliteSchema.sales)
        .values({
          ...data,
          createdAt: this.formatDate(now),
          updatedAt: this.formatDate(now)
        })
        .returning()

      // Insert sale items if provided
      if (data.items && data.items.length > 0) {
        await this.db.insert(sqliteSchema.saleItems).values(
          data.items.map(item => ({
            ...item,
            saleId: sale.id
          }))
        )
      }

      return {
        success: true,
        data: {
          ...sale,
          saleDate: this.parseDate((sale as any).saleDate),
          createdAt: this.parseDate((sale as any).createdAt),
          updatedAt: this.parseDate((sale as any).updatedAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create sale: ${(error as Error).message}`
      }
    }
  }

  async updateSale(id: number, data: Partial<CreateSaleData>): Promise<StorageOperationResult<Sale>> {
    try {
      const [sale] = await this.db
        .update(sqliteSchema.sales)
        .set({
          ...data,
          updatedAt: this.formatDate(new Date())
        })
        .where(eq(sqliteSchema.sales.id, id))
        .returning()

      if (!sale) {
        return {
          success: false,
          error: 'Sale not found'
        }
      }

      return {
        success: true,
        data: {
          ...sale,
          saleDate: this.parseDate((sale as any).saleDate),
          createdAt: this.parseDate((sale as any).createdAt),
          updatedAt: this.parseDate((sale as any).updatedAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update sale: ${(error as Error).message}`
      }
    }
  }

  async deleteSale(id: number): Promise<StorageOperationResult<Sale>> {
    try {
      const [sale] = await this.db
        .delete(sqliteSchema.sales)
        .where(eq(sqliteSchema.sales.id, id))
        .returning()

      if (!sale) {
        return {
          success: false,
          error: 'Sale not found'
        }
      }

      return {
        success: true,
        data: {
          ...sale,
          saleDate: this.parseDate((sale as any).saleDate),
          createdAt: this.parseDate((sale as any).createdAt),
          updatedAt: this.parseDate((sale as any).updatedAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete sale: ${(error as Error).message}`
      }
    }
  }

  // Categories operations
  async getCategories(): Promise<Category[]> {
    const categories = await this.db.select().from(sqliteSchema.categories)
    
    return categories.map((category: any) => ({
      ...category,
      createdAt: this.parseDate(category.createdAt)
    }))
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(sqliteSchema.categories)
      .where(eq(sqliteSchema.categories.id, id))
      .limit(1)

    if (!category) return null

    return {
      ...category,
      createdAt: this.parseDate((category as any).createdAt)
    }
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(sqliteSchema.categories)
      .where(eq(sqliteSchema.categories.name, name))
      .limit(1)

    if (!category) return null

    return {
      ...category,
      createdAt: this.parseDate((category as any).createdAt)
    }
  }

  async createCategory(name: string): Promise<StorageOperationResult<Category>> {
    try {
      const now = new Date()
      const [category] = await this.db
        .insert(sqliteSchema.categories)
        .values({
          name,
          createdAt: this.formatDate(now)
        })
        .returning()

      return {
        success: true,
        data: {
          ...category,
          createdAt: this.parseDate((category as any).createdAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create category: ${(error as Error).message}`
      }
    }
  }

  async updateCategory(id: number, name: string): Promise<StorageOperationResult<Category>> {
    try {
      const [category] = await this.db
        .update(sqliteSchema.categories)
        .set({ name })
        .where(eq(sqliteSchema.categories.id, id))
        .returning()

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      return {
        success: true,
        data: {
          ...category,
          createdAt: this.parseDate((category as any).createdAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update category: ${(error as Error).message}`
      }
    }
  }

  async deleteCategory(id: number): Promise<StorageOperationResult<Category>> {
    try {
      const [category] = await this.db
        .delete(sqliteSchema.categories)
        .where(eq(sqliteSchema.categories.id, id))
        .returning()

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      return {
        success: true,
        data: {
          ...category,
          createdAt: this.parseDate((category as any).createdAt)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete category: ${(error as Error).message}`
      }
    }
  }

  // Dashboard and analytics - simplified implementation
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalItemsResult] = await this.db.select({ count: count() }).from(sqliteSchema.items)
    const [totalSalesResult] = await this.db.select({ count: count() }).from(sqliteSchema.sales)
    
    const totalItems = totalItemsResult?.count || 0
    const totalSales = totalSalesResult?.count || 0

    return {
      totalItems,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalSales,
      todaySales: 0,
      weeklySales: 0,
      monthlySales: 0,
      topSellingItems: [],
      recentSales: await this.getSales({ limit: 5 }).then(r => r.data),
      salesByCategory: []
    }
  }

  async getLowStockItems(threshold?: number): Promise<Item[]> {
    const items = await this.db
      .select()
      .from(sqliteSchema.items)
      .where(
        and(
          lte(sqliteSchema.items.stockQuantity, sqliteSchema.items.lowStockThreshold),
          gt(sqliteSchema.items.stockQuantity, 0)
        )
      )
      .limit(20)

    return items.map((item: any) => ({
      ...item,
      createdAt: this.parseDate(item.createdAt),
      updatedAt: this.parseDate(item.updatedAt),
      expiryDate: this.parseDate(item.expiryDate)
    }))
  }

  async getOutOfStockItems(): Promise<Item[]> {
    const items = await this.db
      .select()
      .from(sqliteSchema.items)
      .where(eq(sqliteSchema.items.stockQuantity, 0))
      .limit(20)

    return items.map((item: any) => ({
      ...item,
      createdAt: this.parseDate(item.createdAt),
      updatedAt: this.parseDate(item.updatedAt),
      expiryDate: this.parseDate(item.expiryDate)
    }))
  }

  async getTopSellingItems(limit = 10, startDate?: Date, endDate?: Date): Promise<Array<{
    itemId: number
    itemName: string
    itemCode: string
    totalSold: number
    revenue: number
  }>> {
    const items = await this.db
      .select({
        itemId: sqliteSchema.saleItems.itemId,
        totalSold: count(sqliteSchema.saleItems.quantity),
        revenue: count(sqliteSchema.saleItems.totalPrice),
        itemName: sqliteSchema.items.name,
        itemCode: sqliteSchema.items.itemCode
      })
      .from(sqliteSchema.saleItems)
      .leftJoin(sqliteSchema.items, eq(sqliteSchema.saleItems.itemId, sqliteSchema.items.id))
      .groupBy(sqliteSchema.saleItems.itemId)
      .orderBy(desc(count(sqliteSchema.saleItems.quantity)))
      .limit(limit)

    return items.map((item: any) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemCode: item.itemCode,
      totalSold: Number(item.totalSold),
      revenue: Number(item.revenue)
    }))
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    salesByPaymentMethod: Array<{ method: string; count: number; revenue: number }>
    salesByCategory: Array<{ category: string; count: number; revenue: number }>
    dailySales: Array<{ date: string; sales: number; revenue: number }>
  }> {
    return {
      totalSales: 0,
      totalRevenue: 0,
      salesByPaymentMethod: [],
      salesByCategory: [],
      dailySales: []
    }
  }

  // Inventory management
  async updateStock(itemId: number, quantity: number, operation: 'set' | 'add' | 'subtract'): Promise<StorageOperationResult<Item>> {
    try {
      let updateData: any = { updatedAt: this.formatDate(new Date()) }

      switch (operation) {
        case 'set':
          updateData.stockQuantity = quantity
          break
        case 'add':
          updateData.stockQuantity = quantity
          break
        case 'subtract':
          updateData.stockQuantity = quantity
          break
      }

      const [item] = await this.db
        .update(sqliteSchema.items)
        .set(updateData)
        .where(eq(sqliteSchema.items.id, itemId))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: {
          ...item,
          createdAt: this.parseDate((item as any).createdAt),
          updatedAt: this.parseDate((item as any).updatedAt),
          expiryDate: this.parseDate((item as any).expiryDate)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update stock: ${(error as Error).message}`
      }
    }
  }

  async bulkUpdateStock(updates: Array<{ itemId: number; quantity: number; operation: 'set' | 'add' | 'subtract' }>): Promise<StorageOperationResult<Item[]>> {
    const results: Item[] = []
    const errors: string[] = []

    for (const update of updates) {
      const result = await this.updateStock(update.itemId, update.quantity, update.operation)
      if (result.success && result.data) {
        results.push(result.data)
      } else {
        errors.push(`Item ${update.itemId}: ${result.error}`)
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined
    }
  }

  // Data validation and integrity
  async validateItemData(data: CreateItemData | UpdateItemData): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required')
    }

    if (!data.itemCode || data.itemCode.trim() === '') {
      errors.push('Item code is required')
    }

    if (data.price !== undefined) {
      const price = Number(data.price)
      if (isNaN(price) || price < 0) {
        errors.push('Price must be a non-negative number')
      }
    }

    if (data.stockQuantity !== undefined) {
      const quantity = Number(data.stockQuantity)
      if (isNaN(quantity) || quantity < 0) {
        errors.push('Stock quantity must be a non-negative integer')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async validateSaleData(data: CreateSaleData): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0')
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async checkDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = []

    // Basic integrity check - simplified for now
    try {
      await this.client.execute('SELECT 1')
    } catch (error) {
      issues.push(`Database connection failed: ${(error as Error).message}`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}