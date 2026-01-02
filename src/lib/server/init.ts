import { initializeDatabase, db } from '$lib/server/db'
import { seedDatabase } from '$lib/server/db/seed'
import { items, sales } from '$lib/server/db/schema'

async function init() {
  try {
    console.log('Initializing database...')
    initializeDatabase()
    
    const count = await db.select({ count: sql<number>`count(*)` }).from(items).then(r => r[0]?.count || 0)
    
    if (count === 0) {
      console.log('Seeding database with initial data...')
      await seedDatabase()
    } else {
      console.log(`Database already contains ${count} items`)
    }
    
    console.log('Server initialization complete')
  } catch (error) {
    console.error('Error initializing server:', error)
    process.exit(1)
  }
}

import { sql } from 'drizzle-orm'

init()
