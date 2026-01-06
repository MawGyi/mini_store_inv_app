import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

let dbPath: string = 'sqlite.db'
let isNode = false

function getDbPath(): string {
  if (!isNode) return dbPath
  try {
    const { resolve } = require('path')
    dbPath = resolve('sqlite.db')
    return dbPath
  } catch {
    return dbPath
  }
}

const client = createClient({
  url: `file:${getDbPath()}`
})

export const db = drizzle(client, { schema })

export async function initializeDatabase() {
  if (typeof window !== 'undefined') return
  if (!isNode) {
    try {
      require.resolve('fs')
      isNode = true
    } catch {
      return
    }
  }
  
  try {
    const { existsSync, writeFileSync } = require('fs')
    const path = require('path')
    const dbPathResolved = path.resolve('sqlite.db')
    
    if (!existsSync(dbPathResolved)) {
      writeFileSync(dbPathResolved, new Uint8Array([]))
    }
    
    await client.execute('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, item_code TEXT UNIQUE NOT NULL, price REAL NOT NULL, stock_quantity INTEGER NOT NULL, low_stock_threshold INTEGER NOT NULL, category TEXT, expiry_date INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date INTEGER NOT NULL, total_amount REAL NOT NULL, payment_method TEXT NOT NULL, customer_name TEXT, invoice_number TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER, item_id INTEGER, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total_price REAL NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL)')
    
    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

export { client }
