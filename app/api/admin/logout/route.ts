import { NextResponse } from 'next/server'

// Tokens are stateless (HMAC-validated); logout is handled client-side
// by clearing localStorage. This endpoint exists so the client has a
// consistent logout call target.
export async function POST() {
  return NextResponse.json({ success: true })
}
