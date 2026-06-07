import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'
import { addValidToken } from '@/lib/auth'

const tokenSecret = process.env.TOKEN_SECRET || 'default-dev-secret'

function generateToken(): string {
  const payload = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const data = `${payload}.${timestamp}`
  const signature = createHmac('sha256', tokenSecret).update(data).digest('hex')
  return `${data}.${signature}`
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
    }

    if (password === adminPassword) {
      const token = generateToken()
      addValidToken(token)
      return NextResponse.json({ success: true, token })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
