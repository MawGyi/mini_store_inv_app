import { createClient } from '@libsql/client'

const client = createClient({
  url: 'file:sqlite.db'
})

function generateInvoiceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

const categories = [
  'Beverages', 'Snacks', 'Groceries', 'Dairy', 'Household', 'Personal Care', 'Electronics', 'Bakery'
]

const items = [
  { name: 'Mineral Water 500ml', itemCode: 'BEV-001', price: 0.50, stockQuantity: 100, lowStockThreshold: 20, category: 'Beverages', expiryDate: null },
  { name: 'Cola Soda 330ml', itemCode: 'BEV-002', price: 1.00, stockQuantity: 80, lowStockThreshold: 15, category: 'Beverages', expiryDate: null },
  { name: 'Orange Juice 1L', itemCode: 'BEV-003', price: 2.50, stockQuantity: 40, lowStockThreshold: 10, category: 'Beverages', expiryDate: null },
  { name: 'Green Tea 250ml', itemCode: 'BEV-004', price: 1.20, stockQuantity: 15, lowStockThreshold: 20, category: 'Beverages', expiryDate: null },
  { name: 'Energy Drink 250ml', itemCode: 'BEV-005', price: 2.00, stockQuantity: 0, lowStockThreshold: 10, category: 'Beverages', expiryDate: null },
  { name: 'Potato Chips Regular', itemCode: 'SNK-001', price: 1.20, stockQuantity: 60, lowStockThreshold: 15, category: 'Snacks', expiryDate: null },
  { name: 'Chocolate Bar', itemCode: 'SNK-002', price: 0.80, stockQuantity: 100, lowStockThreshold: 25, category: 'Snacks', expiryDate: null },
  { name: 'Cookies Pack', itemCode: 'SNK-003', price: 2.00, stockQuantity: 45, lowStockThreshold: 10, category: 'Snacks', expiryDate: null },
  { name: 'Granola Bar', itemCode: 'SNK-004', price: 1.50, stockQuantity: 5, lowStockThreshold: 15, category: 'Snacks', expiryDate: null },
  { name: 'Nuts Mix 200g', itemCode: 'SNK-005', price: 4.00, stockQuantity: 30, lowStockThreshold: 10, category: 'Snacks', expiryDate: null },
  { name: 'Rice 5kg', itemCode: 'GRC-001', price: 8.00, stockQuantity: 30, lowStockThreshold: 5, category: 'Groceries', expiryDate: null },
  { name: 'Sugar 1kg', itemCode: 'GRC-002', price: 1.50, stockQuantity: 50, lowStockThreshold: 10, category: 'Groceries', expiryDate: null },
  { name: 'Cooking Oil 1L', itemCode: 'GRC-003', price: 3.00, stockQuantity: 35, lowStockThreshold: 8, category: 'Groceries', expiryDate: null },
  { name: 'Salt 1kg', itemCode: 'GRC-004', price: 0.80, stockQuantity: 60, lowStockThreshold: 15, category: 'Groceries', expiryDate: null },
  { name: 'Flour 2kg', itemCode: 'GRC-005', price: 3.50, stockQuantity: 25, lowStockThreshold: 8, category: 'Groceries', expiryDate: null },
  { name: 'Pasta Spaghetti 500g', itemCode: 'GRC-006', price: 2.00, stockQuantity: 40, lowStockThreshold: 10, category: 'Groceries', expiryDate: null },
  { name: 'Canned Beans 400g', itemCode: 'GRC-007', price: 1.50, stockQuantity: 3, lowStockThreshold: 10, category: 'Groceries', expiryDate: null },
  { name: 'Milk 1L', itemCode: 'DRY-001', price: 2.00, stockQuantity: 25, lowStockThreshold: 10, category: 'Dairy', expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'Yogurt Pack', itemCode: 'DRY-002', price: 3.50, stockQuantity: 20, lowStockThreshold: 8, category: 'Dairy', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'Eggs (12 pack)', itemCode: 'DRY-003', price: 4.00, stockQuantity: 30, lowStockThreshold: 5, category: 'Dairy', expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'Butter 250g', itemCode: 'DRY-004', price: 3.00, stockQuantity: 15, lowStockThreshold: 5, category: 'Dairy', expiryDate: null },
  { name: 'Cheese Slice Pack', itemCode: 'DRY-005', price: 5.00, stockQuantity: 0, lowStockThreshold: 8, category: 'Dairy', expiryDate: null },
  { name: 'Toilet Paper (4 rolls)', itemCode: 'HHS-001', price: 3.00, stockQuantity: 40, lowStockThreshold: 10, category: 'Household', expiryDate: null },
  { name: 'Dishwashing Liquid', itemCode: 'HHS-002', price: 2.50, stockQuantity: 25, lowStockThreshold: 5, category: 'Household', expiryDate: null },
  { name: 'Laundry Detergent', itemCode: 'HHS-003', price: 5.00, stockQuantity: 20, lowStockThreshold: 5, category: 'Household', expiryDate: null },
  { name: 'Paper Towels', itemCode: 'HHS-004', price: 2.00, stockQuantity: 35, lowStockThreshold: 10, category: 'Household', expiryDate: null },
  { name: 'Trash Bags', itemCode: 'HHS-005', price: 4.00, stockQuantity: 2, lowStockThreshold: 10, category: 'Household', expiryDate: null },
  { name: 'Shampoo 200ml', itemCode: 'PRC-001', price: 4.00, stockQuantity: 30, lowStockThreshold: 8, category: 'Personal Care', expiryDate: null },
  { name: 'Toothpaste', itemCode: 'PRC-002', price: 2.00, stockQuantity: 50, lowStockThreshold: 15, category: 'Personal Care', expiryDate: null },
  { name: 'Soap Bar', itemCode: 'PRC-003', price: 1.00, stockQuantity: 60, lowStockThreshold: 15, category: 'Personal Care', expiryDate: null },
  { name: 'Hand Cream', itemCode: 'PRC-004', price: 3.50, stockQuantity: 20, lowStockThreshold: 5, category: 'Personal Care', expiryDate: null },
  { name: 'Sunscreen SPF50', itemCode: 'PRC-005', price: 8.00, stockQuantity: 10, lowStockThreshold: 3, category: 'Personal Care', expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'USB Cable 1m', itemCode: 'ELE-001', price: 5.00, stockQuantity: 25, lowStockThreshold: 5, category: 'Electronics', expiryDate: null },
  { name: 'Phone Charger', itemCode: 'ELE-002', price: 10.00, stockQuantity: 15, lowStockThreshold: 3, category: 'Electronics', expiryDate: null },
  { name: 'AA Batteries (4 pack)', itemCode: 'ELE-003', price: 4.00, stockQuantity: 40, lowStockThreshold: 10, category: 'Electronics', expiryDate: null },
  { name: 'LED Bulb', itemCode: 'ELE-004', price: 6.00, stockQuantity: 20, lowStockThreshold: 5, category: 'Electronics', expiryDate: null },
  { name: 'Extension Cord 3m', itemCode: 'ELE-005', price: 12.00, stockQuantity: 8, lowStockThreshold: 3, category: 'Electronics', expiryDate: null },
  { name: 'Fresh Bread Loaf', itemCode: 'BAK-001', price: 2.50, stockQuantity: 20, lowStockThreshold: 5, category: 'Bakery', expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'Croissant', itemCode: 'BAK-002', price: 1.50, stockQuantity: 15, lowStockThreshold: 8, category: 'Bakery', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).getTime() },
  { name: 'Muffins Pack (6)', itemCode: 'BAK-003', price: 4.50, stockQuantity: 10, lowStockThreshold: 3, category: 'Bakery', expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).getTime() }
]

