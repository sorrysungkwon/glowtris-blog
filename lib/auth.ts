import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const tokenSecret = process.env.TOKEN_SECRET || 'default-dev-secret'
const validTokens = new Set<string>()
const invalidatedTokens = new Set<string>()

export function validateAuthToken(token: string): boolean {
  if (!token || !validTokens.has(token)) return false
  if (invalidatedTokens.has(token)) return false

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

export function addValidToken(token: string): void {
  validTokens.add(token)
}

export function invalidateToken(token: string): void {
  invalidatedTokens.add(token)
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
