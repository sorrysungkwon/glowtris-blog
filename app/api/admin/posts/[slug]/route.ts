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
    const post = getPost(slug)

    const filePath = path.join(postsDir, `${slug}.mdx`)
    const raw = fs.readFileSync(filePath, 'utf8')

    // Extract frontmatter
    const match = raw.match(/^---\n([\s\S]*?)\n---/)
    const frontmatter = match ? match[1] : ''
    const content = raw.replace(/^---\n[\s\S]*?\n---\n/, '')

    return NextResponse.json({ frontmatter, content })
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
    const { frontmatter, content } = await req.json()

    const filePath = path.join(postsDir, `${slug}.mdx`)
    const updated = `---\n${frontmatter}\n---\n${content}`

    // Write file
    fs.writeFileSync(filePath, updated, 'utf8')

    // Git operations
    const cwd = process.cwd()

    try {
      // Ensure git user is configured
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
      execSync(`git add "${filePath}"`, { cwd })
      execSync(`git commit -m "edit: update ${slug} via admin editor"`, { cwd })
      execSync('git push', { cwd })
    } catch (e) {
      console.error('Git error:', e)
      // Continue anyway - file is saved
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
