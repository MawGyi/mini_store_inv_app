import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { eq, desc, count, like, or, and, gte, lte, gt, sum } from 'drizzle-orm'
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

const pgSchema = schemaExports.postgres

export class PostgresAdapter implements StorageAdapter {
  private client: any
  private db: any
  private config: any
  private initialized = false

  constructor(config?: any) {
    this.config = config || {}
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.client = sql
      this.db = drizzle(this.client, { schema: pgSchema })
      
      // Create indexes
      await createIndexes(this.client, 'postgres')
      
      this.initialized = true
      console.log('✅ PostgreSQL storage initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL storage:', error)
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

      await this.client`SELECT 1`
      
      return {
        status: 'healthy',
        message: 'PostgreSQL storage is healthy',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `PostgreSQL health check failed: ${(error as Error).message}`,
        timestamp: new Date(),
        details: { error: (error as Error).message }
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      this.initialized = false
    }
  }

  // Items CRUD operations
  async getItems(params: GetItemsParams = {}): Promise<ItemResult> {
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)
    const offset = (page - 1) * limit
    const search = params.search || ''
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'

    let query = this.db.select().from(pgSchema.items)

    if (search) {
      query = query.where(
        or(
          like(pgSchema.items.name, `%${search}%`),
          like(pgSchema.items.itemCode, `%${search}%`)
        )
      )
    }

    if (params.category) {
      query = query.where(eq(pgSchema.items.category, params.category))
    }

    // Simple sorting by a few key fields
    if (sortBy === 'name') {
      query = query.order(sortOrder === 'asc' ? pgSchema.items.name : desc(pgSchema.items.name))
    } else if (sortBy === 'price') {
      query = query.order(sortOrder === 'asc' ? pgSchema.items.price : desc(pgSchema.items.price))
    } else if (sortBy === 'stockQuantity') {
      query = query.order(sortOrder === 'asc' ? pgSchema.items.stockQuantity : desc(pgSchema.items.stockQuantity))
    } else {
      query = query.order(desc(pgSchema.items.createdAt))
    }

    const items = await query.limit(limit).offset(offset)

    let countQuery = this.db.select({ count: count() }).from(pgSchema.items)
    
    if (search) {
      countQuery = countQuery.where(
        or(
          like(pgSchema.items.name, `%${search}%`),
          like(pgSchema.items.itemCode, `%${search}%`)
        )
      )
    }
    
    if (params.category) {
      countQuery = countQuery.where(eq(pgSchema.items.category, params.category))
    }

    const [totalResult] = await countQuery
    const total = totalResult?.count || 0

    return {
      data: items as Item[],
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
      .from(pgSchema.items)
      .where(eq(pgSchema.items.id, id))
      .limit(1)

    return item as Item || null
  }

  async getItemByCode(itemCode: string): Promise<Item | null> {
    const [item] = await this.db
      .select()
      .from(pgSchema.items)
      .where(eq(pgSchema.items.itemCode, itemCode))
      .limit(1)

    return item as Item || null
  }

