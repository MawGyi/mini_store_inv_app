import { serial, text, integer, real, timestamp, pgTable } from 'drizzle-orm/pg-core'

// PostgreSQL Schema Definitions
export const pgItems = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  itemCode: text('item_code').unique().notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  category: text('category'),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const pgSales = pgTable('sales', {
  id: serial('id').primaryKey(),
  saleDate: timestamp('sale_date').notNull().defaultNow(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  customerName: text('customer_name'),
  invoiceNumber: text('invoice_number').unique().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const pgSaleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => pgSales.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').references(() => pgItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull()
})

export const pgCategories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const pgSchema = {
  items: pgItems,
  sales: pgSales,
  saleItems: pgSaleItems,
  categories: pgCategories
}