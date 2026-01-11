import { sql as sqlClient } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { serial, text, integer, real, timestamp, pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const hasConnectionString = !!process.env.POSTGRES_URL || !!process.env.VERCEL_URL

let dbInstance: any

if (hasConnectionString) {
  dbInstance = drizzle(sqlClient)
} else {
  console.log('No database connection string found - running in demo mode')
  dbInstance = null
}

export const db = dbInstance

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  itemCode: text('item_code').unique().notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull(),
  category: text('category'),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  saleDate: timestamp('sale_date').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  customerName: text('customer_name'),
  invoiceNumber: text('invoice_number').unique().notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id),
  itemId: integer('item_id').references(() => items.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull()
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
  createdAt: timestamp('created_at').notNull()
})

let initialized = false

export async function initializeDatabase() {
  if (!db) {
    console.log('Database not available - skipping initialization')
    return
  }

  if (initialized) return
  initialized = true
  
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      item_code TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL,
      low_stock_threshold INTEGER NOT NULL,
      category TEXT,
      expiry_date TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )`)
    
    await db.execute(sql`CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      sale_date TIMESTAMP NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      customer_name TEXT,
      invoice_number TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )`)
    
    await db.execute(sql`CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id),
      item_id INTEGER REFERENCES items(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    )`)
    
    await db.execute(sql`CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP NOT NULL
    )`)
    
    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}
