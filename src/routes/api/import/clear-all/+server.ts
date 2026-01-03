import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { items, sales, saleItems, categories } from '$lib/server/db/schema'
import { client } from '$lib/server/db'

export const POST: RequestHandler = async () => {
  try {
    await client.execute('DELETE FROM sale_items')
    await client.execute('DELETE FROM sales')
    await client.execute('DELETE FROM items')
    await client.execute('DELETE FROM categories')

    return json({ 
      message: 'All data cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing data:', error)
    return json({ error: 'Failed to clear data' }, { status: 500 })
  }
}
