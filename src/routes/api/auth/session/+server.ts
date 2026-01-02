import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionToken = cookies.get('session')
  const verifyToken = cookies.get('session_verify')
  
  if (!sessionToken || !verifyToken) {
    cookies.delete('session', { path: '/' })
    cookies.delete('session_verify', { path: '/' })
    return json({ authenticated: false, user: null })
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    
    if (!sessionData.sessionKey || !sessionData.email || !sessionData.role || !sessionData.expiresAt) {
      cookies.delete('session', { path: '/' })
      cookies.delete('session_verify', { path: '/' })
      return json({ authenticated: false, user: null })
    }
    
    if (Date.now() > sessionData.expiresAt) {
      cookies.delete('session', { path: '/' })
      cookies.delete('session_verify', { path: '/' })
      return json({ authenticated: false, user: null })
    }
    
    return json({
      authenticated: true,
      user: {
        id: sessionData.id,
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role
      }
    })
  } catch (error) {
    cookies.delete('session', { path: '/' })
    cookies.delete('session_verify', { path: '/' })
    return json({ authenticated: false, user: null })
  }
}
