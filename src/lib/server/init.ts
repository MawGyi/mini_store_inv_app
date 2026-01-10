import { sql } from 'drizzle-orm'
import { db, initializeDatabase, items } from '$lib/server/db'
import { seedDatabase } from '$lib/server/db/seed'

async function init() {
  try {
    console.log('Checking database connection...')
    await initializeDatabase()
    
    const count = await db.select({ count: sql`count(*)` }).from(items).then(r => r[0]?.count || 0)
    
    if (count === 0) {
      console.log('Seeding database with initial data...')
      await seedDatabase()
    } else {
      console.log(`Database already contains ${count} items`)
    }
    
    console.log('Server initialization complete')
  } catch (error) {
    console.error('Error initializing server:', error)
  }
}

init()
