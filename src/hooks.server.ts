import { initializeDatabase } from '$lib/server/db'
import type { Handle } from '@sveltejs/kit'

let initialized = false

async function initServer() {
  if (initialized) return
  initialized = true
  
  try {
    console.log('Initializing database...')
    await initializeDatabase()
    console.log('Server initialization complete')
  } catch (error) {
    console.error('Error initializing server:', error)
  }
}

initServer()

function getSessionFromCookies(cookies: Record<string, string>): { valid: boolean; user?: { email: string; role: string } } {
  const sessionCookie = cookies['session']
  
  if (!sessionCookie) {
    return { valid: false }
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
    
    if (!sessionData.email || !sessionData.role || !sessionData.createdAt) {
      return { valid: false }
    }
    
    const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime()
    const maxAge = 30 * 24 * 60 * 60 * 1000
    
    if (sessionAge > maxAge) {
      return { valid: false }
    }
    
    return { valid: true, user: { email: sessionData.email, role: sessionData.role } }
  } catch {
    return { valid: false }
  }
}

const protectedPaths = ['/api/items', '/api/sales', '/api/dashboard']
const adminPaths = ['/api/items', '/api/sales']

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  const url = event.url.pathname
  
  for (const path of protectedPaths) {
    if (url.startsWith(path)) {
      const cookieObj: Record<string, string> = {}
      event.cookies.getAll().forEach(c => { cookieObj[c.name] = c.value })
      const session = getSessionFromCookies(cookieObj)
      
      if (!session.valid) {
        if (url.startsWith('/api/')) {
          return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
      
      if (url.startsWith('/api/')) {
        for (const adminPath of adminPaths) {
          if (url.startsWith(adminPath) && (url.endsWith('/') || url.split('/').length > 3)) {
            if (session.user?.role !== 'Administrator') {
              return new Response(JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }
        }
      }
      
      break
    }
  }
  
  return response
}
