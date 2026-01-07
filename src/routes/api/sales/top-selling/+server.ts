import { db } from '$lib/server/db'
import { items, saleItems } from '$lib/server/db'
import { eq, desc, sql, sum } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

export async function GET({ url }: { url: URL }) {
  const limit = parseInt(url.searchParams.get('limit') || '5')
  
  const topSelling = await db.select({
    itemId: saleItems.itemId,
    itemName: items.name,
    totalQuantity: sum(saleItems.quantity).mapWith(Number),
    totalRevenue: sum(saleItems.totalPrice).mapWith(Number)
  })
  .from(saleItems)
  .innerJoin(items, eq(saleItems.itemId, items.id))
  .groupBy(saleItems.itemId)
  .orderBy(desc(sum(saleItems.quantity)))
  .limit(limit)
  
  return json({ success: true, data: topSelling })
}
