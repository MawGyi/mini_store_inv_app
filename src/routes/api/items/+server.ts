import { db } from '$lib/server/db'
import { items } from '$lib/server/db'
import { desc, eq, count, like, or } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import { ItemSchema, ItemUpdateSchema, formatZodError } from '$lib/validators'
import type { ItemInput, ItemUpdateInput } from '$lib/validators'

function isDbAvailable() {
  return db !== null
}

export async function GET({ url }: { url: URL }) {
  if (!isDbAvailable()) {
    return json({ 
      success: false, 
      error: 'Database not available. Please configure POSTGRES_URL environment variable.' 
    }, { status: 503 })
  }
  
  try {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100)
    const offset = (page - 1) * limit
    const search = url.searchParams.get('search') || ''
    
    let query = db
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
    
    if (search) {
      query = query.where(
        or(
          like(items.name, `%${search}%`),
          like(items.itemCode, `%${search}%`)
        )
      ) as typeof query
    }
    
    const allItems = await query
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset)
    
    let countQuery = db.select({ count: count() }).from(items)
    
    if (search) {
      countQuery = countQuery.where(
        or(
          like(items.name, `%${search}%`),
          like(items.itemCode, `%${search}%`)
        )
      ) as typeof countQuery
    }
    
    const [totalResult] = await countQuery
    const total = totalResult?.count || 0
    
    return json({
      success: true,
      data: allItems,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST({ request }: { request: Request }) {
  if (!isDbAvailable()) {
    return json({ 
      success: false, 
      error: 'Database not available. Please configure POSTGRES_URL environment variable.' 
    }, { status: 503 })
  }
  
  try {
    const body: unknown = await request.json()
    
    const result = ItemSchema.safeParse(body)
    
    if (!result.success) {
      const errors = formatZodError(result.error)
      return json({
        success: false,
        error: 'Validation failed',
        validationErrors: errors
      }, { status: 400 })
    }

    const data = result.data as ItemInput
    
    const existingItems = await db
      .select()
      .from(items)
      .where(eq(items.itemCode, data.itemCode))
      .limit(1)

    const existingItem = existingItems[0]

    if (existingItem) {
      return json({
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
      createdAt: Date.now(),
      updatedAt: Date.now()
    }).returning()
    
    return json({ success: true, data: resultData[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}
