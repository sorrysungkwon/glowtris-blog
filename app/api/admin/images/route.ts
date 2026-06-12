import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listDirectory, deleteFile } from '@/lib/github'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  try {
    if (isProduction) {
      const owner = process.env.GITHUB_OWNER
      const repo = process.env.GITHUB_REPO
      const files = await listDirectory('public/images')
      
      const images = files
        .filter((f: any) => f.type === 'file')
        .map((f: any) => {
          const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${f.path}`
          return {
            name: f.name,
            url,
            size: f.size,
          }
        })
        // Sort by name descending (timestamp prefix ensures newer files are first)
        .sort((a, b) => b.name.localeCompare(a.name))

      return NextResponse.json({ images })
    } else {
      const imagesDir = path.join(process.cwd(), 'public/images')
      if (!fs.existsSync(imagesDir)) {
        return NextResponse.json({ images: [] })
      }

      const files = fs.readdirSync(imagesDir)
      const images = files
        .map((fileName) => {
          const filePath = path.join(imagesDir, fileName)
          const stat = fs.statSync(filePath)
          if (!stat.isFile()) return null
          return {
            name: fileName,
            url: `/images/${fileName}`,
            size: stat.size,
            mtime: stat.mtimeMs,
          }
        })
        .filter(Boolean)
        // Sort by mtime descending (newest first)
        .sort((a: any, b: any) => b.mtime - a.mtime)

      return NextResponse.json({ images })
    }
  } catch (error) {
    console.error('Failed to list images:', error)
    return NextResponse.json(
      { error: 'Failed to list images', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  try {
    const { fileName } = await req.json()
    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 })
    }

    if (fileName.includes('/') || fileName.includes('..')) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

    if (isProduction) {
      const filePath = `public/images/${fileName}`
      await deleteFile(filePath, `chore: delete image ${fileName}`)
    } else {
      const filePath = path.join(process.cwd(), 'public/images', fileName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      } else {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image', details: String(error) },
      { status: 500 }
    )
  }
}
