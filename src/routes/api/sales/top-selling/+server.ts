import { db } from '$lib/server/db'
import { items, saleItems } from '$lib/server/db'
import { eq, desc, sql, sum } from 'drizzle-orm'
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
    const topSelling = await db.select({
      itemId: saleItems.itemId,
      itemName: items.name,
      totalQuantity: sum(saleItems.quantity).mapWith(Number),
      totalRevenue: sum(saleItems.totalPrice).mapWith(Number)
    })
    .from(saleItems)
    .innerJoin(items, eq(saleItems.itemId, items.id))
    .groupBy(sql`${saleItems.itemId}, ${items.name}`)
    .orderBy(desc(sum(saleItems.quantity)))
    .limit(limit)
    
    return json({ success: true, data: topSelling })
  } catch (error) {
    console.error('Top selling error:', error)
    return json({ success: true, data: [] })
  }
}
