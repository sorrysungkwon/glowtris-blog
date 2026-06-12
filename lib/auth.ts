import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const isProduction = process.env.NODE_ENV === 'production'

export function getTokenSecret(): string {
  const secret = process.env.TOKEN_SECRET
  if (!secret) {
    if (isProduction) {
      throw new Error('TOKEN_SECRET must be set in production')
    }
    return 'default-dev-secret'
  }
  return secret
}

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function validateAuthToken(token: string): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [payload, timestamp, signature] = parts
  if (!payload || !timestamp || !signature) return false

  const data = `${payload}.${timestamp}`
  const expectedSignature = createHmac('sha256', getTokenSecret()).update(data).digest('hex')
  if (!safeCompare(signature, expectedSignature)) return false

  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
  return tokenAge < maxAge
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function requireAuth(req: NextRequest): { valid: false; response: NextResponse } | { valid: true } {
  const token = extractToken(req)
  if (!token || !validateAuthToken(token)) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { valid: true }
}
