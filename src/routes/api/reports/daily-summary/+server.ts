import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales, saleItems } from '$lib/server/db'
import { gte, asc, sql, sum, count, and, lte } from 'drizzle-orm'

function isDbAvailable() {
  return db !== null
}

export const GET: RequestHandler = async ({ url }) => {
  if (!isDbAvailable()) {
    return json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')

    const now = new Date()
    const endDate = endDateParam ? new Date(endDateParam) : now
    const startDate = startDateParam 
      ? new Date(startDateParam)
      : new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

    const startMs = startDate.getTime()
    const endMs = endDate.getTime()

    const allSales = await db.select({
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount
    })
      .from(sales)
      .where(sql`${sales.saleDate} >= ${startMs} AND ${sales.saleDate} <= ${endMs}`)

    const salesByDay: Record<string, { totalSales: number; transactionCount: number }> = {}
    
    for (const sale of allSales) {
      const saleDate = sale.saleDate as number
      const date = new Date(saleDate)
      const dayKey = date.toISOString().split('T')[0]
      
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { totalSales: 0, transactionCount: 0 }
      }
      salesByDay[dayKey].totalSales += sale.totalAmount || 0
      salesByDay[dayKey].transactionCount += 1
    }

    const dailyData = Object.entries(salesByDay)
      .map(([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.transactionCount,
        avgSaleValue: Math.round((data.totalSales / data.transactionCount) * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalRevenue = dailyData.reduce((sum, d) => sum + d.totalSales, 0)
    const totalTransactions = dailyData.reduce((sum, d) => sum + d.transactionCount, 0)
    const avgDailySales = dailyData.length > 0 ? totalRevenue / dailyData.length : 0
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    return json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100
      },
      daily: dailyData
    })
  } catch (error) {
    console.error('Error generating daily summary report:', error)
    return json({ error: 'Failed to generate daily summary report' }, { status: 500 })
  }
}
