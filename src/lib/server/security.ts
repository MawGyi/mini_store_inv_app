const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const rateLimitWindow = 15 * 60 * 1000
const maxAttempts = 5

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + rateLimitWindow }
    rateLimitStore.set(identifier, newRecord)
    return { allowed: true, remaining: maxAttempts - 1, resetTime: newRecord.resetTime }
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: maxAttempts - record.count, resetTime: record.resetTime }
}

export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

setInterval(cleanupRateLimitStore, rateLimitWindow)

export function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  let result = a.length ^ b.length
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return result === 0
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePasswordStrength(password: string): { valid: boolean; score: number; errors: string[] } {
  const errors: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else errors.push('At least 8 characters')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password)) score++
  else errors.push('Lowercase letter')

  if (/[A-Z]/.test(password)) score++
  else errors.push('Uppercase letter')

  if (/[0-9]/.test(password)) score++
  else errors.push('Number')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else errors.push('Special character')

  return { valid: score >= 4, score, errors }
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues, (x) => chars[x % chars.length]).join('')
}

export function hashPassword(password: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'MINI_STORE_SALT_2024')
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + password.length
}
