import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db, client } from '$lib/server/db'
import { items, sales, saleItems, categories } from '$lib/server/db/schema'
import { eq, desc, sql, count, gte, asc, sum } from 'drizzle-orm'
import { ItemSchema, ItemUpdateSchema, SaleSchema, formatZodError } from '$lib/validators'
import { checkRateLimit, constantTimeEqual, validateEmail, generateSecureToken } from '$lib/server/security'

type Env = { Variables: {} }

const app = new Hono<Env>()

app.use('*', cors())

const DEMO_USERS: Record<string, { password: string; name: string; role: string }> = {
  'admin@ministore.com': { password: 'admin123', name: 'Store Admin', role: 'Administrator' },
  'manager@ministore.com': { password: 'manager123', name: 'Store Manager', role: 'Manager' },
  'staff@ministore.com': { password: 'staff123', name: 'Staff Member', role: 'Staff' }
}

const failedLogins = new Map<string, { attempts: number; lockedUntil?: number }>()

function json(c: any, data: any, init?: any) {
  return c.json(data, init)
}

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function getCookie(c: any, name: string): string | undefined {
  const cookieHeader = c.req.header('cookie')
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})
  return cookies[name]
}

app.get('/auth/csrf', async (c) => {
  let token = getCookie(c, 'csrf_token')
  if (!token) {
    token = generateSecureToken(32)
    const headers = new Headers()
    headers.set('Set-Cookie', `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`)
    return json(c, { token }, { headers })
  }
  return json(c, { token })
})

app.get('/auth/session', async (c) => {
  const sessionToken = getCookie(c, 'session')
  const verifyToken = getCookie(c, 'session_verify')
  const headers = new Headers()
  if (!sessionToken || !verifyToken) {
    headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
    headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
    return json(c, { authenticated: false, user: null }, { headers })
  }
  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    if (!sessionData.sessionKey || !sessionData.email || !sessionData.role || !sessionData.expiresAt) {
      headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      return json(c, { authenticated: false, user: null }, { headers })
    }
    if (Date.now() > sessionData.expiresAt) {
      headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      return json(c, { authenticated: false, user: null }, { headers })
    }
    return json(c, {
      authenticated: true,
      user: { id: sessionData.id, email: sessionData.email, name: sessionData.name, role: sessionData.role }
    }, { headers })
  } catch {
    headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
    headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
    return json(c, { authenticated: false, user: null }, { headers })
  }
})

app.post('/auth/login', async (c) => {
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  const rateLimit = checkRateLimit(`login:${clientIP}`)
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    return json(c, { success: false, message: 'Too many login attempts. Please try again later.', retryAfter }, { status: 429, headers: { 'Retry-After': retryAfter.toString() } })
  }
  try {
    const rawBody = await c.req.text()
    if (!rawBody || rawBody.trim() === '') {
      return json(c, { success: false, message: 'Email and password are required' }, { status: 400 })
    }
    let body: { email?: unknown; password?: unknown; rememberMe?: unknown }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return json(c, { success: false, message: 'Invalid request format' }, { status: 400 })
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const rememberMe = body.rememberMe === true
    if (!email || !password) {
      return json(c, { success: false, message: 'Email and password are required' }, { status: 400 })
    }
    if (!validateEmail(email)) {
      return json(c, { success: false, message: 'Invalid email format' }, { status: 400 })
    }
    const userConfig = DEMO_USERS[email]
    const passwordValid = userConfig ? constantTimeEqual(password, userConfig.password) : constantTimeEqual(password, 'dummy')
    if (!passwordValid) {
      const loginState = failedLogins.get(clientIP) || { attempts: 0 }
      loginState.attempts++
      if (loginState.attempts >= 5) {
        loginState.lockedUntil = Date.now() + 15 * 60 * 1000
      }
      failedLogins.set(clientIP, loginState)
      return json(c, { success: false, message: 'Invalid email or password' }, { status: 401 })
    }
    if (failedLogins.has(clientIP)) {
      failedLogins.delete(clientIP)
    }
    const sessionId = generateSecureToken(32)
    const sessionData = {
      id: sessionId,
      sessionKey: generateSecureToken(64),
      email,
      name: userConfig!.name,
      role: userConfig!.role,
      createdAt: Date.now(),
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    }
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    const headers = new Headers()
    headers.set('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`)
    headers.set('Set-Cookie', `session_verify=${generateSecureToken(32)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`)
    return json(c, {
      success: true,
      user: { id: sessionData.id, email, name: userConfig!.name, role: userConfig!.role },
      redirectTo: '/dashboard'
    }, { headers })
  } catch (error) {
    console.error('Login error:', error)
    return json(c, { success: false, message: 'An error occurred during login' }, { status: 500 })
  }
})

