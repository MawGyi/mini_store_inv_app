import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get('category')
    const status = url.searchParams.get('status')

    let query = db.select({
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
      .orderBy(desc(items.id))

    let allItems: typeof items.$inferSelect[] = []
    
    try {
      allItems = await query
    } catch (e) {
      allItems = []
    }

    let filteredItems = allItems

    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(i => i.category === category)
    }

    if (status) {
      if (status === 'low_stock') {
        filteredItems = filteredItems.filter(i => i.stockQuantity <= i.lowStockThreshold)
      } else if (status === 'out_of_stock') {
        filteredItems = filteredItems.filter(i => i.stockQuantity === 0)
      } else if (status === 'in_stock') {
        filteredItems = filteredItems.filter(i => i.stockQuantity > i.lowStockThreshold)
      }
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

    return json({
      summary: {
        totalItems,
        totalStock,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        byCategory
      },
      items: filteredItems
    })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return json({ error: 'Failed to generate inventory report' }, { status: 500 })
  }
}
