import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, extractToken } from '@/lib/auth'

const isProduction = process.env.NODE_ENV === 'production'

async function uploadToGitHub(fileName: string, fileContent: Buffer): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials not configured')
  }

  try {
    const filePath = `public/images/${fileName}`
    const base64Content = fileContent.toString('base64')

    // Check if file exists
    let sha: string | undefined = undefined
    try {
      const metaResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )
      if (metaResponse.ok) {
        const metaData = await metaResponse.json()
        sha = metaData.sha
      }
    } catch {
      // File doesn't exist
    }

    const requestBody: any = {
      message: `chore: upload image ${fileName}`,
      content: base64Content,
    }

    if (sha) {
      requestBody.sha = sha
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub API error: ${response.status} - ${error}`)
    }

    return `/images/${fileName}`
  } catch (error) {
    console.error('GitHub upload error:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  // Verify auth token
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Generate filename: timestamp + original name
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${timestamp}-${file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const imageBuffer = Buffer.from(buffer)

    if (isProduction) {
      // Upload to GitHub
      const url = await uploadToGitHub(fileName, imageBuffer)
      if (!url) {
        return NextResponse.json(
          { error: 'Failed to upload image to GitHub' },
          { status: 500 }
        )
      }
      return NextResponse.json({ url, fileName })
    } else {
      // In development, save to public/images locally
      const fs = await import('fs')
      const path = await import('path')
      const imagesDir = path.join(process.cwd(), 'public/images')

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }

      const filePath = path.join(imagesDir, fileName)
      fs.writeFileSync(filePath, imageBuffer)

      return NextResponse.json({ url: `/images/${fileName}`, fileName })
    }
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
