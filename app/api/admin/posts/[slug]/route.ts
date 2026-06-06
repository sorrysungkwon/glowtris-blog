import { NextRequest, NextResponse } from 'next/server'
import { getPost } from '@/lib/posts'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const postsDir = path.join(process.cwd(), 'posts')

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    // Load EN version
    const enFile = path.join(postsDir, `${slug}.mdx`)
    const enRaw = fs.readFileSync(enFile, 'utf8')
    const enMatch = enRaw.match(/^---\n([\s\S]*?)\n---/)
    const frontmatter = enMatch ? enMatch[1] : ''
    const content_en = enRaw.replace(/^---\n[\s\S]*?\n---\n/, '')

    // Try to load KO version
    let content_ko = ''
    const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)
    try {
      const koRaw = fs.readFileSync(koFile, 'utf8')
      content_ko = koRaw.replace(/^---\n[\s\S]*?\n---\n/, '')
    } catch (e) {
      content_ko = ''
    }

    return NextResponse.json({ frontmatter, content_en, content_ko })
  } catch (error) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const { frontmatter, content_en, content_ko } = await req.json()

    // Paths
    const enFile = path.join(postsDir, `${slug}.mdx`)
    const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

    // Write EN file
    const enContent = `---\n${frontmatter}\n---\n${content_en}`
    fs.writeFileSync(enFile, enContent, 'utf8')

    // Write KO file if it has content
    if (content_ko && content_ko.trim()) {
      fs.mkdirSync(path.dirname(koFile), { recursive: true })
      // Extract KO frontmatter from original KO file or use EN frontmatter with KO adjustments
      const koContent = `---\n${frontmatter}\n---\n${content_ko}`
      fs.writeFileSync(koFile, koContent, 'utf8')
    }

    // Git operations
    const cwd = process.cwd()

    try {
      execSync('git config user.name', { cwd, stdio: 'pipe' }).toString().trim()
    } catch (e) {
      execSync('git config user.name "Blog Editor"', { cwd })
    }

    try {
      execSync('git config user.email', { cwd, stdio: 'pipe' }).toString().trim()
    } catch (e) {
      execSync('git config user.email "editor@blog.local"', { cwd })
    }

    try {
      execSync(`git add "${enFile}"`, { cwd })
      if (content_ko && content_ko.trim()) {
        execSync(`git add "${koFile}"`, { cwd })
      }
      execSync(`git commit -m "edit: update ${slug} (EN/KO) via admin editor"`, { cwd })
      execSync('git push', { cwd })
    } catch (e) {
      console.error('Git error:', e)
      // Continue anyway - files are saved
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({
      error: 'Failed to save post',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
