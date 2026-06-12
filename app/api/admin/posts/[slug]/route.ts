import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { fetchRawFile, putFile, deleteFile } from '@/lib/github'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/
const FRONTMATTER_STRIP_RE = /^---\n[\s\S]*?\n---\n/

function splitPost(raw: string): { frontmatter: string; content: string } {
  const match = raw.match(FRONTMATTER_RE)
  return {
    frontmatter: match ? match[1] : '',
    content: raw.replace(FRONTMATTER_STRIP_RE, ''),
  }
}

function ensureGitIdentity(cwd: string) {
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
}

function revalidatePost(slug: string) {
  revalidatePath(`/posts/${slug}`)
  revalidatePath(`/posts/[slug]`)
  revalidatePath('/')
  revalidatePath('/', 'layout')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    if (isProduction) {
      // Try drafts branch first, fall back to main
      let enRaw = await fetchRawFile(`posts/${slug}.mdx`, 'drafts')
      const fromBranch = enRaw ? 'drafts' : 'main'
      if (!enRaw) {
        enRaw = await fetchRawFile(`posts/${slug}.mdx`, 'main')
      }
      if (!enRaw) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const { frontmatter, content: content_en } = splitPost(enRaw)

      let koRaw = await fetchRawFile(`posts/ko/${slug}.mdx`, fromBranch)
      if (!koRaw && fromBranch !== 'main') {
        koRaw = await fetchRawFile(`posts/ko/${slug}.mdx`, 'main')
      }
      const content_ko = koRaw ? splitPost(koRaw).content : ''

      return NextResponse.json({ frontmatter, content_en, content_ko, branch: fromBranch })
    } else {
      const enRaw = fs.readFileSync(path.join(postsDir, `${slug}.mdx`), 'utf8')
      const { frontmatter, content: content_en } = splitPost(enRaw)

      let content_ko = ''
      try {
        const koRaw = fs.readFileSync(path.join(postsDir, 'ko', `${slug}.mdx`), 'utf8')
        content_ko = splitPost(koRaw).content
      } catch {
        // No KO version
      }

      return NextResponse.json({ frontmatter, content_en, content_ko })
    }
  } catch {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  const { slug } = await params
  try {
    const { frontmatter, content_en, content_ko, deploy = false } = await req.json()

    const enContent = `---\n${frontmatter}\n---\n${content_en}`
    const koContent = content_ko?.trim() ? `---\n${frontmatter}\n---\n${content_ko}` : null

    if (isProduction) {
      // Always save to drafts branch
      await putFile(`posts/${slug}.mdx`, enContent, `draft: update ${slug} via admin editor`, 'drafts')
      if (koContent) {
        await putFile(`posts/ko/${slug}.mdx`, koContent, `draft: update ${slug} (KO) via admin editor`, 'drafts')
      }

      // If deploying, also push to main (triggers Vercel build)
      if (deploy) {
        await putFile(`posts/${slug}.mdx`, enContent, `deploy: publish ${slug} via admin editor`, 'main')
        if (koContent) {
          await putFile(`posts/ko/${slug}.mdx`, koContent, `deploy: publish ${slug} (KO) via admin editor`, 'main')
        }
      }
    } else {
      const enFile = path.join(postsDir, `${slug}.mdx`)
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

      fs.writeFileSync(enFile, enContent, 'utf8')
      if (koContent) {
        fs.mkdirSync(path.dirname(koFile), { recursive: true })
        fs.writeFileSync(koFile, koContent, 'utf8')
      }

      const cwd = process.cwd()
      const branch = deploy ? 'main' : 'drafts'
      try {
        ensureGitIdentity(cwd)
        execSync(`git add "${enFile}"`, { cwd, stdio: 'pipe' })
        if (koContent) {
          execSync(`git add "${koFile}"`, { cwd, stdio: 'pipe' })
        }
        const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
        if (status.trim()) {
          const commitMsg = deploy ? `deploy: publish ${slug}` : `draft: update ${slug}`
          execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'pipe' })
          execSync(`git push origin ${branch}`, { cwd, stdio: 'pipe' })
        }
      } catch (gitError) {
        const msg = gitError instanceof Error ? gitError.message : String(gitError)
        console.error('Git operation error:', msg)
        throw new Error(`Git error: ${msg}`)
      }
    }

    if (deploy) {
      revalidatePost(slug)
      console.log(`✅ Deployed and cache invalidated for post: ${slug}`)
    } else {
      console.log(`✅ Draft saved for post: ${slug}`)
    }

    return NextResponse.json({ success: true, deployed: deploy })
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
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  const { slug } = await params
  try {
    if (isProduction) {
      // Delete from both drafts and main branches
      let deleted = false
      for (const branch of ['drafts', 'main']) {
        try {
          await deleteFile(`posts/${slug}.mdx`, `delete: remove ${slug} post`, branch)
          deleted = true
        } catch {
          // File may not exist on this branch
        }
        try {
          await deleteFile(`posts/ko/${slug}.mdx`, `delete: remove ${slug} (KO) post`, branch)
          deleted = true
        } catch {
          // File may not exist on this branch
        }
      }
      if (!deleted) {
        throw new Error('Post not found')
      }
    } else {
      const enFile = path.join(postsDir, `${slug}.mdx`)
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

      let deleted = false
      for (const file of [enFile, koFile]) {
        try {
          fs.unlinkSync(file)
          deleted = true
        } catch {
          // File may not exist
        }
      }
      if (!deleted) {
        throw new Error('Post not found')
      }

      const cwd = process.cwd()
      try {
        ensureGitIdentity(cwd)
        execSync(`git add -A`, { cwd, stdio: 'pipe' })
        const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
        if (status.trim()) {
          execSync(`git commit -m "delete: remove ${slug} post"`, { cwd, stdio: 'pipe' })
          execSync('git push origin main', { cwd, stdio: 'pipe' })
        }
      } catch (gitError) {
        const msg = gitError instanceof Error ? gitError.message : String(gitError)
        console.error('Git operation error:', msg)
        throw new Error(`Git error: ${msg}`)
      }
    }

    revalidatePost(slug)
    console.log(`✅ Cache invalidated for post: ${slug}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete post',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
