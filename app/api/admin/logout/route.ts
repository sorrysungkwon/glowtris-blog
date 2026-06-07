import { NextRequest, NextResponse } from 'next/server'
import { extractToken, invalidateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req)
    if (token) {
      invalidateToken(token)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 400 })
  }
}
