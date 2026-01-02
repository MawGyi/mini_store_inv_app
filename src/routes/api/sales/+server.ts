import { db } from '$lib/server/db'
import { items, sales, saleItems } from '$lib/server/db/schema'
import { eq, desc, sql, gte, sum, count } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import type { SaleWithItems } from '$lib/types'

function generateInvoiceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

export async function GET({ url }: { url: URL }) {
  try {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
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
    .limit(limit)
    .offset(offset)
    
    const [totalResult] = await db.select({ count: count() }).from(sales)
    const total = totalResult?.count || 0
    
    return json({
      success: true,
      data: allSales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return json({ success: false, error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json()
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return json({ success: false, error: 'At least one item is required' }, { status: 400 })
    }
    
    if (!body.paymentMethod || !['cash', 'credit', 'mobile_payment'].includes(body.paymentMethod)) {
      return json({ success: false, error: 'Invalid payment method' }, { status: 400 })
    }
    
    let totalAmount = 0
    const saleItemsData = []
    
    for (const item of body.items) {
      totalAmount += item.totalPrice
      
      const itemExists = await db.select().from(items).where(eq(items.id, item.itemId)).get()
      if (!itemExists) {
        return json({ success: false, error: `Item with ID ${item.itemId} not found` }, { status: 400 })
      }
      
      if (itemExists.stockQuantity < item.quantity) {
        return json({ 
          success: false, 
          error: `Insufficient stock for ${itemExists.name}. Available: ${itemExists.stockQuantity}` 
        }, { status: 400 })
      }
      
      saleItemsData.push(item)
    }
    
    const invoiceNumber = generateInvoiceNumber()
    
    const saleResult = await db.insert(sales).values({
      saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
      totalAmount,
      paymentMethod: body.paymentMethod,
      customerName: body.customerName || null,
      invoiceNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    
    const saleId = saleResult[0].id
    
    for (const item of saleItemsData) {
      await db.insert(saleItems).values({
        saleId,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })
      
      await db.update(items)
        .set({
          stockQuantity: sql`${items.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(items.id, item.itemId))
    }
    
    const createdSale = await db.select().from(sales).where(eq(sales.id, saleId)).get()
    const createdSaleItems = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId))
    
    return json({
      success: true,
      data: { ...createdSale!, items: createdSaleItems }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return json({ success: false, error: 'Failed to create sale' }, { status: 500 })
  }
}
