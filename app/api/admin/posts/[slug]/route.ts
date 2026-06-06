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
    execSync(`git add "${filePath}"`, { cwd, stdio: 'pipe' })

    try {
      execSync(`git commit -m "edit: update ${slug} via admin editor"`, { cwd, stdio: 'pipe' })
      execSync('git push', { cwd, stdio: 'pipe' })
    } catch (e) {
      // No changes to commit is fine
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}
