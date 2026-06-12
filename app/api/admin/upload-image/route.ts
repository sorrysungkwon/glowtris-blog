import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { putFile } from '@/lib/github'

const isProduction = process.env.NODE_ENV === 'production'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`
    const imageBuffer = Buffer.from(await file.arrayBuffer())

    if (isProduction) {
      await putFile(`public/images/${fileName}`, imageBuffer, `chore: upload image ${fileName}`)
    } else {
      const fs = await import('fs')
      const path = await import('path')
      const imagesDir = path.join(process.cwd(), 'public/images')
      fs.mkdirSync(imagesDir, { recursive: true })
      fs.writeFileSync(path.join(imagesDir, fileName), imageBuffer)
    }

    return NextResponse.json({ url: `/images/${fileName}`, fileName })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
