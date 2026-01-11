import { db } from '$lib/server/db'
import { sales } from '$lib/server/db'
import { sql } from 'drizzle-orm'
import { json } from '@sveltejs/kit'

function isDbAvailable() {
  return db !== null
}

export async function GET({ url }: { url: URL }) {
  if (!isDbAvailable()) {
    return json({ success: true, data: [] })
  }

  const days = parseInt(url.searchParams.get('days') || '7')
  const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
  
  try {
    const allSales = await db.select({
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount
    })
    .from(sales)
    .where(sql`${sales.saleDate} >= ${startDate}`)

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

    const salesTrends = Object.entries(salesByDay)
      .map(([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.transactionCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return json({ success: true, data: salesTrends })
  } catch (error) {
    console.error('Sales trends error:', error)
    return json({ success: true, data: [] })
  }
}