app.post('/auth/logout', async (c) => {
  const headers = new Headers()
  headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
  headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
  return json(c, { success: true }, { headers })
})

app.get('/items', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit
    const allItems = await db
      .select({
        id: items.id,
        name: items.name,
        itemCode: items.itemCode,
        price: items.price,
        stockQuantity: items.stockQuantity,
        lowStockThreshold: items.lowStockThreshold,
        category: items.category,
        expiryDate: items.expiryDate,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt
      })
      .from(items)
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset)
    const [totalResult] = await db.select({ count: count() }).from(items)
    const total = totalResult?.count || 0
    return json(c, {
      success: true,
      data: allItems,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return json(c, { success: false, error: 'Failed to fetch items' }, { status: 500 })
  }
})

app.post('/items', async (c) => {
  try {
    const body = await c.req.json()
    const result = ItemSchema.safeParse(body)
    if (!result.success) {
      return json(c, { success: false, error: 'Validation failed', validationErrors: formatZodError(result.error) }, { status: 400 })
    }
    const data = result.data
    const existingItem = await db.select().from(items).where(eq(items.itemCode, data.itemCode)).get()
    if (existingItem) {
      return json(c, {
        success: false,
        error: 'Item code already exists',
        validationErrors: [{ field: 'itemCode', message: 'An item with this code already exists' }]
      }, { status: 409 })
    }
    const resultData = await db.insert(items).values({
      name: data.name,
      itemCode: data.itemCode,
      price: data.price,
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      category: data.category ?? null,
      expiryDate: data.expiryDate ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    return json(c, { success: true, data: resultData[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return json(c, { success: false, error: 'Failed to create item' }, { status: 500 })
  }
})

app.get('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 })
    }
    const item = await db.select().from(items).where(eq(items.id, id)).get()
    if (!item) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 })
    }
    return json(c, { success: true, data: item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return json(c, { success: false, error: 'Failed to fetch item' }, { status: 500 })
  }
})

app.put('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 })
    }
    const body = await c.req.json()
    const result = ItemUpdateSchema.safeParse(body)
    if (!result.success) {
      return json(c, { success: false, error: 'Validation failed', validationErrors: formatZodError(result.error) }, { status: 400 })
    }
    const data = result.data
    const existingItem = await db.select().from(items).where(eq(items.id, id)).get()
    if (!existingItem) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 })
    }
    if (data.itemCode && data.itemCode !== existingItem.itemCode) {
      const duplicateItem = await db.select().from(items).where(eq(items.itemCode, data.itemCode)).get()
      if (duplicateItem) {
        return json(c, {
          success: false,
          error: 'Item code already exists',
          validationErrors: [{ field: 'itemCode', message: 'An item with this code already exists' }]
        }, { status: 409 })
      }
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.itemCode !== undefined) updateData.itemCode = data.itemCode
    if (data.price !== undefined) updateData.price = data.price
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold
    if (data.category !== undefined) updateData.category = data.category
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate
    const resultData = await db.update(items).set(updateData).where(eq(items.id, id)).returning()
    return json(c, { success: true, data: resultData[0] })
  } catch (error) {
    console.error('Error updating item:', error)
    return json(c, { success: false, error: 'Failed to update item' }, { status: 500 })
  }
})

app.delete('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 })
    }
    const existingItem = await db.select().from(items).where(eq(items.id, id)).get()
    if (!existingItem) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 })
    }
    await db.delete(items).where(eq(items.id, id))
    return json(c, { success: true, message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return json(c, { success: false, error: 'Failed to delete item' }, { status: 500 })
  }
})

app.get('/sales', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit
    const allSales = await db.select({
      id: sales.id,
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount,
      paymentMethod: sales.paymentMethod,
      customerName: sales.customerName,
      invoiceNumber: sales.invoiceNumber,
      createdAt: sales.createdAt
    })
    .from(sales)
    .orderBy(desc(sales.saleDate))
    .limit(limit)
    .offset(offset)
    const [totalResult] = await db.select({ count: count() }).from(sales)
    const total = totalResult?.count || 0
    return json(c, {
      success: true,
      data: allSales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return json(c, { success: false, error: 'Failed to fetch sales' }, { status: 500 })
  }
})