  async createItem(data: CreateItemData): Promise<StorageOperationResult<Item>> {
    try {
      const [item] = await this.db
        .insert(pgSchema.items)
        .values({
          name: data.name,
          itemCode: data.itemCode,
          price: data.price,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
          category: data.category,
          expiryDate: data.expiryDate
        })
        .returning()

      return {
        success: true,
        data: item as Item
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
        .update(pgSchema.items)
        .set(data)
        .where(eq(pgSchema.items.id, id))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: item as Item
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
        .delete(pgSchema.items)
        .where(eq(pgSchema.items.id, id))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: item as Item
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
      .from(pgSchema.items)
      .where(
        or(
          like(pgSchema.items.name, `%${query}%`),
          like(pgSchema.items.itemCode, `%${query}%`),
          like(pgSchema.items.category, `%${query}%`)
        )
      )
      .limit(50)

    return items as Item[]
  }

  // Sales CRUD operations
  async getSales(params: GetSalesParams = {}): Promise<SaleResult> {
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)
    const offset = (page - 1) * limit

    let query = this.db.select().from(pgSchema.sales)

    if (params.startDate) {
      query = query.where(gte(pgSchema.sales.saleDate, params.startDate))
    }

    if (params.endDate) {
      query = query.where(lte(pgSchema.sales.saleDate, params.endDate))
    }

    if (params.paymentMethod) {
      query = query.where(eq(pgSchema.sales.paymentMethod, params.paymentMethod))
    }

    if (params.customerName) {
      query = query.where(like(pgSchema.sales.customerName, `%${params.customerName}%`))
    }

    const sales = await query
      .orderBy(desc(pgSchema.sales.saleDate))
      .limit(limit)
      .offset(offset)

    let countQuery = this.db.select({ count: count() }).from(pgSchema.sales)
    
    if (params.startDate) {
      countQuery = countQuery.where(gte(pgSchema.sales.saleDate, params.startDate))
    }
    
    if (params.endDate) {
      countQuery = countQuery.where(lte(pgSchema.sales.saleDate, params.endDate))
    }

    const [totalResult] = await countQuery
    const total = totalResult?.count || 0

    return {
      data: sales as Sale[],
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
      .from(pgSchema.sales)
      .where(eq(pgSchema.sales.id, id))
      .limit(1)

    return sale as Sale || null
  }

  async getSaleWithItems(id: number): Promise<SaleWithItems | null> {
    const sale = await this.getSaleById(id)
    if (!sale) return null

    const items = await this.db
      .select({
        id: pgSchema.saleItems.id,
        saleId: pgSchema.saleItems.saleId,
        itemId: pgSchema.saleItems.itemId,
        quantity: pgSchema.saleItems.quantity,
        unitPrice: pgSchema.saleItems.unitPrice,
        totalPrice: pgSchema.saleItems.totalPrice,
        itemName: pgSchema.items.name,
        itemCode: pgSchema.items.itemCode
      })
      .from(pgSchema.saleItems)
      .leftJoin(pgSchema.items, eq(pgSchema.saleItems.itemId, pgSchema.items.id))
      .where(eq(pgSchema.saleItems.saleId, id))

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
      const [sale] = await this.db
        .insert(pgSchema.sales)
        .values({
          saleDate: data.saleDate,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName || null,
          invoiceNumber: data.invoiceNumber
        })
        .returning()

      // Insert sale items if provided
      if (data.items && data.items.length > 0) {
        await this.db.insert(pgSchema.saleItems).values(
          data.items.map(item => ({
            saleId: sale.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        )
      }

      return {
        success: true,
        data: sale as Sale
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
        .update(pgSchema.sales)
        .set(data)
        .where(eq(pgSchema.sales.id, id))
        .returning()

      if (!sale) {
        return {
          success: false,
          error: 'Sale not found'
        }
      }

      return {
        success: true,
        data: sale as Sale
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
        .delete(pgSchema.sales)
        .where(eq(pgSchema.sales.id, id))
        .returning()

      if (!sale) {
        return {
          success: false,
          error: 'Sale not found'
        }
      }

      return {
        success: true,
        data: sale as Sale
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
    const categories = await this.db.select().from(pgSchema.categories)
    return categories as Category[]
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(pgSchema.categories)
      .where(eq(pgSchema.categories.id, id))
      .limit(1)

    return category as Category || null
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const [category] = await this.db
      .select()
      .from(pgSchema.categories)
      .where(eq(pgSchema.categories.name, name))
      .limit(1)

    return category as Category || null
  }

  async createCategory(name: string): Promise<StorageOperationResult<Category>> {
    try {
      const [category] = await this.db
        .insert(pgSchema.categories)
        .values({ name })
        .returning()

      return {
        success: true,
        data: category as Category
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
        .update(pgSchema.categories)
        .set({ name })
        .where(eq(pgSchema.categories.id, id))
        .returning()

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      return {
        success: true,
        data: category as Category
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
        .delete(pgSchema.categories)
        .where(eq(pgSchema.categories.id, id))
        .returning()

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      return {
        success: true,
        data: category as Category
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete category: ${(error as Error).message}`
      }
    }
  }

  // Dashboard and analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalItemsResult] = await this.db.select({ count: count() }).from(pgSchema.items)
    const [totalSalesResult] = await this.db.select({ count: count() }).from(pgSchema.sales)
    
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
      .from(pgSchema.items)
      .where(
        and(
          lte(pgSchema.items.stockQuantity, pgSchema.items.lowStockThreshold),
          gt(pgSchema.items.stockQuantity, 0)
        )
      )
      .limit(20)

    return items as Item[]
  }

  async getOutOfStockItems(): Promise<Item[]> {
    const items = await this.db
      .select()
      .from(pgSchema.items)
      .where(eq(pgSchema.items.stockQuantity, 0))
      .limit(20)

    return items as Item[]
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
        itemId: pgSchema.saleItems.itemId,
        totalSold: count(pgSchema.saleItems.quantity),
        revenue: sum(pgSchema.saleItems.totalPrice),
        itemName: pgSchema.items.name,
        itemCode: pgSchema.items.itemCode
      })
      .from(pgSchema.saleItems)
      .leftJoin(pgSchema.items, eq(pgSchema.saleItems.itemId, pgSchema.items.id))
      .groupBy(pgSchema.saleItems.itemId)
      .orderBy(desc(count(pgSchema.saleItems.quantity)))
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
      const [item] = await this.db
        .update(pgSchema.items)
        .set({ stockQuantity: quantity })
        .where(eq(pgSchema.items.id, itemId))
        .returning()

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      return {
        success: true,
        data: item as Item
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

    try {
      await this.client`SELECT 1`
    } catch (error) {
      issues.push(`Database connection failed: ${(error as Error).message}`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}