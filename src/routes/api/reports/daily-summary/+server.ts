import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales, saleItems } from '$lib/server/db'
import { gte, asc, sql, sum, count } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')

    const endDate = endDateParam ? new Date(endDateParam).getTime() : Date.now()
    const startDate = startDateParam 
      ? new Date(startDateParam).getTime()
      : endDate - (days * 24 * 60 * 60 * 1000)

    const dailyData = await db.select({
      date: sql<string>`DATE(${sales.saleDate} / 1000, 'unixepoch')`.as('date'),
      totalSales: sum(sales.totalAmount).mapWith(Number),
      transactionCount: count()
    })
      .from(sales)
      .where(sql`${sales.saleDate} >= ${startDate} AND ${sales.saleDate} < ${endDate}`)
      .groupBy(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`)
      .orderBy(asc(sql`DATE(${sales.saleDate} / 1000, 'unixepoch')`))

    const totalRevenue = dailyData.reduce((sum, d) => sum + (d.totalSales || 0), 0)
    const totalTransactions = dailyData.reduce((sum, d) => sum + (d.transactionCount || 0), 0)
    const avgDailySales = dailyData.length > 0 ? totalRevenue / dailyData.length : 0
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    return json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100
      },
      daily: dailyData.map(d => ({
        date: d.date,
        totalSales: d.totalSales || 0,
        transactionCount: d.transactionCount || 0,
        avgSaleValue: d.transactionCount ? Math.round(((d.totalSales || 0) / d.transactionCount) * 100) / 100 : 0
      }))
    })
  } catch (error) {
    console.error('Error generating daily summary report:', error)
    return json({ error: 'Failed to generate daily summary report' }, { status: 500 })
  }
}
