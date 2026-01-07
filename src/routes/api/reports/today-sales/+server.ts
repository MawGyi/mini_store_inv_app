import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales } from '$lib/server/db/schema'
import { gte, sql, sum, count } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowTimestamp = tomorrow.getTime()

    const todaySalesData = await db.select({
      totalSales: sum(sales.totalAmount).mapWith(Number),
      transactionCount: count()
    })
      .from(sales)
      .where(sql`${sales.saleDate} >= ${todayTimestamp} AND ${sales.saleDate} < ${tomorrowTimestamp}`)

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
