import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items, saleItems, sales } from '$lib/server/db'
import { eq, desc, sum, gte, sql } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    let dateFilter = undefined
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      dateFilter = sql`${sales.saleDate} >= ${start} AND ${sales.saleDate} < ${end}`
    }

    const topProducts = await db.select({
      itemId: saleItems.itemId,
      itemName: items.name,
      itemCode: items.itemCode,
      quantity: sum(saleItems.quantity).mapWith(Number),
      revenue: sum(saleItems.totalPrice).mapWith(Number)
    })
      .from(saleItems)
      .innerJoin(items, eq(saleItems.itemId, items.id))
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(dateFilter ? eq(sales.id, 0).and(dateFilter as any) : undefined)
      .groupBy(saleItems.itemId)
      .orderBy(desc(sum(saleItems.quantity)))
      .limit(limit)

    let filteredProducts = topProducts
    if (dateFilter) {
      const allSales = await db.select({ id: sales.id }).from(sales).where(sql`${sales.saleDate} >= ${startDate} AND ${sales.saleDate} < ${endDate}`)
      const saleIds = new Set(allSales.map(s => s.id))
      filteredProducts = topProducts.filter(p => p.itemId !== undefined)
    }

    const totalQuantity = filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.revenue || 0), 0)

    return json({
      summary: {
        totalQuantity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        productCount: filteredProducts.length
      },
      products: filteredProducts.map(p => ({
        name: p.itemName,
        itemCode: p.itemCode,
        quantity: p.quantity || 0,
        revenue: Math.round((p.revenue || 0) * 100) / 100
      }))
    })
  } catch (error) {
    console.error('Error generating top products report:', error)
    return json({ error: 'Failed to generate top products report' }, { status: 500 })
  }
}
