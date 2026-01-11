// Simple UUID generator for mock adapter
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}
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

export class MockAdapter implements StorageAdapter {
  private items: Item[] = []
  private sales: Sale[] = []
  private saleItems: SaleItem[] = []
  private categories: Category[] = []
  private initialized = false

  constructor() {
    this.initializeDemoData()
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.initializeDemoData()
    this.initialized = true
    console.log('✅ Mock storage initialized successfully')
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      status: 'healthy',
      message: 'Mock storage is always healthy',
      timestamp: new Date()
    }
  }

  async cleanup(): Promise<void> {
    this.items = []
    this.sales = []
    this.saleItems = []
    this.categories = []
    this.initialized = false
  }

  private initializeDemoData(): void {
    // Create categories
    const categoryNames = ['Beverages', 'Snacks', 'Groceries', 'Dairy', 'Household', 'Personal Care', 'Electronics', 'Bakery']
    this.categories = categoryNames.map((name, index) => ({
      id: index + 1,
      name,
      createdAt: new Date()
    }))

    // Create items
    const itemData = [
      { name: 'Mineral Water 500ml', itemCode: 'BEV-001', price: 0.50, stockQuantity: 100, lowStockThreshold: 20, category: 'Beverages' },
      { name: 'Cola Soda 330ml', itemCode: 'BEV-002', price: 1.00, stockQuantity: 80, lowStockThreshold: 15, category: 'Beverages' },
      { name: 'Orange Juice 1L', itemCode: 'BEV-003', price: 2.50, stockQuantity: 40, lowStockThreshold: 10, category: 'Beverages' },
      { name: 'Energy Drink 250ml', itemCode: 'BEV-004', price: 2.00, stockQuantity: 0, lowStockThreshold: 10, category: 'Beverages' },
      { name: 'Potato Chips', itemCode: 'SNK-001', price: 1.20, stockQuantity: 60, lowStockThreshold: 15, category: 'Snacks' },
      { name: 'Chocolate Bar', itemCode: 'SNK-002', price: 0.80, stockQuantity: 100, lowStockThreshold: 25, category: 'Snacks' },
      { name: 'Cookies Pack', itemCode: 'SNK-003', price: 2.00, stockQuantity: 45, lowStockThreshold: 10, category: 'Snacks' },
      { name: 'Rice 5kg', itemCode: 'GRC-001', price: 8.00, stockQuantity: 30, lowStockThreshold: 5, category: 'Groceries' },
      { name: 'Milk 1L', itemCode: 'DRY-001', price: 2.00, stockQuantity: 25, lowStockThreshold: 10, category: 'Dairy' },
      { name: 'Toilet Paper', itemCode: 'HHS-001', price: 3.00, stockQuantity: 40, lowStockThreshold: 10, category: 'Household' },
      { name: 'Shampoo 200ml', itemCode: 'PRC-001', price: 4.00, stockQuantity: 30, lowStockThreshold: 8, category: 'Personal Care' },
      { name: 'USB Cable 1m', itemCode: 'ELE-001', price: 5.00, stockQuantity: 25, lowStockThreshold: 5, category: 'Electronics' },
      { name: 'Fresh Bread Loaf', itemCode: 'BAK-001', price: 2.50, stockQuantity: 20, lowStockThreshold: 5, category: 'Bakery' }
    ]

    this.items = itemData.map((item, index) => ({
      id: index + 1,
      ...item,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Create sample sales
    const saleData = [
      {
        saleDate: new Date('2025-01-10T10:00:00'),
        totalAmount: 15.50,
        paymentMethod: 'cash' as const,
        customerName: 'John Doe',
        invoiceNumber: 'INV-001',
        items: [{ itemId: 1, quantity: 5, unitPrice: 0.50, totalPrice: 2.50 }]
      },
      {
        saleDate: new Date('2025-01-11T14:30:00'),
        totalAmount: 23.00,
        paymentMethod: 'mobile_payment' as const,
        customerName: 'Jane Smith',
        invoiceNumber: 'INV-002',
        items: [{ itemId: 2, quantity: 3, unitPrice: 1.00, totalPrice: 3.00 }]
      }
    ]

    this.sales = saleData.map((sale, index) => ({
      id: index + 1,
      ...sale,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Create sale items
    this.saleItems = this.sales.flatMap((sale, saleIndex) => 
      (sale.items || []).map((item, itemIndex) => ({
        id: (saleIndex * 10) + itemIndex + 1,
        saleId: saleIndex + 1,
        itemId: item.itemId,
        itemName: this.items.find(i => i.id === item.itemId)?.name || 'Unknown',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    )
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `INV-${timestamp}-${random}`
  }

  // Items CRUD operations
  async getItems(params: GetItemsParams = {}): Promise<ItemResult> {
    let filteredItems = [...this.items]
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)
    const search = params.search || ''
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'

    // Apply search filter
    if (search) {
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply category filter
    if (params.category) {
      filteredItems = filteredItems.filter(item => item.category === params.category)
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'stockQuantity':
          comparison = a.stockQuantity - b.stockQuantity
          break
        case 'createdAt':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedItems = filteredItems.slice(offset, offset + limit)

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit)
      }
    }
  }

  async getItemById(id: number): Promise<Item | null> {
    return this.items.find(item => item.id === id) || null
  }

  async getItemByCode(itemCode: string): Promise<Item | null> {
    return this.items.find(item => item.itemCode === itemCode) || null
  }

  async createItem(data: CreateItemData): Promise<StorageOperationResult<Item>> {
    // Check for duplicate item code
    const existingItem = this.items.find(item => item.itemCode === data.itemCode)
    if (existingItem) {
      return {
        success: false,
        error: 'Item code already exists'
      }
    }

    const newItem: Item = {
      id: Math.max(...this.items.map(i => i.id), 0) + 1,
      ...data,
      category: data.category || null,
      expiryDate: data.expiryDate || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.items.push(newItem)

    return {
      success: true,
      data: newItem
    }
  }

  async updateItem(id: number, data: UpdateItemData): Promise<StorageOperationResult<Item>> {
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Item not found'
      }
    }

    // Check for duplicate item code if it's being updated
    if (data.itemCode) {
      const existingItem = this.items.find(item => 
        item.id !== id && item.itemCode === data.itemCode
      )
      if (existingItem) {
        return {
          success: false,
          error: 'Item code already exists'
        }
      }
    }

    const updatedItem = {
      ...this.items[index],
      ...data,
      updatedAt: new Date()
    }

    this.items[index] = updatedItem

    return {
      success: true,
      data: updatedItem
    }
  }

  async deleteItem(id: number): Promise<StorageOperationResult<Item>> {
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Item not found'
      }
    }

    const deletedItem = this.items[index]
    this.items.splice(index, 1)

    return {
      success: true,
      data: deletedItem
    }
  }

  async searchItems(query: string): Promise<Item[]> {
    const searchLower = query.toLowerCase()
    return this.items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.itemCode.toLowerCase().includes(searchLower) ||
      (item.category && item.category.toLowerCase().includes(searchLower))
    ).slice(0, 50)
  }

  // Sales CRUD operations
  async getSales(params: GetSalesParams = {}): Promise<SaleResult> {
    let filteredSales = [...this.sales]
    const page = params.page || 1
    const limit = Math.min(params.limit || 100, 100)

    // Apply date filters
    if (params.startDate) {
      filteredSales = filteredSales.filter(sale => sale.saleDate >= params.startDate!)
    }

    if (params.endDate) {
      filteredSales = filteredSales.filter(sale => sale.saleDate <= params.endDate!)
    }

    if (params.paymentMethod) {
      filteredSales = filteredSales.filter(sale => sale.paymentMethod === params.paymentMethod)
    }

    if (params.customerName) {
      const searchLower = params.customerName.toLowerCase()
      filteredSales = filteredSales.filter(sale => 
        sale.customerName && sale.customerName.toLowerCase().includes(searchLower)
      )
    }

    // Sort by date (newest first)
    filteredSales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedSales = filteredSales.slice(offset, offset + limit)

    return {
      data: paginatedSales,
      pagination: {
        page,
        limit,
        total: filteredSales.length,
        totalPages: Math.ceil(filteredSales.length / limit)
      }
    }
  }

  async getSaleById(id: number): Promise<Sale | null> {
    return this.sales.find(sale => sale.id === id) || null
  }

  async getSaleWithItems(id: number): Promise<SaleWithItems | null> {
    const sale = await this.getSaleById(id)
    if (!sale) return null

    const items = this.saleItems.filter(item => item.saleId === id).map(item => {
      const itemDetails = this.items.find(i => i.id === item.itemId)
      return {
        ...item,
        itemName: itemDetails?.name || 'Unknown',
        itemCode: itemDetails?.itemCode || 'Unknown'
      }
    })

    return {
      ...sale,
      items
    }
  }

  async createSale(data: CreateSaleData): Promise<StorageOperationResult<Sale>> {
    const newSale: Sale = {
      id: Math.max(...this.sales.map(s => s.id), 0) + 1,
      saleDate: data.saleDate || new Date(),
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      customerName: data.customerName || null,
      invoiceNumber: data.invoiceNumber || this.generateInvoiceNumber(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.sales.push(newSale)

    // Add sale items
    const newSaleItems = (data.items || []).map((item, itemIndex) => ({
      id: (this.sales.length - 1) * 10 + itemIndex + 1,
      saleId: newSale.id,
      itemId: item.itemId,
      itemName: this.items.find(i => i.id === item.itemId)?.name || 'Unknown',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }))
    this.saleItems.push(...newSaleItems)

    return {
      success: true,
      data: newSale
    }
  }

  async updateSale(id: number, data: Partial<CreateSaleData>): Promise<StorageOperationResult<Sale>> {
    const index = this.sales.findIndex(sale => sale.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Sale not found'
      }
    }

    const updatedSale = {
      ...this.sales[index],
      ...data,
      updatedAt: new Date()
    }

    this.sales[index] = updatedSale

    return {
      success: true,
      data: updatedSale
    }
  }

  async deleteSale(id: number): Promise<StorageOperationResult<Sale>> {
    const index = this.sales.findIndex(sale => sale.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Sale not found'
      }
    }

    const deletedSale = this.sales[index]
    this.sales.splice(index, 1)
    
    // Remove associated sale items
    this.saleItems = this.saleItems.filter(item => item.saleId !== id)

    return {
      success: true,
      data: deletedSale
    }
  }

  // Categories operations
  async getCategories(): Promise<Category[]> {
    return [...this.categories]
  }

  async getCategoryById(id: number): Promise<Category | null> {
    return this.categories.find(category => category.id === id) || null
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    return this.categories.find(category => category.name === name) || null
  }

  async createCategory(name: string): Promise<StorageOperationResult<Category>> {
    const existingCategory = this.categories.find(cat => cat.name === name)
    if (existingCategory) {
      return {
        success: false,
        error: 'Category name already exists'
      }
    }

    const newCategory: Category = {
      id: Math.max(...this.categories.map(c => c.id), 0) + 1,
      name,
      createdAt: new Date()
    }

    this.categories.push(newCategory)

    return {
      success: true,
      data: newCategory
    }
  }

  async updateCategory(id: number, name: string): Promise<StorageOperationResult<Category>> {
    const index = this.categories.findIndex(category => category.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Category not found'
      }
    }

    const existingCategory = this.categories.find(cat => cat.id !== id && cat.name === name)
    if (existingCategory) {
      return {
        success: false,
        error: 'Category name already exists'
      }
    }

    const updatedCategory = { ...this.categories[index], name }
    this.categories[index] = updatedCategory

    return {
      success: true,
      data: updatedCategory
    }
  }

  async deleteCategory(id: number): Promise<StorageOperationResult<Category>> {
    const index = this.categories.findIndex(category => category.id === id)
    if (index === -1) {
      return {
        success: false,
        error: 'Category not found'
      }
    }

    const deletedCategory = this.categories[index]
    this.categories.splice(index, 1)

    return {
      success: true,
      data: deletedCategory
    }
  }

  // Dashboard and analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalItems = this.items.length
    const lowStockItems = this.items.filter(item => 
      item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold
    ).length
    const outOfStockItems = this.items.filter(item => item.stockQuantity === 0).length
    const totalSales = this.sales.length
    const todaySales = this.sales.filter(sale => sale.saleDate >= today).length
    const weeklySales = this.sales.filter(sale => sale.saleDate >= weekAgo).length
    const monthlySales = this.sales.filter(sale => sale.saleDate >= monthAgo).length

    const recentSales = this.sales
      .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())
      .slice(0, 5)

    // Calculate top selling items
    const itemCounts: Record<number, { quantity: number; revenue: number }> = {}
    this.saleItems.forEach(item => {
      if (!itemCounts[item.itemId]) {
        itemCounts[item.itemId] = { quantity: 0, revenue: 0 }
      }
      itemCounts[item.itemId].quantity += item.quantity
      itemCounts[item.itemId].revenue += item.totalPrice
    })

    const topSellingItems = Object.entries(itemCounts)
      .map(([itemId, data]) => {
        const itemDetails = this.items.find(i => i.id === parseInt(itemId))
        return {
          itemId: parseInt(itemId),
          itemName: itemDetails?.name || 'Unknown',
          itemCode: itemDetails?.itemCode || 'Unknown',
          totalSold: data.quantity,
          revenue: data.revenue
        }
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)

    // Sales by category
    const categoryCounts: Record<string, { count: number; revenue: number }> = {}
    this.sales.forEach(sale => {
      const saleItemsForSale = this.saleItems.filter(si => si.saleId === sale.id)
      saleItemsForSale.forEach(si => {
        const item = this.items.find(i => i.id === si.itemId)
        if (item?.category) {
          if (!categoryCounts[item.category]) {
            categoryCounts[item.category] = { count: 0, revenue: 0 }
          }
          categoryCounts[item.category].count += 1
          categoryCounts[item.category].revenue += si.totalPrice
        }
      })
    })

    const salesByCategory = Object.entries(categoryCounts)
      .map(([category, data]) => ({
        categoryName: category,
        totalSales: data.count,
        revenue: data.revenue
      }))

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalSales,
      todaySales,
      weeklySales,
      monthlySales,
      topSellingItems,
      recentSales,
      salesByCategory
    }
  }

  async getLowStockItems(threshold?: number): Promise<Item[]> {
    return this.items.filter(item => 
      item.stockQuantity > 0 && 
      item.stockQuantity <= item.lowStockThreshold
    )
  }

  async getOutOfStockItems(): Promise<Item[]> {
    return this.items.filter(item => item.stockQuantity === 0)
  }

  async getTopSellingItems(limit = 10, startDate?: Date, endDate?: Date): Promise<Array<{
    itemId: number
    itemName: string
    itemCode: string
    totalSold: number
    revenue: number
  }>> {
    const itemCounts: Record<number, { quantity: number; revenue: number }> = {}
    
    // Filter by date range if provided
    let filteredSaleItems = this.saleItems
    if (startDate || endDate) {
      const filteredSales = this.sales.filter(sale => {
        if (startDate && sale.saleDate < startDate!) return false
        if (endDate && sale.saleDate > endDate!) return false
        return true
      })
      const saleIds = new Set(filteredSales.map(s => s.id))
      filteredSaleItems = this.saleItems.filter(si => saleIds.has(si.saleId))
    }

    filteredSaleItems.forEach(item => {
      if (!itemCounts[item.itemId]) {
        itemCounts[item.itemId] = { quantity: 0, revenue: 0 }
      }
      itemCounts[item.itemId].quantity += item.quantity
      itemCounts[item.itemId].revenue += item.totalPrice
    })

    return Object.entries(itemCounts)
      .map(([itemId, data]) => {
        const itemDetails = this.items.find(i => i.id === parseInt(itemId))
        return {
          itemId: parseInt(itemId),
          itemName: itemDetails?.name || 'Unknown',
          itemCode: itemDetails?.itemCode || 'Unknown',
          totalSold: data.quantity,
          revenue: data.revenue
        }
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    salesByPaymentMethod: Array<{ method: string; count: number; revenue: number }>
    salesByCategory: Array<{ category: string; count: number; revenue: number }>
    dailySales: Array<{ date: string; sales: number; revenue: number }>
  }> {
    const filteredSales = this.sales.filter(sale => 
      sale.saleDate >= startDate && sale.saleDate <= endDate
    )

    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)

    // Sales by payment method
    const paymentMethodCounts: Record<string, { count: number; revenue: number }> = {}
    filteredSales.forEach(sale => {
      if (!paymentMethodCounts[sale.paymentMethod]) {
        paymentMethodCounts[sale.paymentMethod] = { count: 0, revenue: 0 }
      }
      paymentMethodCounts[sale.paymentMethod].count += 1
      paymentMethodCounts[sale.paymentMethod].revenue += sale.totalAmount
    })

    const salesByPaymentMethod = Object.entries(paymentMethodCounts)
      .map(([method, data]) => ({
        method,
        count: data.count,
        revenue: data.revenue
      }))

    // Sales by category (simplified for mock)
    const salesByCategory = this.categories.map(category => ({
      category: category.name,
      count: Math.floor(Math.random() * 10),
      revenue: Math.floor(Math.random() * 1000)
    }))

    // Daily sales (simplified for mock)
    const dailySales = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      dailySales.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 20),
        revenue: Math.floor(Math.random() * 2000)
      })
    }

    return {
      totalSales,
      totalRevenue,
      salesByPaymentMethod,
      salesByCategory,
      dailySales
    }
  }

  // Inventory management
  async updateStock(itemId: number, quantity: number, operation: 'set' | 'add' | 'subtract'): Promise<StorageOperationResult<Item>> {
    const index = this.items.findIndex(item => item.id === itemId)
    if (index === -1) {
      return {
        success: false,
        error: 'Item not found'
      }
    }

    const item = this.items[index]
    
    switch (operation) {
      case 'set':
        item.stockQuantity = quantity
        break
      case 'add':
        item.stockQuantity += quantity
        break
      case 'subtract':
        item.stockQuantity = Math.max(0, item.stockQuantity - quantity)
        break
    }

    item.updatedAt = new Date()

    return {
      success: true,
      data: { ...item }
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

    // Check for orphaned sale items
    const orphanedItems = this.saleItems.filter(si => 
      !this.sales.find(sale => sale.id === si.saleId)
    )

    if (orphanedItems.length > 0) {
      issues.push(`Found ${orphanedItems.length} orphaned sale items`)
    }

    // Check for items in non-existent categories
    const orphanedCategories = this.items.filter(item => 
      item.category && !this.categories.find(cat => cat.name === item.category)
    )

    if (orphanedCategories.length > 0) {
      issues.push(`Found ${orphanedCategories.length} items with invalid categories`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}