import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { saleItems, items, sales } from '$lib/server/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const allSaleItemsRaw = await db.select({
      saleId: saleItems.saleId,
      itemId: saleItems.itemId,
      quantity: saleItems.quantity,
      totalPrice: saleItems.totalPrice
    })
      .from(saleItems)

    const allSaleItems = allSaleItemsRaw.filter(si => si.saleId !== null && si.itemId !== null) as Array<{ saleId: number; itemId: number; quantity: number; totalPrice: number }>

    const allSales = await db.select({
      id: sales.id,
      saleDate: sales.saleDate
    })
      .from(sales)

    let saleIds = new Set<number>()
    for (const s of allSales) {
      if (s.id) {
        if (!startDate || !endDate) {
          saleIds.add(s.id)
        } else {
          const saleTime = s.saleDate ? s.saleDate.getTime() : 0
          const start = new Date(startDate).getTime()
          const end = new Date(endDate).getTime() + 86400000
          if (saleTime >= start && saleTime < end) {
            saleIds.add(s.id)
          }
        }
      }
    }

    const itemStats: Record<number, { quantity: number; revenue: number }> = {}
    for (const si of allSaleItems) {
      if (saleIds.has(si.saleId)) {
        if (!itemStats[si.itemId]) {
          itemStats[si.itemId] = { quantity: 0, revenue: 0 }
        }
        itemStats[si.itemId].quantity += si.quantity
        itemStats[si.itemId].revenue += si.totalPrice
      }
    }

    const itemIds = Object.keys(itemStats).map(Number)
    let itemDetails: typeof items.$inferSelect[] = []
    
    if (itemIds.length > 0) {
      try {
        itemDetails = await db.select().from(items).where(sql`${items.id} IN ${itemIds}`)
      } catch (e) {
        itemDetails = []
      }
    }

    const itemMap = new Map<number, typeof items.$inferSelect>()
    for (const item of itemDetails) {
      if (item.id) {
        itemMap.set(item.id, item)
      }
    }

    const topProducts = Object.entries(itemStats)
      .map(([itemId, stats]) => {
        const itemIdNum = Number(itemId)
        const item = itemMap.get(itemIdNum)
        return {
          itemId: itemIdNum,
          name: item?.name || 'Unknown',
          itemCode: item?.itemCode || '',
          quantity: stats.quantity,
          revenue: Math.round(stats.revenue * 100) / 100,
          price: item?.price || 0
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)

    const totalQuantity = topProducts.reduce((sum, p) => sum + p.quantity, 0)
    const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0)

    return json({
      summary: {
        totalQuantity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        productCount: topProducts.length
      },
      products: topProducts
    })
  } catch (error) {
    console.error('Error generating top products report:', error)
    return json({ error: 'Failed to generate top products report' }, { status: 500 })
  }
}
