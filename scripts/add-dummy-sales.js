import { createClient } from '@libsql/client'

const client = createClient({
  url: 'file:sqlite.db'
})

function generateInvoiceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

const itemCodes = [
  'BEV-001', 'BEV-002', 'BEV-003', 'BEV-004', 'BEV-005',
  'SNK-001', 'SNK-002', 'SNK-003', 'SNK-004', 'SNK-005',
  'GRC-001', 'GRC-002', 'GRC-003', 'GRC-004', 'GRC-005', 'GRC-006', 'GRC-007',
  'DRY-001', 'DRY-002', 'DRY-003', 'DRY-004', 'DRY-005',
  'HHS-001', 'HHS-002', 'HHS-003', 'HHS-004', 'HHS-005',
  'PRC-001', 'PRC-002', 'PRC-003', 'PRC-004', 'PRC-005',
  'ELE-001', 'ELE-002', 'ELE-003', 'ELE-004', 'ELE-005',
  'BAK-001', 'BAK-002', 'BAK-003'
]

const paymentMethods = ['cash', 'credit', 'mobile_payment']
const customerNames = [
  'John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis',
  'Emma Johnson', 'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen',
  'Jack Anderson', 'Kate White', 'Liam Harris', 'Mia Martin', 'Noah Thompson',
  'Olivia Garcia', 'Peter Martinez', 'Quinn Robinson', 'Rachel Clark', 'Sam Lewis',
  'Tina Walker', 'Uma Hall', 'Victor Young', 'Wendy King', 'Xavier Wright',
  'Yara Lopez', 'Zach Hill', 'Amy Baker', 'Ben Nelson', 'Cathy Adams',
  'David Campbell', 'Eva Mitchell', 'Fred Carter', 'Gina Roberts', 'Harry Phillips',
  'Isla Evans', 'James Turner', 'Karen Collins', 'Leo Stewart', 'Maya Perry',
  'Nathan Price', 'Opal Sanders', 'Paul Ramirez', 'Rose Scott', 'Steve Murphy',
  'Tara Green', 'Uma Baker', 'Victor Hall', 'Wendy Allen', 'Xavier Young',
  null, null, null
]

const itemPrices = {
  'BEV-001': 0.50, 'BEV-002': 1.00, 'BEV-003': 2.50, 'BEV-004': 1.20, 'BEV-005': 2.00,
  'SNK-001': 1.20, 'SNK-002': 0.80, 'SNK-003': 2.00, 'SNK-004': 1.50, 'SNK-005': 4.00,
  'GRC-001': 8.00, 'GRC-002': 1.50, 'GRC-003': 3.00, 'GRC-004': 0.80, 'GRC-005': 3.50, 'GRC-006': 2.00, 'GRC-007': 1.50,
  'DRY-001': 2.00, 'DRY-002': 3.50, 'DRY-003': 4.00, 'DRY-004': 3.00, 'DRY-005': 5.00,
  'HHS-001': 3.00, 'HHS-002': 2.50, 'HHS-003': 5.00, 'HHS-004': 2.00, 'HHS-005': 4.00,
  'PRC-001': 4.00, 'PRC-002': 2.00, 'PRC-003': 1.00, 'PRC-004': 3.50, 'PRC-005': 8.00,
  'ELE-001': 5.00, 'ELE-002': 10.00, 'ELE-003': 4.00, 'ELE-004': 6.00, 'ELE-005': 12.00,
  'BAK-001': 2.50, 'BAK-002': 1.50, 'BAK-003': 4.50
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function addDummySales() {
  try {
    console.log('Adding dummy sales data...')
    
    const existingCount = await client.execute({ sql: 'SELECT COUNT(*) as count FROM sales', args: [] })
    const startCount = existingCount.rows[0].count
    console.log(`Existing sales: ${startCount}`)
    
    const salesToAdd = 150
    const now = Date.now()
    const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000)
    
    let addedCount = 0
    let saleItemsCount = 0
    
    for (let i = 0; i < salesToAdd; i++) {
      const saleDate = new Date(sixMonthsAgo + Math.random() * (now - sixMonthsAgo))
      const hour = randomInt(8, 21)
      saleDate.setHours(hour, randomInt(0, 59), 0, 0)
      
      const numItems = randomInt(1, 5)
      const saleItems = []
      let totalAmount = 0
      
      for (let j = 0; j < numItems; j++) {
        const itemCode = randomFromArray(itemCodes)
        const quantity = randomInt(1, 5)
        const unitPrice = itemPrices[itemCode] || randomFloat(1, 10)
        const itemTotal = Math.round(unitPrice * quantity * 100) / 100
        
        saleItems.push({
          itemCode,
          quantity,
          unitPrice,
          totalPrice: itemTotal
        })
        
        totalAmount += itemTotal
      }
      
      totalAmount = Math.round(totalAmount * 100) / 100
      
      const saleResult = await client.execute({
        sql: 'INSERT INTO sales (sale_date, total_amount, payment_method, customer_name, invoice_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [saleDate.getTime(), totalAmount, randomFromArray(paymentMethods), randomFromArray(customerNames), generateInvoiceNumber(), now, now]
      })
      
      const saleId = saleResult.lastInsertRowid
      
      for (const saleItem of saleItems) {
        const itemResult = await client.execute({
          sql: 'SELECT id FROM items WHERE item_code = ?',
          args: [saleItem.itemCode]
        })
        
        if (itemResult.rows[0]) {
          await client.execute({
            sql: 'INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            args: [saleId, itemResult.rows[0].id, saleItem.quantity, saleItem.unitPrice, saleItem.totalPrice]
          })
          saleItemsCount++
        }
      }
      
      addedCount++
      
      if (addedCount % 25 === 0) {
        console.log(`Added ${addedCount}/${salesToAdd} sales...`)
      }
    }
    
    const finalCount = await client.execute({ sql: 'SELECT COUNT(*) as count FROM sales', args: [] })
    const finalSaleItems = await client.execute({ sql: 'SELECT COUNT(*) as count FROM sale_items', args: [] })
    
    console.log('\n✅ Dummy sales data added successfully!')
    console.log(`   Total sales: ${finalCount.rows[0].count} (+${addedCount})`)
    console.log(`   Total sale items: ${finalSaleItems.rows[0].count} (+${saleItemsCount})`)
    console.log(`   Date range: Last 6 months`)
    console.log(`   Average items per sale: ${(saleItemsCount / addedCount).toFixed(1)}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error adding dummy sales:', error)
    process.exit(1)
  }
}

addDummySales()