const salesData = [
  { saleDate: '2024-12-01T09:15:00', totalAmount: 15.50, paymentMethod: 'cash', customerName: 'John Doe', items: [{ itemCode: 'BEV-001', quantity: 5 }, { itemCode: 'SNK-001', quantity: 3 }, { itemCode: 'SNK-002', quantity: 2 }] },
  { saleDate: '2024-12-01T14:30:00', totalAmount: 23.00, paymentMethod: 'mobile_payment', customerName: 'Jane Smith', items: [{ itemCode: 'GRC-001', quantity: 2 }, { itemCode: 'DRY-001', quantity: 3 }, { itemCode: 'DRY-003', quantity: 2 }] },
  { saleDate: '2024-12-02T10:00:00', totalAmount: 8.50, paymentMethod: 'cash', customerName: null, items: [{ itemCode: 'BEV-002', quantity: 3 }, { itemCode: 'SNK-003', quantity: 2 }] },
  { saleDate: '2024-12-02T16:45:00', totalAmount: 45.00, paymentMethod: 'credit', customerName: 'ABC Company', items: [{ itemCode: 'PRC-001', quantity: 5 }, { itemCode: 'PRC-002', quantity: 5 }, { itemCode: 'PRC-003', quantity: 10 }, { itemCode: 'HHS-001', quantity: 5 }] },
  { saleDate: '2024-12-03T11:20:00', totalAmount: 12.80, paymentMethod: 'mobile_payment', customerName: 'Bob Wilson', items: [{ itemCode: 'DRY-002', quantity: 2 }, { itemCode: 'GRC-002', quantity: 3 }, { itemCode: 'SNK-005', quantity: 1 }] },
  { saleDate: '2024-12-03T15:00:00', totalAmount: 28.50, paymentMethod: 'cash', customerName: 'Alice Brown', items: [{ itemCode: 'BEV-003', quantity: 4 }, { itemCode: 'BAK-001', quantity: 2 }, { itemCode: 'DRY-004', quantity: 3 }] },
  { saleDate: '2024-12-04T09:30:00', totalAmount: 55.00, paymentMethod: 'credit', customerName: 'Tech Solutions Inc', items: [{ itemCode: 'ELE-001', quantity: 5 }, { itemCode: 'ELE-002', quantity: 3 }, { itemCode: 'ELE-003', quantity: 5 }] },
  { saleDate: '2024-12-04T13:15:00', totalAmount: 19.75, paymentMethod: 'mobile_payment', customerName: 'Sarah Johnson', items: [{ itemCode: 'GRC-003', quantity: 3 }, { itemCode: 'GRC-004', quantity: 5 }, { itemCode: 'HHS-002', quantity: 3 }] },
  { saleDate: '2024-12-05T10:45:00', totalAmount: 7.00, paymentMethod: 'cash', customerName: null, items: [{ itemCode: 'BEV-004', quantity: 5 }, { itemCode: 'SNK-004', quantity: 1 }] },
  { saleDate: '2024-12-05T17:00:00', totalAmount: 89.50, paymentMethod: 'credit', customerName: 'Grand Hotel', items: [{ itemCode: 'BEV-001', quantity: 20 }, { itemCode: 'BEV-002', quantity: 30 }, { itemCode: 'BAK-002', quantity: 10 }, { itemCode: 'PRC-005', quantity: 5 }] },
  { saleDate: '2024-12-06T08:30:00', totalAmount: 34.20, paymentMethod: 'mobile_payment', customerName: 'Mike Chen', items: [{ itemCode: 'GRC-005', quantity: 4 }, { itemCode: 'GRC-006', quantity: 5 }, { itemCode: 'HHS-004', quantity: 5 }] },
  { saleDate: '2024-12-06T12:00:00', totalAmount: 62.00, paymentMethod: 'cash', customerName: 'Restaurant ABC', items: [{ itemCode: 'GRC-007', quantity: 15 }, { itemCode: 'DRY-005', quantity: 8 }, { itemCode: 'HHS-003', quantity: 5 }] },
  { saleDate: '2024-12-07T09:00:00', totalAmount: 22.50, paymentMethod: 'mobile_payment', customerName: 'Emily Davis', items: [{ itemCode: 'PRC-004', quantity: 3 }, { itemCode: 'SNK-001', quantity: 5 }, { itemCode: 'BEV-005', quantity: 5 }] },
  { saleDate: '2024-12-07T15:30:00', totalAmount: 41.00, paymentMethod: 'credit', customerName: 'Office Supplies Co', items: [{ itemCode: 'HHS-005', quantity: 8 }, { itemCode: 'ELE-004', quantity: 5 }, { itemCode: 'ELE-005', quantity: 2 }] },
  { saleDate: '2024-12-08T11:00:00', totalAmount: 15.00, paymentMethod: 'cash', customerName: null, items: [{ itemCode: 'BAK-003', quantity: 2 }, { itemCode: 'BEV-003', quantity: 2 }, { itemCode: 'DRY-001', quantity: 2 }] },
  { saleDate: '2025-01-01T10:00:00', totalAmount: 45.00, paymentMethod: 'cash', customerName: 'New Year Customer', items: [{ itemCode: 'BEV-001', quantity: 20 }, { itemCode: 'BEV-002', quantity: 20 }, { itemCode: 'SNK-002', quantity: 10 }] },
  { saleDate: '2025-01-02T14:00:00', totalAmount: 125.00, paymentMethod: 'credit', customerName: 'Event Organizers LLC', items: [{ itemCode: 'BEV-003', quantity: 30 }, { itemCode: 'GRC-001', quantity: 10 }, { itemCode: 'PRC-001', quantity: 10 }, { itemCode: 'PRC-002', quantity: 20 }] },
  { saleDate: '2025-01-03T09:30:00', totalAmount: 78.50, paymentMethod: 'mobile_payment', customerName: 'Happy Family', items: [{ itemCode: 'DRY-003', quantity: 10 }, { itemCode: 'DRY-002', quantity: 8 }, { itemCode: 'BAK-001', quantity: 10 }, { itemCode: 'HHS-001', quantity: 10 }] },
  { saleDate: '2025-01-04T16:00:00', totalAmount: 33.00, paymentMethod: 'cash', customerName: 'Walk-in Customer', items: [{ itemCode: 'SNK-005', quantity: 5 }, { itemCode: 'ELE-003', quantity: 5 }, { itemCode: 'PRC-003', quantity: 10 }] },
  { saleDate: '2025-01-05T11:30:00', totalAmount: 210.00, paymentMethod: 'credit', customerName: 'Hotel Paradise', items: [{ itemCode: 'BEV-001', quantity: 100 }, { itemCode: 'BEV-002', quantity: 100 }, { itemCode: 'HHS-002', quantity: 20 }, { itemCode: 'HHS-003', quantity: 20 }] }
]

