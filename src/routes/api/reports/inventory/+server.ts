import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items } from '$lib/server/db'
import { eq, desc, sql, count, sum } from 'drizzle-orm'

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
      createdAt: items.createdAt
    })
      .from(items)

    let allItems: Array<{
      id: number
      name: string
      itemCode: string
      price: number
      stockQuantity: number
      lowStockThreshold: number
      category: string | null
      createdAt: Date
    }>

    if (category && category !== 'all') {
      if (category === '') {
        allItems = await query.where(sql`${items.category} IS NULL`)
      } else {
        allItems = await query.where(eq(items.category, category))
      }
    } else {
      allItems = await query
    }

    if (status === 'in_stock') {
      allItems = allItems.filter(i => i.stockQuantity > i.lowStockThreshold)
    } else if (status === 'low_stock') {
      allItems = allItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockThreshold)
    } else if (status === 'out_of_stock') {
      allItems = allItems.filter(i => i.stockQuantity === 0)
    }

    const totalStock = allItems.reduce((sum, item) => sum + item.stockQuantity, 0)
    const totalValue = allItems.reduce((sum, item) => sum + (item.price * item.stockQuantity), 0)
    const lowStockCount = allItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockThreshold).length

    return json({
      summary: {
        totalItems: allItems.length,
        totalStock,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount
      },
      items: allItems
    })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return json({ error: 'Failed to generate inventory report' }, { status: 500 })
  }
}
