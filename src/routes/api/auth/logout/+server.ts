import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('session', { path: '/' })
  cookies.delete('session_verify', { path: '/' })
  return json({ success: true })
}