async function seed() {
  try {
    console.log('Creating database tables...')
    
    await client.execute('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, item_code TEXT UNIQUE NOT NULL, price REAL NOT NULL, stock_quantity INTEGER NOT NULL, low_stock_threshold INTEGER NOT NULL, category TEXT, expiry_date INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_date INTEGER NOT NULL, total_amount REAL NOT NULL, payment_method TEXT NOT NULL, customer_name TEXT, invoice_number TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER, item_id INTEGER, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total_price REAL NOT NULL)')
    
    await client.execute('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL)')
    
    console.log('Clearing existing data...')
    await client.execute('DELETE FROM sale_items')
    await client.execute('DELETE FROM sales')
    await client.execute('DELETE FROM items')
    await client.execute('DELETE FROM categories')
    
    console.log('Seeding categories...')
    for (const category of categories) {
      await client.execute({
        sql: 'INSERT INTO categories (name, created_at) VALUES (?, ?)',
        args: [category, Date.now()]
      })
    }
    
    console.log('Seeding items...')
    for (const item of items) {
      await client.execute({
        sql: 'INSERT INTO items (name, item_code, price, stock_quantity, low_stock_threshold, category, expiry_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [item.name, item.itemCode, item.price, item.stockQuantity, item.lowStockThreshold, item.category, item.expiryDate, Date.now(), Date.now()]
      })
    }
    
    console.log('Seeding sales...')
    for (const sale of salesData) {
      const saleResult = await client.execute({
        sql: 'INSERT INTO sales (sale_date, total_amount, payment_method, customer_name, invoice_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [new Date(sale.saleDate).getTime(), sale.totalAmount, sale.paymentMethod, sale.customerName, generateInvoiceNumber(), Date.now(), Date.now()]
      })
      
      const saleId = saleResult.lastInsertRowid
      for (const saleItem of sale.items) {
        const itemResult = await client.execute({
          sql: 'SELECT id, price FROM items WHERE item_code = ?',
          args: [saleItem.itemCode]
        })
        const item = itemResult.rows[0]
        if (item) {
          await client.execute({
            sql: 'INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            args: [saleId, item.id, saleItem.quantity, item.price, item.price * saleItem.quantity]
          })
        }
      }
    }
    
    console.log('Database seeded successfully!')
    console.log(`- ${categories.length} categories`)
    console.log(`- ${items.length} items`)
    console.log(`- ${salesData.length} sales`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
