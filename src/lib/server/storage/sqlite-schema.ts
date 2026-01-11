import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// SQLite Schema Definitions
export const sqliteItems = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  itemCode: text('item_code').unique().notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  category: text('category'),
  expiryDate: text('expiry_date'),
  createdAt: text('created_at').notNull().default(''),
  updatedAt: text('updated_at').notNull().default('')
})

export const sqliteSales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleDate: text('sale_date').notNull().default(''),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  customerName: text('customer_name'),
  invoiceNumber: text('invoice_number').unique().notNull(),
  createdAt: text('created_at').notNull().default(''),
  updatedAt: text('updated_at').notNull().default('')
})

export const sqliteSaleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').references(() => sqliteSales.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').references(() => sqliteItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull()
})

export const sqliteCategories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  createdAt: text('created_at').notNull().default('')
})

export const sqliteSchema = {
  items: sqliteItems,
  sales: sqliteSales,
  saleItems: sqliteSaleItems,
  categories: sqliteCategories
}