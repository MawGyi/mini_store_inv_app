import { db } from '$lib/server/db'
import { items } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import { ItemUpdateSchema, formatZodError } from '$lib/validators'
import type { ItemUpdateInput } from '$lib/validators'

export async function GET({ params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const itemsResult = await db.select().from(items).where(eq(items.id, id)).limit(1)
    const item = itemsResult[0]
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

    const body: unknown = await request.json()
    
    const result = ItemUpdateSchema.safeParse(body)
    
    if (!result.success) {
      const errors = formatZodError(result.error)
      return json({
        success: false,
        error: 'Validation failed',
        validationErrors: errors
      }, { status: 400 })
    }

    const data = result.data as Partial<ItemUpdateInput>
    
    const existingItems = await db.select().from(items).where(eq(items.id, id)).limit(1)
    const existingItem = existingItems[0]
    if (!existingItem) {
      return json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    if (data.itemCode && data.itemCode !== existingItem.itemCode) {
      const duplicateItems = await db
        .select()
        .from(items)
        .where(eq(items.itemCode, data.itemCode))
        .limit(1)

      const duplicateItem = duplicateItems[0]

      if (duplicateItem) {
        return json({
          success: false,
          error: 'Item code already exists',
          validationErrors: [{ field: 'itemCode', message: 'An item with this code already exists' }]
        }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.itemCode !== undefined) updateData.itemCode = data.itemCode
    if (data.price !== undefined) updateData.price = data.price
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold
    if (data.category !== undefined) updateData.category = data.category
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate

    const resultData = await db.update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning()

    return json({ success: true, data: resultData[0] })
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

    const existingItems = await db.select().from(items).where(eq(items.id, id)).limit(1)
    const existingItem = existingItems[0]
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
