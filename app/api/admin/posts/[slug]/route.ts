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
      const koContent = `---\n${frontmatter}\n---\n${content_ko}`
      fs.writeFileSync(koFile, koContent, 'utf8')
    }

    // Git operations
    const cwd = process.cwd()

    try {
      // Check and set git config
      try {
        execSync('git config user.name', { cwd, stdio: 'pipe' })
      } catch {
        execSync('git config user.name "Blog Editor"', { cwd, stdio: 'pipe' })
      }

      try {
        execSync('git config user.email', { cwd, stdio: 'pipe' })
      } catch {
        execSync('git config user.email "editor@blog.local"', { cwd, stdio: 'pipe' })
      }

      // Stage files
      execSync(`git add "${enFile}"`, { cwd, stdio: 'pipe' })
      if (content_ko && content_ko.trim()) {
        execSync(`git add "${koFile}"`, { cwd, stdio: 'pipe' })
      }

      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
      if (status.trim()) {
        execSync(`git commit -m "edit: update ${slug} (EN/KO) via admin editor"`, { cwd, stdio: 'pipe' })
        execSync('git push origin main', { cwd, stdio: 'pipe' })
      }
    } catch (gitError) {
      console.error('Git operation error:', gitError instanceof Error ? gitError.message : String(gitError))
      throw new Error(`Git error: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const enFile = path.join(postsDir, `${slug}.mdx`)
    const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

    // Delete EN file
    let enDeleted = false
    try {
      fs.unlinkSync(enFile)
      enDeleted = true
    } catch (e) {
      // File may not exist
    }

    // Delete KO file
    let koDeleted = false
    try {
      fs.unlinkSync(koFile)
      koDeleted = true
    } catch (e) {
      // File may not exist
    }

    // If no files were deleted, throw error
    if (!enDeleted && !koDeleted) {
      throw new Error('Post not found')
    }

    // Git operations
    const cwd = process.cwd()

    try {
      // Check and set git config
      try {
        execSync('git config user.name', { cwd, stdio: 'pipe' })
      } catch {
        execSync('git config user.name "Blog Editor"', { cwd, stdio: 'pipe' })
      }

      try {
        execSync('git config user.email', { cwd, stdio: 'pipe' })
      } catch {
        execSync('git config user.email "editor@blog.local"', { cwd, stdio: 'pipe' })
      }

      // Stage deleted files
      execSync(`git add -A`, { cwd, stdio: 'pipe' })

      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
      if (status.trim()) {
        execSync(`git commit -m "delete: remove ${slug} post"`, { cwd, stdio: 'pipe' })
        execSync('git push origin main', { cwd, stdio: 'pipe' })
      }
    } catch (gitError) {
      console.error('Git operation error:', gitError instanceof Error ? gitError.message : String(gitError))
      throw new Error(`Git error: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete post',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
