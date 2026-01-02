import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { generateSecureToken } from '$lib/server/security'

let csrfToken: string = ''

export const GET: RequestHandler = async ({ cookies }) => {
  let token = cookies.get('csrf_token')
  
  if (!token) {
    token = generateSecureToken(32)
    const isProduction = process.env.NODE_ENV === 'production'
    cookies.set('csrf_token', token, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    })
    csrfToken = token
  }
  
  return json({ token })
}
