import { db } from './index'
import { items, categories, sales, saleItems } from './schema'
import { sql } from 'drizzle-orm'

function generateInvoiceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

const categoryData = [
  { name: 'Beverages' },
  { name: 'Snacks' },
  { name: 'Groceries' },
  { name: 'Dairy' },
  { name: 'Household' },
  { name: 'Personal Care' }
]

const itemData = [
  { name: 'Mineral Water 500ml', itemCode: 'BEV-001', price: 0.50, stockQuantity: 100, lowStockThreshold: 20, category: 'Beverages' },
  { name: 'Cola Soda 330ml', itemCode: 'BEV-002', price: 1.00, stockQuantity: 80, lowStockThreshold: 15, category: 'Beverages' },
  { name: 'Orange Juice 1L', itemCode: 'BEV-003', price: 2.50, stockQuantity: 40, lowStockThreshold: 10, category: 'Beverages' },
  { name: 'Potato Chips Regular', itemCode: 'SNK-001', price: 1.20, stockQuantity: 60, lowStockThreshold: 15, category: 'Snacks' },
  { name: 'Chocolate Bar', itemCode: 'SNK-002', price: 0.80, stockQuantity: 100, lowStockThreshold: 25, category: 'Snacks' },
  { name: 'Cookies Pack', itemCode: 'SNK-003', price: 2.00, stockQuantity: 45, lowStockThreshold: 10, category: 'Snacks' },
  { name: 'Rice 5kg', itemCode: 'GRC-001', price: 8.00, stockQuantity: 30, lowStockThreshold: 5, category: 'Groceries' },
  { name: 'Sugar 1kg', itemCode: 'GRC-002', price: 1.50, stockQuantity: 50, lowStockThreshold: 10, category: 'Groceries' },
  { name: 'Cooking Oil 1L', itemCode: 'GRC-003', price: 3.00, stockQuantity: 35, lowStockThreshold: 8, category: 'Groceries' },
  { name: 'Milk 1L', itemCode: 'DRY-001', price: 2.00, stockQuantity: 25, lowStockThreshold: 10, category: 'Dairy' },
  { name: 'Yogurt Pack', itemCode: 'DRY-002', price: 3.50, stockQuantity: 20, lowStockThreshold: 8, category: 'Dairy' },
  { name: 'Eggs (12 pack)', itemCode: 'DRY-003', price: 4.00, stockQuantity: 30, lowStockThreshold: 5, category: 'Dairy' },
  { name: 'Toilet Paper (4 rolls)', itemCode: 'HHS-001', price: 3.00, stockQuantity: 40, lowStockThreshold: 10, category: 'Household' },
  { name: 'Dishwashing Liquid', itemCode: 'HHS-002', price: 2.50, stockQuantity: 25, lowStockThreshold: 5, category: 'Household' },
  { name: 'Laundry Detergent', itemCode: 'HHS-003', price: 5.00, stockQuantity: 20, lowStockThreshold: 5, category: 'Household' },
  { name: 'Shampoo 200ml', itemCode: 'PRC-001', price: 4.00, stockQuantity: 30, lowStockThreshold: 8, category: 'Personal Care' },
  { name: 'Toothpaste', itemCode: 'PRC-002', price: 2.00, stockQuantity: 50, lowStockThreshold: 15, category: 'Personal Care' },
  { name: 'Soap Bar', itemCode: 'PRC-003', price: 1.00, stockQuantity: 60, lowStockThreshold: 15, category: 'Personal Care' }
]

const sampleSales = [
  { saleDate: new Date('2024-12-01'), totalAmount: 15.50, paymentMethod: 'cash', customerName: 'John Doe' },
  { saleDate: new Date('2024-12-02'), totalAmount: 23.00, paymentMethod: 'mobile_payment', customerName: 'Jane Smith' },
  { saleDate: new Date('2024-12-03'), totalAmount: 8.50, paymentMethod: 'cash', customerName: null },
  { saleDate: new Date('2024-12-04'), totalAmount: 45.00, paymentMethod: 'credit', customerName: 'ABC Company' },
  { saleDate: new Date('2024-12-05'), totalAmount: 12.80, paymentMethod: 'mobile_payment', customerName: 'Bob Wilson' }
]

export async function seedDatabase() {
  try {
    for (const category of categoryData) {
      await db.insert(categories).values({
        ...category,
        createdAt: new Date()
      }).onConflictDoNothing()
    }

    for (const item of itemData) {
      await db.insert(items).values({
        name: item.name,
        itemCode: item.itemCode,
        price: item.price,
        stockQuantity: item.stockQuantity,
        lowStockThreshold: item.lowStockThreshold,
        category: item.category,
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing()
    }

    for (const sale of sampleSales) {
      await db.insert(sales).values({
        saleDate: sale.saleDate,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        customerName: sale.customerName,
        invoiceNumber: generateInvoiceNumber(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing()
    }
    
    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

export { categoryData, itemData, sampleSales }
