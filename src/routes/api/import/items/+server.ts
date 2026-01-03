import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items } from '$lib/server/db/schema'
import { eq, sql } from 'drizzle-orm'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || file.type !== 'text/csv') {
      return json({ error: 'Please upload a valid CSV file' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    
    if (lines.length < 2) {
      return json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    
    const nameIdx = headers.findIndex(h => h === 'name')
    const itemCodeIdx = headers.findIndex(h => h === 'itemcode')
    const priceIdx = headers.findIndex(h => h === 'price')
    const stockQtyIdx = headers.findIndex(h => h === 'stockquantity')
    const categoryIdx = headers.findIndex(h => h === 'category')
    const lowStockIdx = headers.findIndex(h => h === 'lowstockthreshold')

    if (nameIdx === -1 || itemCodeIdx === -1 || priceIdx === -1 || stockQtyIdx === -1) {
      return json({ error: 'CSV must have columns: name, itemcode, price, stockquantity' }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const now = Date.now()

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      
      const name = values[nameIdx]?.trim().replace(/^['"]|['"]$/g, '') || ''
      const itemCode = values[itemCodeIdx]?.trim().replace(/^['"]|['"]$/g, '') || ''
      const price = parseFloat(values[priceIdx]?.trim().replace(/^['"]|['"]$/g, '') || '0')
      const stockQuantity = parseInt(values[stockQtyIdx]?.trim().replace(/^['"]|['"]$/g, '') || '0')
      const category = categoryIdx !== -1 ? values[categoryIdx]?.trim().replace(/^['"]|['"]$/g, '') || '' : ''
      const lowStockThreshold = lowStockIdx !== -1 
        ? parseInt(values[lowStockIdx]?.trim().replace(/^['"]|['"]$/g, '') || '10')
        : 10

      if (!name || !itemCode || isNaN(price) || price <= 0 || isNaN(stockQuantity)) {
        skipped++
        continue
      }

      try {
        const existingItem = await db.select().from(items).where(eq(items.itemCode, itemCode)).get()
        
        if (existingItem) {
          await db.update(items)
            .set({
              name,
              price,
              stockQuantity,
              lowStockThreshold,
              category: category || null,
              updatedAt: new Date(now)
            })
            .where(eq(items.id, existingItem.id))
        } else {
          await db.insert(items).values({
            name,
            itemCode,
            price,
            stockQuantity,
            lowStockThreshold,
            category: category || null,
            createdAt: new Date(now),
            updatedAt: new Date(now)
          })
        }
        
        imported++
      } catch (err) {
        console.error(`Error importing row ${i}:`, err)
        skipped++
      }
    }

    return json({ 
      message: 'Import completed',
      imported,
      skipped
    })
  } catch (error) {
    console.error('Error importing items:', error)
    return json({ error: 'Failed to import items' }, { status: 500 })
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
