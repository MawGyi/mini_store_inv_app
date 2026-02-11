import { db } from '$lib/server/db'
import { items, sales, saleItems } from '$lib/server/db'
import { eq, desc, sql, gte, sum, count, asc, and, lte } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

interface DashboardAlert {
  type: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  itemId?: number
  itemCode?: string
  name?: string
  stockQuantity?: number
  expiryDate?: Date
  daysUntilExpiry?: number
}

function isDbAvailable() {
  return db !== null
}

export async function GET() {
  if (!isDbAvailable()) {
    return json({ success: true, data: [] })
  }

  try {
    const alerts: DashboardAlert[] = []

    const allItems = await db.select({
      id: items.id,
      name: items.name,
      itemCode: items.itemCode,
      stockQuantity: items.stockQuantity,
      lowStockThreshold: items.lowStockThreshold,
      updatedAt: items.updatedAt,
      expiryDate: items.expiryDate
    }).from(items)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const recentSales = await db.select({
      saleId: saleItems.saleId,
      itemId: saleItems.itemId
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.saleDate, thirtyDaysAgo.getTime()))

    const soldItemIds = new Set(recentSales.map((s: any) => s.itemId))

    for (const item of allItems) {
      if (item.stockQuantity === 0) {
        alerts.push({
          type: 'out_of_stock',
          message: `${item.name} is out of stock`,
          severity: 'critical',
          itemId: item.id,
          itemCode: item.itemCode,
          name: item.name,
          stockQuantity: item.stockQuantity
        })
      } else if (item.stockQuantity <= item.lowStockThreshold) {
        const severity = item.stockQuantity <= 2 ? 'critical' :
          item.stockQuantity <= Math.floor(item.lowStockThreshold / 2) ? 'high' : 'medium'
        alerts.push({
          type: 'low_stock',
          message: `${item.name} is running low (${item.stockQuantity} remaining)`,
          severity: severity as 'critical' | 'high' | 'medium',
          itemId: item.id,
          itemCode: item.itemCode,
          name: item.name,
          stockQuantity: item.stockQuantity
        })
      } else if (item.stockQuantity > 0 && !soldItemIds.has(item.id)) {
        alerts.push({
          type: 'slow_moving',
          message: `${item.name} hasn't sold in 30 days`,
          severity: 'low',
          itemId: item.id,
          itemCode: item.itemCode,
          name: item.name,
          stockQuantity: item.stockQuantity
        })
      }

      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
          alerts.push({
            type: 'expired',
            message: `${item.name} has expired`,
            severity: 'critical',
            itemId: item.id,
            itemCode: item.itemCode,
            name: item.name,
            stockQuantity: item.stockQuantity,
            expiryDate: item.expiryDate,
            daysUntilExpiry: daysUntilExpiry
          })
        } else if (daysUntilExpiry <= 30) {
          const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 14 ? 'high' : 'medium'
          alerts.push({
            type: 'expiring_soon',
            message: `${item.name} expires in ${daysUntilExpiry} days`,
            severity: severity as 'critical' | 'high' | 'medium',
            itemId: item.id,
            itemCode: item.itemCode,
            name: item.name,
            stockQuantity: item.stockQuantity,
            expiryDate: item.expiryDate,
            daysUntilExpiry: daysUntilExpiry
          })
        }
      }
    }

    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return 0
    })

    return json({ success: true, data: sortedAlerts })
  } catch (error) {
    console.error('Alerts error:', error)
    return json({ success: true, data: [] })
  }
}
