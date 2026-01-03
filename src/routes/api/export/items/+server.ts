import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'

export const GET: RequestHandler = async () => {
  try {
    const allItems = await db.select({
      id: items.id,
      name: items.name,
      itemCode: items.itemCode,
      price: items.price,
      stockQuantity: items.stockQuantity,
      lowStockThreshold: items.lowStockThreshold,
      category: items.category,
      expiryDate: items.expiryDate,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt
    })
      .from(items)
      .orderBy(desc(items.id))

    const csvHeader = 'ID,Name,Item Code,Price,Stock Quantity,Low Stock Threshold,Category,Expiry Date,Created At,Updated At\n'
    
    const csvRows = allItems.map(item => {
      const expiryDate = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
      const createdAt = item.createdAt ? new Date(item.createdAt).toISOString() : ''
      const updatedAt = item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
      
      return [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.itemCode.replace(/"/g, '""')}"`,
        item.price,
        item.stockQuantity,
        item.lowStockThreshold,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        expiryDate,
        createdAt,
        updatedAt
      ].join(',')
    })

    const csv = csvHeader + csvRows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="items_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting items:', error)
    return json({ error: 'Failed to export items' }, { status: 500 })
  }
}
