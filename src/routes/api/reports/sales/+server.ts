import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales, saleItems } from '$lib/server/db'
import { desc, eq } from 'drizzle-orm'

function isDbAvailable() {
  return db !== null
}

export const GET: RequestHandler = async ({ url }) => {
  if (!isDbAvailable()) {
    return json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const paymentMethod = url.searchParams.get('paymentMethod')

    const allSales = await db.select({
      id: sales.id,
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount,
      paymentMethod: sales.paymentMethod,
      customerName: sales.customerName,
      invoiceNumber: sales.invoiceNumber,
      createdAt: sales.createdAt
    })
      .from(sales)
      .orderBy(desc(sales.saleDate))

    let filteredSales = allSales
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filteredSales = filteredSales.filter((s: { saleDate: Date | null }) => {
        const saleTime = s.saleDate ? s.saleDate.getTime() : 0
        return saleTime >= start && saleTime < end
      })
    }

    if (paymentMethod) {
      filteredSales = filteredSales.filter((s: { paymentMethod: string }) => s.paymentMethod === paymentMethod)
    }

    let totalAmount = 0
    let totalTransactions = filteredSales.length
    let itemsSold = 0

    for (const sale of filteredSales) {
      totalAmount += sale.totalAmount
      const saleItemsData = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id))
      itemsSold += saleItemsData.reduce((sum: number, si: { quantity: number }) => sum + si.quantity, 0)
    }

    const byPaymentMethod: Record<string, number> = {}
    for (const sale of filteredSales) {
      byPaymentMethod[sale.paymentMethod] = (byPaymentMethod[sale.paymentMethod] || 0) + 1
    }

    const avgSaleValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0

    return json({
      summary: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalTransactions,
        itemsSold,
        avgSaleValue: Math.round(avgSaleValue * 100) / 100,
        byPaymentMethod
      },
      sales: filteredSales.slice(0, 100)
    })
  } catch (error) {
    console.error('Error generating sales report:', error)
    return json({ error: 'Failed to generate sales report' }, { status: 500 })
  }
}