app.post('/sales', async (c) => {
  try {
    const body = await c.req.json()
    const parseResult = SaleSchema.safeParse(body)
    if (!parseResult.success) {
      return json(c, { success: false, error: 'Validation failed', validationErrors: formatZodError(parseResult.error) }, { status: 400 })
    }
    const req = parseResult.data
    const invoiceNumber = generateInvoiceNumber()
    interface SaleItemData { itemId: number; quantity: number; unitPrice: number; totalPrice: number; name: string; currentStock: number }
    interface SaleResult { sale: { id: number; saleDate: Date; totalAmount: number; paymentMethod: string; customerName: string | null; invoiceNumber: string; createdAt: Date; updatedAt: Date } | undefined; items: Array<{ id: number; saleId: number; itemId: number; itemName: string; quantity: number; unitPrice: number; totalPrice: number }> }
    const result = await db.transaction(async (tx): Promise<SaleResult> => {
      const saleItemsData: SaleItemData[] = []
      let totalAmount = 0
      for (const item of req.items) {
        const itemExists = await tx.select({ id: items.id, name: items.name, stockQuantity: items.stockQuantity }).from(items).where(eq(items.id, item.itemId)).get()
        if (!itemExists) {
          throw new Error(`Item with ID ${item.itemId} not found`)
        }
        if (itemExists.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${itemExists.name}. Available: ${itemExists.stockQuantity}, Requested: ${item.quantity}`)
        }
        const newStockQuantity = itemExists.stockQuantity - item.quantity
        if (newStockQuantity < 0) {
          throw new Error(`Transaction would result in negative stock for ${itemExists.name}`)
        }
        saleItemsData.push({ itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice, name: itemExists.name, currentStock: itemExists.stockQuantity })
        totalAmount += item.totalPrice
      }
      const saleDate = req.saleDate ? new Date(req.saleDate) : new Date()
      const now = new Date()
      const saleResult = await tx.insert(sales).values({
        saleDate,
        totalAmount,
        paymentMethod: req.paymentMethod,
        customerName: req.customerName || null,
        invoiceNumber,
        createdAt: now,
        updatedAt: now
      }).returning()
      const saleId = saleResult[0].id
      for (const item of saleItemsData) {
        await tx.insert(saleItems).values({ saleId, itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })
        await tx.update(items).set({ stockQuantity: sql`${items.stockQuantity} - ${item.quantity}`, updatedAt: now }).where(eq(items.id, item.itemId))
      }
      const createdSale = await tx.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, paymentMethod: sales.paymentMethod, customerName: sales.customerName, invoiceNumber: sales.invoiceNumber, createdAt: sales.createdAt, updatedAt: sales.updatedAt }).from(sales).where(eq(sales.id, saleId)).get()
      const createdSaleItems = await tx.select({ id: saleItems.id, saleId: saleItems.saleId, itemId: saleItems.itemId, itemName: items.name, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice, totalPrice: saleItems.totalPrice }).from(saleItems).innerJoin(items, eq(saleItems.itemId, items.id)).where(eq(saleItems.saleId, saleId)).then((rows: any[]) => rows.map((row) => ({ id: row.id, saleId: row.saleId ?? saleId, itemId: row.itemId ?? 0, itemName: row.itemName, quantity: row.quantity, unitPrice: row.unitPrice, totalPrice: row.totalPrice })))
      return { sale: createdSale, items: createdSaleItems }
    })
    return json(c, { success: true, data: { ...result.sale!, items: result.items } }, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create sale'
    return json(c, { success: false, error: errorMessage }, { status: 400 })
  }
})

app.get('/sales/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid sale ID' }, { status: 400 })
    }
    const sale = await db.select().from(sales).where(eq(sales.id, id)).get()
    if (!sale) {
      return json(c, { success: false, error: 'Sale not found' }, { status: 404 })
    }
    const saleItemsList = await db.select({ id: saleItems.id, saleId: saleItems.saleId, itemId: saleItems.itemId, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice, totalPrice: saleItems.totalPrice, itemName: items.name }).from(saleItems).innerJoin(items, eq(saleItems.itemId, items.id)).where(eq(saleItems.saleId, id)).then((rows: any[]) => rows.map((item) => ({ ...item, saleId: item.saleId || id, itemId: item.itemId || 0 })))
    const saleWithItems = { id: sale.id, saleDate: sale.saleDate, totalAmount: sale.totalAmount, paymentMethod: sale.paymentMethod as 'cash' | 'credit' | 'mobile_payment', customerName: sale.customerName, invoiceNumber: sale.invoiceNumber, createdAt: sale.createdAt, updatedAt: sale.updatedAt, items: saleItemsList }
    return json(c, { success: true, data: saleWithItems })
  } catch (error) {
    console.error('Error fetching sale:', error)
    return json(c, { success: false, error: 'Failed to fetch sale' }, { status: 500 })
  }
})

app.get('/sales/top-selling', async (c) => {
  const limit = parseInt(c.req.query('limit') || '5')
  const topSelling = await db.select({
    itemId: saleItems.itemId,
    itemName: items.name,
    totalQuantity: sum(saleItems.quantity).mapWith(Number),
    totalRevenue: sum(saleItems.totalPrice).mapWith(Number)
  })
  .from(saleItems)
  .innerJoin(items, eq(saleItems.itemId, items.id))
  .groupBy(saleItems.itemId)
  .orderBy(desc(sum(saleItems.quantity)))
  .limit(limit)
  return json(c, { success: true, data: topSelling })
})

app.get('/dashboard', async (c) => {
  const action = c.req.query('action') || 'overview'
  try {
    if (action === 'alerts') {
      const alerts: any[] = []
      const allItems = await db.select({ id: items.id, name: items.name, itemCode: items.itemCode, stockQuantity: items.stockQuantity, lowStockThreshold: items.lowStockThreshold, updatedAt: items.updatedAt, expiryDate: items.expiryDate }).from(items)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const recentSales = await db.select({ saleId: saleItems.saleId, itemId: saleItems.itemId }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).where(gte(sales.saleDate, thirtyDaysAgo))
      const soldItemIds = new Set(recentSales.map(s => s.itemId))
      for (const item of allItems) {
        if (item.stockQuantity === 0) {
          alerts.push({ type: 'out_of_stock', message: `${item.name} is out of stock`, severity: 'critical', itemId: item.id, itemCode: item.itemCode, name: item.name, stockQuantity: item.stockQuantity })
        } else if (item.stockQuantity <= item.lowStockThreshold) {
          const severity = item.stockQuantity <= 2 ? 'critical' : item.stockQuantity <= Math.floor(item.lowStockThreshold / 2) ? 'high' : 'medium'
          alerts.push({ type: 'low_stock', message: `${item.name} is running low (${item.stockQuantity} remaining)`, severity, itemId: item.id, itemCode: item.itemCode, name: item.name, stockQuantity: item.stockQuantity })
        } else if (item.stockQuantity > 0 && !soldItemIds.has(item.id)) {
          alerts.push({ type: 'slow_moving', message: `${item.name} hasn't sold in 30 days`, severity: 'low', itemId: item.id, itemCode: item.itemCode, name: item.name, stockQuantity: item.stockQuantity })
        }
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilExpiry < 0) {
            alerts.push({ type: 'expired', message: `${item.name} has expired`, severity: 'critical', itemId: item.id, itemCode: item.itemCode, name: item.name, stockQuantity: item.stockQuantity, expiryDate: item.expiryDate, daysUntilExpiry })
          } else if (daysUntilExpiry <= 30) {
            const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 14 ? 'high' : 'medium'
            alerts.push({ type: 'expiring_soon', message: `${item.name} expires in ${daysUntilExpiry} days`, severity, itemId: item.id, itemCode: item.itemCode, name: item.name, stockQuantity: item.stockQuantity, expiryDate: item.expiryDate, daysUntilExpiry })
          }
        }
      }
      const sortedAlerts = alerts.sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        const aOrder = severityOrder[a.severity] ?? 4
        const bOrder = severityOrder[b.severity] ?? 4
        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }
        return 0
      })
      return json(c, { success: true, data: sortedAlerts })
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const [totalSalesResult] = await db.select({ total: sum(sales.totalAmount).mapWith(Number) }).from(sales)
    const [totalTransactions] = await db.select({ count: count() }).from(sales)
    const [totalItemsResult] = await db.select({ total: sum(items.stockQuantity).mapWith(Number) }).from(items)
    const [itemCountResult] = await db.select({ count: count() }).from(items)
    const [lowStockItems] = await db.select({ count: count() }).from(items).where(sql`${items.stockQuantity} <= ${items.lowStockThreshold}`)
    const [outOfStockItems] = await db.select({ count: count() }).from(items).where(eq(items.stockQuantity, 0))
    const [todaySales] = await db.select({ total: sum(sales.totalAmount).mapWith(Number) }).from(sales).where(gte(sales.saleDate, today))
    const [todayTransactionCount] = await db.select({ count: count() }).from(sales).where(gte(sales.saleDate, today))
    const [weekSales] = await db.select({ total: sum(sales.totalAmount).mapWith(Number) }).from(sales).where(gte(sales.saleDate, weekAgo))
    const [monthSales] = await db.select({ total: sum(sales.totalAmount).mapWith(Number) }).from(sales).where(gte(sales.saleDate, monthAgo))
    const [recentSales] = await db.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, invoiceNumber: sales.invoiceNumber, customerName: sales.customerName }).from(sales).orderBy(desc(sales.saleDate)).limit(5)
    const overview = { totalSales: totalSalesResult?.total || 0, totalTransactions: totalTransactions?.count || 0, totalItems: itemCountResult?.count || 0, lowStockItems: lowStockItems?.count || 0, todaySales: todaySales?.total || 0, weekSales: weekSales?.total || 0, monthSales: monthSales?.total || 0 }
    return json(c, {
      success: true,
      data: {
        overview,
        inventory: { totalItems: itemCountResult?.count || 0, totalCategories: 0, lowStockItems: lowStockItems?.count || 0, outOfStockItems: outOfStockItems?.count || 0, totalValue: totalItemsResult?.total || 0 },
        sales: { today: { count: todayTransactionCount?.count || 0, totalAmount: todaySales?.total || 0 }, thisMonth: { count: 0, totalAmount: monthSales?.total || 0 } },
        recentSales: recentSales || [],
        todayTransactionCount: todayTransactionCount?.count || 0
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return json(c, { success: false, error: 'Internal server error' }, { status: 500 })
  }
})

