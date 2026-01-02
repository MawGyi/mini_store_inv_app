import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

const itemSchema = {
  name: (val: unknown) => typeof val === 'string' && val.length > 0,
  itemCode: (val: unknown) => typeof val === 'string' && val.length > 0,
  price: (val: unknown) => typeof val === 'number' && val >= 0,
  stockQuantity: (val: unknown) => typeof val === 'number' && Number.isInteger(val) && val >= 0,
  lowStockThreshold: (val: unknown) => typeof val === 'number' && Number.isInteger(val) && val >= 0,
  category: (val: unknown) => typeof val === 'string' || val === undefined
}

function validateItem(data: Record<string, unknown>) {
  const errors: string[] = []
  if (!itemSchema.name(data.name)) errors.push('Name is required')
  if (!itemSchema.itemCode(data.itemCode)) errors.push('Item code is required')
  if (!itemSchema.price(data.price)) errors.push('Price must be a positive number')
  if (!itemSchema.stockQuantity(data.stockQuantity)) errors.push('Stock quantity must be a non-negative integer')
  if (!itemSchema.lowStockThreshold(data.lowStockThreshold)) errors.push('Low stock threshold must be a non-negative integer')
  return errors
}

export async function GET() {
  try {
    const allItems = await db.select().from(items).orderBy(desc(items.createdAt))
    return json({ success: true, data: allItems })
  } catch (error) {
    console.error('Error fetching items:', error)
    return json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json()
    const errors = validateItem(body)
    if (errors.length > 0) {
      return json({ success: false, error: errors.join(', ') }, { status: 400 })
    }
    
    const result = await db.insert(items).values({
      name: body.name,
      itemCode: body.itemCode,
      price: body.price,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      category: body.category || null,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    
    return json({ success: true, data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}
