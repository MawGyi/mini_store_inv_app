import { db } from '$lib/server/db'
import { sales } from '$lib/server/db'
import { gte, asc, sql, sum, count } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

export async function GET({ url }: { url: URL }) {
  const days = parseInt(url.searchParams.get('days') || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const salesTrends = await db.select({
    date: sql<string>`DATE(${sales.saleDate} / 1000, 'unixepoch')`.as('date'),
    totalSales: sum(sales.totalAmount).mapWith(Number),
    transactionCount: count()
  })
  .from(sales)
  .where(gte(sales.saleDate, startDate))
  .groupBy(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`)
  .orderBy(asc(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`))
  
  return json({ success: true, data: salesTrends })
}