app.get('/dashboard/alerts', async (c) => {
  const alerts: any[] = []
  const lowStock = await db.select().from(items).where(sql`${items.stockQuantity} <= ${items.lowStockThreshold}`).orderBy(asc(items.stockQuantity)).limit(10)
  for (const item of lowStock) {
    alerts.push({
      type: 'low_stock',
      message: `${item.name} (${item.itemCode}) - Stock: ${item.stockQuantity}`,
      severity: item.stockQuantity === 0 ? 'critical' : 'warning',
      itemId: item.id,
      itemCode: item.itemCode,
      name: item.name,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold
    })
  }
  return json(c, { success: true, data: alerts })
})

app.get('/dashboard/sales-trends', async (c) => {
  const days = parseInt(c.req.query('days') || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const salesTrends = await db.select({
    date: sql<string>`DATE(${sales.saleDate} / 1000, 'unixepoch')`.as('date'),
    totalSales: sum(sales.totalAmount).mapWith(Number),
    transactionCount: count()
  })
  .from(sales)
  .where(gte(sales.saleDate, startDate))
  .groupBy(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`)
  .orderBy(asc(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`))
  return json(c, { success: true, data: salesTrends })
})

app.get('/reports/daily-summary', async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const days = parseInt(c.req.query('days') || '30')
    let allSales = await db.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, createdAt: sales.createdAt }).from(sales).orderBy(desc(sales.saleDate))
    let filteredSales = allSales
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filteredSales = filteredSales.filter(s => { const saleTime = s.saleDate ? s.saleDate.getTime() : 0; return saleTime >= start && saleTime < end })
    } else {
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
      filteredSales = filteredSales.filter(s => { const saleTime = s.saleDate ? s.saleDate.getTime() : 0; return saleTime >= cutoff })
    }
    const salesByDate: Record<string, { total: number; count: number }> = {}
    for (const sale of filteredSales) {
      const date = sale.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : 'Unknown'
      if (!salesByDate[date]) salesByDate[date] = { total: 0, count: 0 }
      salesByDate[date].total += sale.totalAmount
      salesByDate[date].count += 1
    }
    const dailySummaries = Object.entries(salesByDate).map(([date, data]) => ({ date, totalSales: Math.round(data.total * 100) / 100, transactionCount: data.count, avgSaleValue: Math.round((data.total / data.count) * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date))
    const overallTotal = dailySummaries.reduce((sum, d) => sum + d.totalSales, 0)
    const overallTransactions = dailySummaries.reduce((sum, d) => sum + d.transactionCount, 0)
    const overallAvg = overallTransactions > 0 ? overallTotal / overallTransactions : 0
    return json(c, {
      summary: { totalRevenue: Math.round(overallTotal * 100) / 100, totalTransactions: overallTransactions, avgDailySales: Math.round((overallTotal / Math.max(dailySummaries.length, 1)) * 100) / 100, avgTransactionValue: Math.round(overallAvg * 100) / 100, dayCount: dailySummaries.length },
      daily: dailySummaries
    })
  } catch (error) {
    console.error('Error generating daily summary report:', error)
    return json(c, { error: 'Failed to generate daily summary report' }, { status: 500 })
  }
})

