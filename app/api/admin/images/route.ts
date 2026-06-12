import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listDirectory, deleteFile, listMdxFiles, fetchRawFile } from '@/lib/github'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const isProduction = process.env.NODE_ENV === 'production'

// Helper to scan posts content for image references
async function getPostContents(): Promise<{ slug: string; lang?: string; title: string; content: string }[]> {
  const postTexts: { slug: string; lang?: string; title: string; content: string }[] = []

  if (isProduction) {
    // Check drafts branch first, then main branch as fallback
    const branch = 'drafts'
    let enFiles: string[] = []
    let koFiles: string[] = []

    try {
      enFiles = await listMdxFiles('posts', branch)
    } catch {
      enFiles = await listMdxFiles('posts', 'main')
    }

    try {
      koFiles = await listMdxFiles('posts/ko', branch)
    } catch {
      koFiles = await listMdxFiles('posts/ko', 'main')
    }

    const enPromises = enFiles.map(async (file) => {
      try {
        let raw = await fetchRawFile(`posts/${file}`, branch)
        if (!raw) raw = await fetchRawFile(`posts/${file}`, 'main')
        if (raw) {
          const { data, content } = matter(raw)
          postTexts.push({ slug: file.replace(/\.mdx$/, ''), title: data.title || file, content })
        }
      } catch (err) {
        console.error(`Error fetching prod EN file ${file}:`, err)
      }
    })

    const koPromises = koFiles.map(async (file) => {
      try {
        let raw = await fetchRawFile(`posts/ko/${file}`, branch)
        if (!raw) raw = await fetchRawFile(`posts/ko/${file}`, 'main')
        if (raw) {
          const { data, content } = matter(raw)
          postTexts.push({ slug: file.replace(/\.mdx$/, ''), lang: 'ko', title: data.title || file, content })
        }
      } catch (err) {
        console.error(`Error fetching prod KO file ${file}:`, err)
      }
    })

    await Promise.all([...enPromises, ...koPromises])
  } else {
    const postsDir = path.join(process.cwd(), 'posts')
    const koPostsDir = path.join(postsDir, 'ko')

    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir)
      for (const file of files) {
        if (file.endsWith('.mdx')) {
          try {
            const raw = fs.readFileSync(path.join(postsDir, file), 'utf8')
            const { data, content } = matter(raw)
            postTexts.push({ slug: file.replace(/\.mdx$/, ''), title: data.title || file, content })
          } catch (err) {
            console.error(`Error reading local EN file ${file}:`, err)
          }
        }
      }
    }

    if (fs.existsSync(koPostsDir)) {
      const files = fs.readdirSync(koPostsDir)
      for (const file of files) {
        if (file.endsWith('.mdx')) {
          try {
            const raw = fs.readFileSync(path.join(koPostsDir, file), 'utf8')
            const { data, content } = matter(raw)
            postTexts.push({ slug: file.replace(/\.mdx$/, ''), lang: 'ko', title: data.title || file, content })
          } catch (err) {
            console.error(`Error reading local KO file ${file}:`, err)
          }
        }
      }
    }
  }

  return postTexts
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  try {
    // Get all post contents to scan for image usage
    const posts = await getPostContents()

    if (isProduction) {
      const owner = process.env.GITHUB_OWNER
      const repo = process.env.GITHUB_REPO
      const files = await listDirectory('public/images')
      
      const images = files
        .filter((f: any) => f.type === 'file')
        .map((f: any) => {
          const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${f.path}`
          
          // Find which posts reference this image
          const referencedBy = posts
            .filter((p) => p.content.includes(f.name))
            .map((p) => ({
              slug: p.slug,
              title: p.title,
              lang: p.lang || 'en',
            }))

          return {
            name: f.name,
            url,
            size: f.size,
            referencedBy,
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

          // Find which posts reference this image
          const referencedBy = posts
            .filter((p) => p.content.includes(fileName))
            .map((p) => ({
              slug: p.slug,
              title: p.title,
              lang: p.lang || 'en',
            }))

          return {
            name: fileName,
            url: `/images/${fileName}`,
            size: stat.size,
            mtime: stat.mtimeMs,
            referencedBy,
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
