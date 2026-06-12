import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'
import { getTokenSecret, safeCompare } from '@/lib/auth'

function generateToken(): string {
  const payload = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const data = `${payload}.${timestamp}`
  const signature = createHmac('sha256', getTokenSecret()).update(data).digest('hex')
  return `${data}.${signature}`
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
    }

    if (typeof password === 'string' && safeCompare(password, adminPassword)) {
      return NextResponse.json({ success: true, token: generateToken() })
    }

    // Slow down brute-force attempts
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