app.get('/reports/top-products', async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const limit = parseInt(c.req.query('limit') || '10')
    const allSaleItemsRaw = await db.select({ saleId: saleItems.saleId, itemId: saleItems.itemId, quantity: saleItems.quantity, totalPrice: saleItems.totalPrice }).from(saleItems)
    const allSaleItems = allSaleItemsRaw.filter(si => si.saleId !== null && si.itemId !== null) as Array<{ saleId: number; itemId: number; quantity: number; totalPrice: number }>
    const allSales = await db.select({ id: sales.id, saleDate: sales.saleDate }).from(sales)
    let saleIds = new Set<number>()
    for (const s of allSales) {
      if (s.id) {
        if (!startDate || !endDate) {
          saleIds.add(s.id)
        } else {
          const saleTime = s.saleDate ? s.saleDate.getTime() : 0
          const start = new Date(startDate).getTime()
          const end = new Date(endDate).getTime() + 86400000
          if (saleTime >= start && saleTime < end) saleIds.add(s.id)
        }
      }
    }
    const itemStats: Record<number, { quantity: number; revenue: number }> = {}
    for (const si of allSaleItems) {
      if (saleIds.has(si.saleId)) {
        if (!itemStats[si.itemId]) itemStats[si.itemId] = { quantity: 0, revenue: 0 }
        itemStats[si.itemId].quantity += si.quantity
        itemStats[si.itemId].revenue += si.totalPrice
      }
    }
    const itemIds = Object.keys(itemStats).map(Number)
    let itemDetails: any[] = []
    if (itemIds.length > 0) {
      try {
        itemDetails = await db.select().from(items).where(sql`${items.id} IN ${itemIds}`)
      } catch (e) {
        itemDetails = []
      }
    }
    const itemMap = new Map<number, any>()
    for (const item of itemDetails) {
      if (item.id) itemMap.set(item.id, item)
    }
    const topProducts = Object.entries(itemStats).map(([itemId, stats]) => {
      const itemIdNum = Number(itemId)
      const item = itemMap.get(itemIdNum)
      return { itemId: itemIdNum, name: item?.name || 'Unknown', itemCode: item?.itemCode || '', quantity: stats.quantity, revenue: Math.round(stats.revenue * 100) / 100, price: item?.price || 0 }
    }).sort((a, b) => b.quantity - a.quantity).slice(0, limit)
    const totalQuantity = topProducts.reduce((sum, p) => sum + p.quantity, 0)
    const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0)
    return json(c, { summary: { totalQuantity, totalRevenue: Math.round(totalRevenue * 100) / 100, productCount: topProducts.length }, products: topProducts })
  } catch (error) {
    console.error('Error generating top products report:', error)
    return json(c, { error: 'Failed to generate top products report' }, { status: 500 })
  }
})

