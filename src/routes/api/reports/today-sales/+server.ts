import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales } from '$lib/server/db'
import { gte, lte, sql, sum, count } from 'drizzle-orm'

function isDbAvailable() {
  return db !== null
}

export const GET: RequestHandler = async ({ url }) => {
  if (!isDbAvailable()) {
    return json({ success: false, error: 'Database not available' }, { status: 503 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySalesData = await db.select({
      totalSales: sum(sales.totalAmount).mapWith(Number),
      transactionCount: count()
    })
      .from(sales)
      .where(sql`${sales.saleDate} >= ${today} AND ${sales.saleDate} < ${tomorrow}`)

    const result = todaySalesData[0]

    return json({
      success: true,
      data: {
        totalSales: result?.totalSales || 0,
        transactionCount: result?.transactionCount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching today sales:', error)
    return json({ success: false, error: 'Failed to fetch today sales' }, { status: 500 })
  }
}
