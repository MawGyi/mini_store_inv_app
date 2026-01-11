import { getStorageConfig } from '$lib/server/config'
import { pgSchema } from './pg-schema'
import { sqliteSchema } from './sqlite-schema'

// Schema selector based on storage type
const storageConfig = getStorageConfig()

export const schemas = {
  postgres: pgSchema,
  sqlite: sqliteSchema
}

export const items = storageConfig.type === 'postgres' ? pgSchema.items : sqliteSchema.items
export const sales = storageConfig.type === 'postgres' ? pgSchema.sales : sqliteSchema.sales
export const saleItems = storageConfig.type === 'postgres' ? pgSchema.saleItems : sqliteSchema.saleItems
export const categories = storageConfig.type === 'postgres' ? pgSchema.categories : sqliteSchema.categories

// Schema validation helpers
export function validateSchema(schemaType: 'postgres' | 'sqlite'): boolean {
  const schema = schemas[schemaType]
  return !!(schema.items && schema.sales && schema.saleItems && schema.categories)
}

// Index definitions for performance
export const indexes = {
  postgres: [
    'CREATE INDEX IF NOT EXISTS idx_items_item_code ON items(item_code)',
    'CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)',
    'CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number)',
    'CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id)',
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
  ],
  sqlite: [
    'CREATE INDEX IF NOT EXISTS idx_items_item_code ON items(item_code)',
    'CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)',
    'CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number)',
    'CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id)',
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
  ]
}

// Helper function to create indexes
export async function createIndexes(db: any, schemaType: 'postgres' | 'sqlite'): Promise<void> {
  const indexList = indexes[schemaType]
  
  for (const indexSql of indexList) {
    try {
      await db.execute(indexSql)
    } catch (error) {
      console.warn(`Warning: Failed to create index: ${indexSql}`, error)
    }
  }
  
  console.log(`✅ Created indexes for ${schemaType}`)
}