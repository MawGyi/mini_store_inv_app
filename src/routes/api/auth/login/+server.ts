import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { checkRateLimit, constantTimeEqual, validateEmail, generateSecureToken } from '$lib/server/security'

const DEMO_USERS: Record<string, { password: string; name: string; role: string }> = {
  'admin@ministore.com': {
    password: 'admin123',
    name: 'Store Admin',
    role: 'Administrator'
  },
  'manager@ministore.com': {
    password: 'manager123',
    name: 'Store Manager',
    role: 'Manager'
  },
  'staff@ministore.com': {
    password: 'staff123',
    name: 'Staff Member',
    role: 'Staff'
  }
}

const failedLogins = new Map<string, { attempts: number; lockedUntil?: number }>()

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const clientIP = getClientAddress() || 'unknown'
  const rateLimit = checkRateLimit(`login:${clientIP}`)

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    return json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
      retryAfter
    }, {
      status: 429,
      headers: { 'Retry-After': retryAfter.toString() }
    })
  }

  try {
    const rawBody = await request.text()

    if (!rawBody || rawBody.trim() === '') {
      return json({ success: false, message: 'Email and password are required' }, { status: 400 })
    }

    let body: { email?: unknown; password?: unknown; rememberMe?: unknown }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return json({ success: false, message: 'Invalid request format' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const rememberMe = body.rememberMe === true

    if (!email || !password) {
      return json({ success: false, message: 'Email and password are required' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return json({ success: false, message: 'Invalid email format' }, { status: 400 })
    }

    const userConfig = DEMO_USERS[email]

    const existingLoginState = failedLogins.get(clientIP)
    if (existingLoginState?.lockedUntil && Date.now() < existingLoginState.lockedUntil) {
      const retryAfter = Math.ceil((existingLoginState.lockedUntil - Date.now()) / 1000)
      return json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Please try again later.',
        retryAfter
      }, {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() }
      })
    }

    const passwordValid = userConfig ? constantTimeEqual(password, userConfig.password) : constantTimeEqual(password, 'dummy')

    if (!passwordValid) {
      const loginState = failedLogins.get(clientIP) || { attempts: 0 }
      loginState.attempts++

      if (loginState.attempts >= 5) {
        loginState.lockedUntil = Date.now() + 15 * 60 * 1000
      }
      failedLogins.set(clientIP, loginState)

      return json({ success: false, message: 'Invalid email or password' }, { status: 401 })
    }

    if (failedLogins.has(clientIP)) {
      failedLogins.delete(clientIP)
    }

    const sessionId = generateSecureToken(32)
    const sessionData = {
      id: sessionId,
      sessionKey: generateSecureToken(64),
      email,
      name: userConfig!.name,
      role: userConfig!.role,
      createdAt: Date.now(),
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    }

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    const isProduction = process.env.NODE_ENV === 'production'

    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    })

    cookies.set('session_verify', generateSecureToken(32), {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    })

    return json({
      success: true,
      user: {
        id: sessionData.id,
        email,
        name: userConfig!.name,
        role: userConfig!.role
      },
      redirectTo: '/dashboard'
    })
  } catch (error) {
    console.error('Login error:', error)
    return json({ success: false, message: 'An error occurred during login' }, { status: 500 })
  }
}