app.get('/reports/inventory', async (c) => {
  try {
    const category = c.req.query('category')
    const status = c.req.query('status')
    let query = db.select({ id: items.id, name: items.name, itemCode: items.itemCode, price: items.price, stockQuantity: items.stockQuantity, lowStockThreshold: items.lowStockThreshold, category: items.category, expiryDate: items.expiryDate, createdAt: items.createdAt, updatedAt: items.updatedAt }).from(items).orderBy(desc(items.id))
    let allItems: any[] = []
    try { allItems = await query } catch (e) { allItems = [] }
    let filteredItems = allItems
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(i => i.category === category)
    }
    if (status) {
      if (status === 'low_stock') filteredItems = filteredItems.filter(i => i.stockQuantity <= i.lowStockThreshold)
      else if (status === 'out_of_stock') filteredItems = filteredItems.filter(i => i.stockQuantity === 0)
      else if (status === 'in_stock') filteredItems = filteredItems.filter(i => i.stockQuantity > i.lowStockThreshold)
    }
    const totalItems = filteredItems.length
    const totalStock = filteredItems.reduce((sum, i) => sum + i.stockQuantity, 0)
    const totalValue = filteredItems.reduce((sum, i) => sum + (i.price * i.stockQuantity), 0)
    const lowStockCount = filteredItems.filter(i => i.stockQuantity <= i.lowStockThreshold).length
    const outOfStockCount = filteredItems.filter(i => i.stockQuantity === 0).length
    const byCategory: Record<string, number> = {}
    for (const item of filteredItems) {
      const cat = item.category || 'Uncategorized'
      byCategory[cat] = (byCategory[cat] || 0) + 1
    }
    return json(c, { summary: { totalItems, totalStock, totalValue: Math.round(totalValue * 100) / 100, lowStockCount, outOfStockCount, byCategory }, items: filteredItems })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return json(c, { error: 'Failed to generate inventory report' }, { status: 500 })
  }
})

