import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  itemCode: text('item_code').unique().notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  category: text('category'),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleDate: integer('sale_date', { mode: 'timestamp' }).notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  customerName: text('customer_name'),
  invoiceNumber: text('invoice_number').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').references(() => sales.id),
  itemId: integer('item_id').references(() => items.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull()
})

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
