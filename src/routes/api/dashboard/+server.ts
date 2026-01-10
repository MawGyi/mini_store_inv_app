import { db } from '$lib/server/db'
import { items, sales, saleItems, categories } from '$lib/server/db'
import { eq, desc, sql, gte, sum, count, asc, and, lte } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import type { DashboardOverview, SalesSummary, TopSellingItem } from '$lib/types'

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

export async function GET({ url }: { url: URL }) {
  const action = url.searchParams.get('action') || 'overview'

  try {
    switch (action) {
      case 'overview':
        return await handleOverview()
      case 'alerts':
        return await handleAlerts()
      default:
        return json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    return json({ 
      success: false, 
      error: 'Database connection failed. Please ensure Vercel Postgres is configured.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

async function handleOverview() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  
  const [totalSalesResult] = await db.select({
    total: sum(sales.totalAmount).mapWith(Number)
  }).from(sales)
  
  const [totalTransactions] = await db.select({
    count: count()
  }).from(sales)
  
  const [totalItemsResult] = await db.select({
    total: sum(items.stockQuantity).mapWith(Number)
  }).from(items)
  
  const [itemCountResult] = await db.select({
    count: count()
  }).from(items)
  
  const [lowStockItems] = await db.select({
    count: count()
  }).from(items)
    .where(sql`${items.stockQuantity} <= ${items.lowStockThreshold}`)
  
  const [outOfStockItems] = await db.select({
    count: count()
  }).from(items)
    .where(eq(items.stockQuantity, 0))
  
  const [todaySales] = await db.select({
    total: sum(sales.totalAmount).mapWith(Number)
  }).from(sales)
    .where(gte(sales.saleDate, today))
  
  const [todayTransactionCount] = await db.select({
    count: count()
  }).from(sales)
    .where(gte(sales.saleDate, today))
  
  const [weekSales] = await db.select({
    total: sum(sales.totalAmount).mapWith(Number)
  }).from(sales)
    .where(gte(sales.saleDate, weekAgo))
  
  const [monthSales] = await db.select({
    total: sum(sales.totalAmount).mapWith(Number)
  }).from(sales)
    .where(gte(sales.saleDate, monthAgo))
  
  const [recentSales] = await db.select({
    id: sales.id,
    saleDate: sales.saleDate,
    totalAmount: sales.totalAmount,
    invoiceNumber: sales.invoiceNumber,
    customerName: sales.customerName
  })
  .from(sales)
  .orderBy(desc(sales.saleDate))
  .limit(5)
  
  const overview: DashboardOverview = {
    totalSales: totalSalesResult?.total || 0,
    totalTransactions: totalTransactions?.count || 0,
    totalItems: itemCountResult?.count || 0,
    lowStockItems: lowStockItems?.count || 0,
    todaySales: todaySales?.total || 0,
    weekSales: weekSales?.total || 0,
    monthSales: monthSales?.total || 0
  }
  
  return json({
    success: true,
    data: {
      overview,
      inventory: {
        totalItems: itemCountResult?.count || 0,
        totalCategories: 0,
        lowStockItems: lowStockItems?.count || 0,
        outOfStockItems: outOfStockItems?.count || 0,
        totalValue: totalItemsResult?.total || 0
      },
      sales: {
        today: {
          count: todayTransactionCount?.count || 0,
          totalAmount: todaySales?.total || 0
        },
        thisMonth: {
          count: 0,
          totalAmount: monthSales?.total || 0
        }
      },
      recentSales: recentSales || [],
      todayTransactionCount: todayTransactionCount?.count || 0
    }
  })
}

async function handleAlerts() {
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
  .where(gte(sales.saleDate, thirtyDaysAgo))
  
  const soldItemIds = new Set(recentSales.map(s => s.itemId))
  
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
}