app.get('/reports/sales', async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const paymentMethod = c.req.query('paymentMethod')
    const allSales = await db.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, paymentMethod: sales.paymentMethod, customerName: sales.customerName, invoiceNumber: sales.invoiceNumber, createdAt: sales.createdAt }).from(sales).orderBy(desc(sales.saleDate))
    let filteredSales = allSales
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filteredSales = filteredSales.filter(s => { const saleTime = s.saleDate ? s.saleDate.getTime() : 0; return saleTime >= start && saleTime < end })
    }
    if (paymentMethod) {
      filteredSales = filteredSales.filter(s => s.paymentMethod === paymentMethod)
    }
    let totalAmount = 0
    let totalTransactions = filteredSales.length
    let itemsSold = 0
    for (const sale of filteredSales) {
      totalAmount += sale.totalAmount
      const saleItemsData = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id))
      itemsSold += saleItemsData.reduce((sum, si) => sum + si.quantity, 0)
    }
    const byPaymentMethod: Record<string, number> = {}
    for (const sale of filteredSales) {
      byPaymentMethod[sale.paymentMethod] = (byPaymentMethod[sale.paymentMethod] || 0) + 1
    }
    const avgSaleValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0
    return json(c, { summary: { totalAmount: Math.round(totalAmount * 100) / 100, totalTransactions, itemsSold, avgSaleValue: Math.round(avgSaleValue * 100) / 100, byPaymentMethod }, sales: filteredSales.slice(0, 100) })
  } catch (error) {
    console.error('Error generating sales report:', error)
    return json(c, { error: 'Failed to generate sales report' }, { status: 500 })
  }
})

app.get('/export/backup', async (c) => {
  try {
    const allItems = await db.select({ id: items.id, name: items.name, itemCode: items.itemCode, price: items.price, stockQuantity: items.stockQuantity, lowStockThreshold: items.lowStockThreshold, category: items.category, expiryDate: items.expiryDate, createdAt: items.createdAt, updatedAt: items.updatedAt }).from(items).orderBy(desc(items.id))
    const allSales = await db.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, paymentMethod: sales.paymentMethod, customerName: sales.customerName, invoiceNumber: sales.invoiceNumber, createdAt: sales.createdAt, updatedAt: sales.updatedAt }).from(sales).orderBy(desc(sales.id))
    const allSaleItems = await db.select().from(saleItems).orderBy(desc(saleItems.id))
    const allCategories = await db.select({ id: categories.id, name: categories.name, createdAt: categories.createdAt }).from(categories).orderBy(desc(categories.id))
    const backup = { version: '1.0', exportedAt: new Date().toISOString(), items: allItems, sales: allSales, saleItems: allSaleItems, categories: allCategories }
    return c.text(JSON.stringify(backup, null, 2), 200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.json"` })
  } catch (error) {
    console.error('Error creating backup:', error)
    return json(c, { error: 'Failed to create backup' }, { status: 500 })
  }
})

