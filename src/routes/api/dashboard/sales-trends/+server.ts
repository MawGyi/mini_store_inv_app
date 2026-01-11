import { db } from '$lib/server/db'
import { sales } from '$lib/server/db'
import { gte, asc, sql, sum, count } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

function isDbAvailable() {
  return db !== null
}

export async function GET({ url }: { url: URL }) {
  if (!isDbAvailable()) {
    return json({ success: true, data: [] })
  }

  const days = parseInt(url.searchParams.get('days') || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  try {
    const salesTrends = await db.select({
      date: sql<string>`DATE_TRUNC('day', ${sales.saleDate})::date`.as('date'),
      totalSales: sum(sales.totalAmount).mapWith(Number),
      transactionCount: count()
    })
    .from(sales)
    .where(gte(sales.saleDate, startDate))
    .groupBy(sql`DATE_TRUNC('day', ${sales.saleDate})::date`)
    .orderBy(asc(sql`DATE_TRUNC('day', ${sales.saleDate})::date`))
    
    return json({ success: true, data: salesTrends })
  } catch (error) {
    console.error('Sales trends error:', error)
    return json({ success: true, data: [] })
  }
}
