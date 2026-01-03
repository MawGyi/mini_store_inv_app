import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { sales, saleItems, items } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

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
      filteredSales = allSales.filter(s => {
        const saleTime = s.saleDate ? s.saleDate.getTime() : 0
        return saleTime >= start && saleTime < end
      })
    }

    const csvHeader = 'ID,Date,Invoice Number,Customer,Payment Method,Total Amount,Created At\n'
    
    const csvRows = filteredSales.map(sale => {
      const saleDate = sale.saleDate ? sale.saleDate.toISOString() : ''
      const createdAt = sale.createdAt ? sale.createdAt.toISOString() : ''
      
      return [
        sale.id,
        saleDate,
        `"${(sale.invoiceNumber || '').replace(/"/g, '""')}"`,
        `"${(sale.customerName || '').replace(/"/g, '""')}"`,
        sale.paymentMethod,
        sale.totalAmount,
        createdAt
      ].join(',')
    })

    const csv = csvHeader + csvRows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting sales:', error)
    return json({ error: 'Failed to export sales' }, { status: 500 })
  }
}