app.get('/export/sales', async (c) => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const allSales = await db.select({ id: sales.id, saleDate: sales.saleDate, totalAmount: sales.totalAmount, paymentMethod: sales.paymentMethod, customerName: sales.customerName, invoiceNumber: sales.invoiceNumber, createdAt: sales.createdAt }).from(sales).orderBy(desc(sales.saleDate))
    let filteredSales = allSales
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filteredSales = allSales.filter(s => { const saleTime = s.saleDate ? s.saleDate.getTime() : 0; return saleTime >= start && saleTime < end })
    }
    const csvHeader = 'ID,Date,Invoice Number,Customer,Payment Method,Total Amount,Created At\n'
    const csvRows = filteredSales.map(sale => {
      const saleDate = sale.saleDate ? sale.saleDate.toISOString() : ''
      const createdAt = sale.createdAt ? sale.createdAt.toISOString() : ''
      return [sale.id, saleDate, `"${(sale.invoiceNumber || '').replace(/"/g, '""')}"`, `"${(sale.customerName || '').replace(/"/g, '""')}"`, sale.paymentMethod, sale.totalAmount, createdAt].join(',')
    })
    const csv = csvHeader + csvRows.join('\n')
    return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="sales_export_${new Date().toISOString().split('T')[0]}.csv"` })
  } catch (error) {
    console.error('Error exporting sales:', error)
    return json(c, { error: 'Failed to export sales' }, { status: 500 })
  }
})

app.get('/export/items', async (c) => {
  try {
    const allItems = await db.select({ id: items.id, name: items.name, itemCode: items.itemCode, price: items.price, stockQuantity: items.stockQuantity, lowStockThreshold: items.lowStockThreshold, category: items.category, expiryDate: items.expiryDate, createdAt: items.createdAt, updatedAt: items.updatedAt }).from(items).orderBy(desc(items.id))
    const csvHeader = 'ID,Name,Item Code,Price,Stock Quantity,Low Stock Threshold,Category,Expiry Date,Created At,Updated At\n'
    const csvRows = allItems.map(item => {
      const expiryDate = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
      const createdAt = item.createdAt ? new Date(item.createdAt).toISOString() : ''
      const updatedAt = item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
      return [item.id, `"${item.name.replace(/"/g, '""')}"`, `"${item.itemCode.replace(/"/g, '""')}"`, item.price, item.stockQuantity, item.lowStockThreshold, `"${(item.category || '').replace(/"/g, '""')}"`, expiryDate, createdAt, updatedAt].join(',')
    })
    const csv = csvHeader + csvRows.join('\n')
    return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="items_export_${new Date().toISOString().split('T')[0]}.csv"` })
  } catch (error) {
    console.error('Error exporting items:', error)
    return json(c, { error: 'Failed to export items' }, { status: 500 })
  }
})

app.post('/import/clear-all', async (c) => {
  try {
    await client.execute('DELETE FROM sale_items')
    await client.execute('DELETE FROM sales')
    await client.execute('DELETE FROM items')
    await client.execute('DELETE FROM categories')
    return json(c, { message: 'All data cleared successfully' })
  } catch (error) {
    console.error('Error clearing data:', error)
    return json(c, { error: 'Failed to clear data' }, { status: 500 })
  }
})

app.post('/import/items', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    if (!file || file.type !== 'text/csv') {
      return json(c, { error: 'Please upload a valid CSV file' }, { status: 400 })
    }
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      return json(c, { error: 'CSV file is empty' }, { status: 400 })
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const nameIdx = headers.findIndex(h => h === 'name')
    const itemCodeIdx = headers.findIndex(h => h === 'itemcode')
    const priceIdx = headers.findIndex(h => h === 'price')
    const stockQtyIdx = headers.findIndex(h => h === 'stockquantity')
    const categoryIdx = headers.findIndex(h => h === 'category')
    const lowStockIdx = headers.findIndex(h => h === 'lowstockthreshold')
    if (nameIdx === -1 || itemCodeIdx === -1 || priceIdx === -1 || stockQtyIdx === -1) {
      return json(c, { error: 'CSV must have columns: name, itemcode, price, stockquantity' }, { status: 400 })
    }
    let imported = 0
    let skipped = 0
    const now = Date.now()
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const name = values[nameIdx]?.trim().replace(/^['"]|['"]$/g, '') || ''
      const itemCode = values[itemCodeIdx]?.trim().replace(/^['"]|['"]$/g, '') || ''
      const price = parseFloat(values[priceIdx]?.trim().replace(/^['"]|['"]$/g, '') || '0')
      const stockQuantity = parseInt(values[stockQtyIdx]?.trim().replace(/^['"]|['"]$/g, '') || '0')
      const category = categoryIdx !== -1 ? values[categoryIdx]?.trim().replace(/^['"]|['"]$/g, '') || '' : ''
      const lowStockThreshold = lowStockIdx !== -1 ? parseInt(values[lowStockIdx]?.trim().replace(/^['"]|['"]$/g, '') || '10') : 10
      if (!name || !itemCode || isNaN(price) || price <= 0 || isNaN(stockQuantity)) {
        skipped++
        continue
      }
      try {
        const existingItem = await db.select().from(items).where(eq(items.itemCode, itemCode)).get()
        if (existingItem) {
          await db.update(items).set({ name, price, stockQuantity, lowStockThreshold, category: category || null, updatedAt: new Date(now) }).where(eq(items.id, existingItem.id))
        } else {
          await db.insert(items).values({ name, itemCode, price, stockQuantity, lowStockThreshold, category: category || null, createdAt: new Date(now), updatedAt: new Date(now) })
        }
        imported++
      } catch (err) {
        console.error(`Error importing row ${i}:`, err)
        skipped++
      }
    }
    return json(c, { message: 'Import completed', imported, skipped })
  } catch (error) {
    console.error('Error importing items:', error)
    return json(c, { error: 'Failed to import items' }, { status: 500 })
   }
})

export const GET = (req: Request) => app.request(req.url, req)
export const POST = (req: Request) => app.request(req.url, req)
export const PUT = (req: Request) => app.request(req.url, req)
export const DELETE = (req: Request) => app.request(req.url, req)
