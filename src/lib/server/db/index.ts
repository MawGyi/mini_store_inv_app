import { createClient, type Client } from '@libsql/client'
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/libsql'

const isLocal = process.env.DATABASE_TYPE === 'sqlite' || !process.env.POSTGRES_URL

let dbInstance: any
let libsqlClient: Client | null = null

if (isLocal) {
  console.log('Using local SQLite database (file:sqlite.db)')
  libsqlClient = createClient({
    url: 'file:sqlite.db',
  })
} else if (process.env.TURSO_DATABASE_URL) {
  console.log('Using Turso/libsql database')
  libsqlClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
} else {
  console.log('Using Neon Postgres via libsql')
  libsqlClient = createClient({
    url: `libsql://${process.env.POSTGRES_HOST}`,
    authToken: process.env.POSTGRES_PASSWORD,
  })
}

if (libsqlClient) {
  dbInstance = drizzle(libsqlClient)
}

export const db = dbInstance

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  itemCode: text('item_code').unique().notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  category: text('category'),
  expiryDate: integer('expiry_date'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleDate: integer('sale_date').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  customerName: text('customer_name'),
  invoiceNumber: text('invoice_number').unique().notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
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
  createdAt: integer('created_at').notNull()
})

let initialized = false

export async function initializeDatabase() {
  if (!libsqlClient) {
    console.log('Database not available - skipping initialization')
    return
  }

  if (initialized) return
  initialized = true

  try {
    await libsqlClient.execute('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, item_code TEXT UNIQUE NOT NULL, price REAL NOT NULL, stock_quantity INTEGER NOT NULL, low_stock_threshold INTEGER NOT NULL, category TEXT, expiry_date INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await libsqlClient.execute('CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date INTEGER NOT NULL, total_amount REAL NOT NULL, payment_method TEXT NOT NULL, customer_name TEXT, invoice_number TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await libsqlClient.execute('CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER REFERENCES sales(id), item_id INTEGER REFERENCES items(id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total_price REAL NOT NULL)')
    
    await libsqlClient.execute('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL)')
    
    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

export async function clearAllData() {
  if (!libsqlClient) return
  await libsqlClient.execute('DELETE FROM sale_items')
  await libsqlClient.execute('DELETE FROM sales')
  await libsqlClient.execute('DELETE FROM items')
  await libsqlClient.execute('DELETE FROM categories')
}
