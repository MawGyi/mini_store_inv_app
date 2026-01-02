import { db } from '$lib/server/db'
import { items, sales } from '$lib/server/db/schema'
import { eq, desc, sql, gte, sum, count, asc } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import type { DashboardOverview } from '$lib/types'

export async function GET() {
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
  
  const [lowStockItems] = await db.select({
    count: count()
  }).from(items)
    .where(sql`${items.stockQuantity} <= ${items.lowStockThreshold}`)
  
  const [todaySales] = await db.select({
    total: sum(sales.totalAmount).mapWith(Number)
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
  
  const overview: DashboardOverview = {
    totalSales: totalSalesResult?.total || 0,
    totalTransactions: totalTransactions?.count || 0,
    totalItems: totalItemsResult?.total || 0,
    lowStockItems: lowStockItems?.count || 0,
    todaySales: todaySales?.total || 0,
    weekSales: weekSales?.total || 0,
    monthSales: monthSales?.total || 0
  }
  
  return json({ success: true, data: overview })
}
