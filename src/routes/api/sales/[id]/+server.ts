import { db } from '$lib/server/db'
import { sales, saleItems, items } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import type { SaleWithItems } from '$lib/types'

export async function GET({ params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid sale ID' }, { status: 400 })
    }

    const sale = await db.select().from(sales).where(eq(sales.id, id)).get()
    if (!sale) {
      return json({ success: false, error: 'Sale not found' }, { status: 404 })
    }

    const saleItemsList = await db.select({
      id: saleItems.id,
      saleId: saleItems.saleId,
      itemId: saleItems.itemId,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      totalPrice: saleItems.totalPrice,
      itemName: items.name
    })
    .from(saleItems)
    .innerJoin(items, eq(saleItems.itemId, items.id))
    .where(eq(saleItems.saleId, id))
    .then(items => items.map(item => ({
      ...item,
      saleId: item.saleId || id,
      itemId: item.itemId || 0
    })))

    const saleWithItems: SaleWithItems = {
      id: sale.id,
      saleDate: sale.saleDate,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod as 'cash' | 'credit' | 'mobile_payment',
      customerName: sale.customerName,
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: saleItemsList
    }

    return json({ success: true, data: saleWithItems })
  } catch (error) {
    console.error('Error fetching sale:', error)
    return json({ success: false, error: 'Failed to fetch sale' }, { status: 500 })
  }
}
