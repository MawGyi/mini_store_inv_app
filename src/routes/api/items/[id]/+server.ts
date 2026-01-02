import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

const itemSchema = {
  name: (val: unknown) => typeof val === 'string' && val.length > 0,
  itemCode: (val: unknown) => typeof val === 'string' && val.length > 0,
  price: (val: unknown) => typeof val === 'number' && val >= 0,
  stockQuantity: (val: unknown) => typeof val === 'number' && Number.isInteger(val) && val >= 0,
  lowStockThreshold: (val: unknown) => typeof val === 'number' && Number.isInteger(val) && val >= 0,
  category: (val: unknown) => typeof val === 'string' || val === undefined
}

function validateItem(data: Record<string, unknown>, isUpdate = false) {
  const errors: string[] = []
  if (!isUpdate || 'name' in data) {
    if (!itemSchema.name(data.name)) errors.push('Name is required')
  }
  if (!isUpdate || 'itemCode' in data) {
    if (!itemSchema.itemCode(data.itemCode)) errors.push('Item code is required')
  }
  if (!isUpdate || 'price' in data) {
    if (!itemSchema.price(data.price)) errors.push('Price must be a positive number')
  }
  if (!isUpdate || 'stockQuantity' in data) {
    if (!itemSchema.stockQuantity(data.stockQuantity)) errors.push('Stock quantity must be a non-negative integer')
  }
  if (!isUpdate || 'lowStockThreshold' in data) {
    if (!itemSchema.lowStockThreshold(data.lowStockThreshold)) errors.push('Low stock threshold must be a non-negative integer')
  }
  return errors
}

export async function GET({ params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const item = await db.select().from(items).where(eq(items.id, id)).get()
    if (!item) {
      return json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    return json({ success: true, data: item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return json({ success: false, error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PUT({ request, params }: { request: Request; params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const body = await request.json()
    const errors = validateItem(body, true)
    if (errors.length > 0) {
      return json({ success: false, error: errors.join(', ') }, { status: 400 })
    }

    const existingItem = await db.select().from(items).where(eq(items.id, id)).get()
    if (!existingItem) {
      return json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    const result = await db.update(items).set({
      name: body.name ?? existingItem.name,
      itemCode: body.itemCode ?? existingItem.itemCode,
      price: body.price ?? existingItem.price,
      stockQuantity: body.stockQuantity ?? existingItem.stockQuantity,
      lowStockThreshold: body.lowStockThreshold ?? existingItem.lowStockThreshold,
      category: body.category ?? existingItem.category,
      updatedAt: new Date()
    }).where(eq(items.id, id)).returning()

    return json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating item:', error)
    return json({ success: false, error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE({ params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const existingItem = await db.select().from(items).where(eq(items.id, id)).get()
    if (!existingItem) {
      return json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    await db.delete(items).where(eq(items.id, id))

    return json({ success: true, message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return json({ success: false, error: 'Failed to delete item' }, { status: 500 })
  }
}
