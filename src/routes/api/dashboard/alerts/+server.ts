import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { sql, asc } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

export async function GET() {
  const alerts: Array<{ 
    type: string; 
    message: string; 
    severity: string;
    itemId: number;
    itemCode: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }> = []
  
  const lowStock = await db.select().from(items)
    .where(sql`${items.stockQuantity} <= ${items.lowStockThreshold}`)
    .orderBy(asc(items.stockQuantity))
    .limit(10)
  
  for (const item of lowStock) {
    alerts.push({
      type: 'low_stock',
      message: `${item.name} (${item.itemCode}) - Stock: ${item.stockQuantity}`,
      severity: item.stockQuantity === 0 ? 'critical' : 'warning',
      itemId: item.id,
      itemCode: item.itemCode,
      name: item.name,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold
    })
  }
  
  return json({ success: true, data: alerts })
}
