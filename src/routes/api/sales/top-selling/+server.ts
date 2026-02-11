import { db } from '$lib/server/db'
import { items, saleItems, sales } from '$lib/server/db'
import { sql, eq, desc, sum } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

function isDbAvailable() {
  return db !== null
}

export async function GET({ url }: { url: URL }) {
  if (!isDbAvailable()) {
    return json({ success: true, data: [] })
  }

  const limit = parseInt(url.searchParams.get('limit') || '5')

  try {
    const allSaleItems = await db.select({
      itemId: saleItems.itemId,
      quantity: saleItems.quantity,
      totalPrice: saleItems.totalPrice
    })
      .from(saleItems)

    // Fetch all items upfront to avoid N+1 queries
    const allItems = await db.select({ id: items.id, name: items.name }).from(items)
    const itemMap = new Map<number, string>(allItems.map((i: { id: number; name: string }) => [i.id, i.name]))

    const itemStats: Record<number, { itemId: number; itemName: string; totalQuantity: number; totalRevenue: number }> = {}

    for (const saleItem of allSaleItems) {
      const itemId = saleItem.itemId as number
      if (!itemStats[itemId]) {
        itemStats[itemId] = {
          itemId,
          itemName: itemMap.get(itemId) || 'Unknown',
          totalQuantity: 0,
          totalRevenue: 0
        }
      }
      itemStats[itemId].totalQuantity += saleItem.quantity || 0
      itemStats[itemId].totalRevenue += saleItem.totalPrice || 0
    }

    const topSelling = Object.values(itemStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
      .map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        totalQuantity: item.totalQuantity,
        totalRevenue: Math.round(item.totalRevenue * 100) / 100
      }))

    return json({ success: true, data: topSelling })
  } catch (error) {
    console.error('Top selling error:', error)
    return json({ success: true, data: [] })
  }
}
