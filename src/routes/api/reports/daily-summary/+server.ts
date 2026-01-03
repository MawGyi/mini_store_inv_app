import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'

interface DailySummary {
  date: string
  totalSales: number
  transactionCount: number
  avgSaleValue: number
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const days = parseInt(url.searchParams.get('days') || '30')

    let allSales = await db.select({
      id: sales.id,
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount,
      createdAt: sales.createdAt
    })
      .from(sales)
      .orderBy(desc(sales.saleDate))

    let filteredSales = allSales
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filteredSales = filteredSales.filter(s => {
        const saleTime = s.saleDate ? s.saleDate.getTime() : 0
        return saleTime >= start && saleTime < end
      })
    } else {
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
      filteredSales = filteredSales.filter(s => {
        const saleTime = s.saleDate ? s.saleDate.getTime() : 0
        return saleTime >= cutoff
      })
    }

    const salesByDate: Record<string, { total: number; count: number }> = {}
    for (const sale of filteredSales) {
      const date = sale.saleDate 
        ? new Date(sale.saleDate).toISOString().split('T')[0] 
        : 'Unknown'
      if (!salesByDate[date]) {
        salesByDate[date] = { total: 0, count: 0 }
      }
      salesByDate[date].total += sale.totalAmount
      salesByDate[date].count += 1
    }

    const dailySummaries: DailySummary[] = Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        totalSales: Math.round(data.total * 100) / 100,
        transactionCount: data.count,
        avgSaleValue: Math.round((data.total / data.count) * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const overallTotal = dailySummaries.reduce((sum, d) => sum + d.totalSales, 0)
    const overallTransactions = dailySummaries.reduce((sum, d) => sum + d.transactionCount, 0)
    const overallAvg = overallTransactions > 0 ? overallTotal / overallTransactions : 0

    return json({
      summary: {
        totalRevenue: Math.round(overallTotal * 100) / 100,
        totalTransactions: overallTransactions,
        avgDailySales: Math.round((overallTotal / Math.max(dailySummaries.length, 1)) * 100) / 100,
        avgTransactionValue: Math.round(overallAvg * 100) / 100,
        dayCount: dailySummaries.length
      },
      daily: dailySummaries
    })
  } catch (error) {
    console.error('Error generating daily summary report:', error)
    return json({ error: 'Failed to generate daily summary report' }, { status: 500 })
  }
}
