import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const tokenSecret = process.env.TOKEN_SECRET || 'default-dev-secret'

export function validateAuthToken(token: string): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [payload, timestamp, signature] = parts
  if (!payload || !timestamp || !signature) return false

  const data = `${payload}.${timestamp}`
  const expectedSignature = createHmac('sha256', tokenSecret).update(data).digest('hex')
  if (signature !== expectedSignature) return false

  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
  return tokenAge < maxAge
}

export function addValidToken(_token: string): void {
  // no-op: tokens are stateless, validated by HMAC signature only
}

export function invalidateToken(_token: string): void {
  // no-op: logout is handled client-side by clearing localStorage
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
