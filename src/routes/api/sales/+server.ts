import { db } from '$lib/server/db'
import { items, sales, saleItems } from '$lib/server/db'
import { eq, desc, sql, count } from 'drizzle-orm'
import { json } from '@sveltejs/kit'
import type { SaleWithItems } from '$lib/types'
import { SaleSchema, formatZodError } from '$lib/validators'
import type { SaleInput } from '$lib/validators'

function generateInvoiceNumber(): string {
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
    const body: unknown = await request.json()
    
    const parseResult = SaleSchema.safeParse(body)
    
    if (!parseResult.success) {
      const errors = formatZodError(parseResult.error)
      return json({
        success: false,
        error: 'Validation failed',
        validationErrors: errors
      }, { status: 400 })
    }

    const req = parseResult.data as SaleInput
    const invoiceNumber = generateInvoiceNumber()

    interface SaleItemData {
      itemId: number
      quantity: number
      unitPrice: number
      totalPrice: number
      name: string
      currentStock: number
    }

    interface SaleResult {
      sale: {
        id: number
        saleDate: Date
        totalAmount: number
        paymentMethod: string
        customerName: string | null
        invoiceNumber: string
        createdAt: Date
        updatedAt: Date
      } | undefined
      items: Array<{
        id: number
        saleId: number
        itemId: number
        itemName: string
        quantity: number
        unitPrice: number
        totalPrice: number
      }>
    }

    const result = await db.transaction(async (tx): Promise<SaleResult> => {
      const saleItemsData: SaleItemData[] = []
      let totalAmount = 0

      for (const item of req.items) {
        const itemResults = await tx
          .select({
            id: items.id,
            name: items.name,
            stockQuantity: items.stockQuantity
          })
          .from(items)
          .where(eq(items.id, item.itemId))
          .limit(1)

        const itemExists = itemResults[0]

        if (!itemExists) {
          throw new Error(`Item with ID ${item.itemId} not found`)
        }

        if (itemExists.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${itemExists.name}. Available: ${itemExists.stockQuantity}, Requested: ${item.quantity}`
          )
        }

        const newStockQuantity = itemExists.stockQuantity - item.quantity
        if (newStockQuantity < 0) {
          throw new Error(
            `Transaction would result in negative stock for ${itemExists.name}. Current: ${itemExists.stockQuantity}, Would subtract: ${item.quantity}`
          )
        }

        saleItemsData.push({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          name: itemExists.name,
          currentStock: itemExists.stockQuantity
        })

        totalAmount += item.totalPrice
      }

      const saleDate = req.saleDate ? new Date(req.saleDate) : new Date()
      const now = new Date()

      const saleResult = await tx.insert(sales).values({
        saleDate,
        totalAmount,
        paymentMethod: req.paymentMethod,
        customerName: req.customerName || null,
        invoiceNumber,
        createdAt: now,
        updatedAt: now
      }).returning()

      const saleId = saleResult[0].id

      for (const item of saleItemsData) {
        await tx.insert(saleItems).values({
          saleId,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })

        await tx
          .update(items)
          .set({
            stockQuantity: sql`${items.stockQuantity} - ${item.quantity}`,
            updatedAt: now
          })
          .where(eq(items.id, item.itemId))
      }

      const createdSaleResult = await tx
        .select({
          id: sales.id,
          saleDate: sales.saleDate,
          totalAmount: sales.totalAmount,
          paymentMethod: sales.paymentMethod,
          customerName: sales.customerName,
          invoiceNumber: sales.invoiceNumber,
          createdAt: sales.createdAt,
          updatedAt: sales.updatedAt
        })
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1)

      const createdSale = createdSaleResult[0]

      const createdSaleItems = await tx
        .select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          itemId: saleItems.itemId,
          itemName: items.name,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice
        })
        .from(saleItems)
        .innerJoin(items, eq(saleItems.itemId, items.id))
        .where(eq(saleItems.saleId, saleId))
        .then((rows: Array<{
          id: number
          saleId: number | null
          itemId: number | null
          itemName: string
          quantity: number
          unitPrice: number
          totalPrice: number
        }>) =>
          rows.map((row) => ({
            id: row.id,
            saleId: row.saleId ?? saleId,
            itemId: row.itemId ?? 0,
            itemName: row.itemName,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            totalPrice: row.totalPrice
          }))
        )

      return {
        sale: createdSale,
        items: createdSaleItems
      }
    })

    return json({
      success: true,
      data: {
        ...result.sale!,
        items: result.items
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create sale'
    return json({ success: false, error: errorMessage }, { status: 400 })
  }
}
