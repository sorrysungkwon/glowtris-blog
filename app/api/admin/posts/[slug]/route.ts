import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

async function fetchGitHubFile(filePath: string, branch = 'main'): Promise<{ content: string; sha: string } | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const content = await response.text()

    // Get SHA for update operations (must use branch ref)
    const metaResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    )

    const metaData = await metaResponse.json()
    return { content, sha: metaData.sha }
  } catch (error) {
    console.error('GitHub fetch error:', error)
    return null
  }
}

async function ensureBranchExists(token: string, owner: string, repo: string, branch: string): Promise<void> {
  // Check if branch already exists
  const checkRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      cache: 'no-store',
    }
  )
  if (checkRes.ok) return // branch already exists

  // Get SHA of main branch HEAD
  const mainRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      cache: 'no-store',
    }
  )
  if (!mainRes.ok) throw new Error(`Failed to get main branch SHA: ${mainRes.status}`)
  const mainData = await mainRes.json()
  const sha = mainData.object.sha

  // Create the new branch
  const createRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    }
  )
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Failed to create branch ${branch}: ${createRes.status} - ${err}`)
  }
  console.log(`✅ Created branch: ${branch}`)
}

async function updateGitHubFile(
  filePath: string,
  content: string,
  message: string,
  branch = 'main'
): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials not configured')
  }

  try {
    // Ensure the branch exists (creates from main if not)
    if (branch !== 'main') {
      await ensureBranchExists(token, owner, repo, branch)
    }

    // Get current SHA if file exists on this branch
    let sha: string | undefined = undefined
    try {
      const metaResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          cache: 'no-store',
        }
      )
      if (metaResponse.ok) {
        const metaData = await metaResponse.json()
        sha = metaData.sha
      }
    } catch {
      // File doesn't exist, will create new
    }

    const requestBody: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
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

    return true
  } catch (error) {
    throw new Error(`Failed to update GitHub file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function deleteGitHubFile(filePath: string, message: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials not configured')
  }

  try {
    // Get SHA first
    const metaResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!metaResponse.ok) {
      if (metaResponse.status === 404) return true // Already deleted
      throw new Error(`Failed to get file SHA: ${metaResponse.status}`)
    }

    const metaData = await metaResponse.json()

    // Delete file
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sha: metaData.sha,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub API error: ${response.status} - ${error}`)
    }

    return true
  } catch (error) {
    throw new Error(`Failed to delete GitHub file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    if (isProduction) {
      // Try drafts branch first, fall back to main
      let enFile = await fetchGitHubFile(`posts/${slug}.mdx`, 'drafts')
      const fromBranch = enFile ? 'drafts' : 'main'
      if (!enFile) {
        enFile = await fetchGitHubFile(`posts/${slug}.mdx`, 'main')
      }
      if (!enFile) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const enMatch = enFile.content.match(/^---\n([\s\S]*?)\n---/)
      const frontmatter = enMatch ? enMatch[1] : ''
      const content_en = enFile.content.replace(/^---\n[\s\S]*?\n---\n/, '')

      // Try to load KO version from same branch, then main
      let koFile = await fetchGitHubFile(`posts/ko/${slug}.mdx`, fromBranch)
      if (!koFile && fromBranch !== 'main') {
        koFile = await fetchGitHubFile(`posts/ko/${slug}.mdx`, 'main')
      }
      const content_ko = koFile ? koFile.content.replace(/^---\n[\s\S]*?\n---\n/, '') : ''

      return NextResponse.json({ frontmatter, content_en, content_ko, branch: fromBranch })
    } else {
      // Use local filesystem in development
      const enFile = path.join(postsDir, `${slug}.mdx`)
      const enRaw = fs.readFileSync(enFile, 'utf8')
      const enMatch = enRaw.match(/^---\n([\s\S]*?)\n---/)
      const frontmatter = enMatch ? enMatch[1] : ''
      const content_en = enRaw.replace(/^---\n[\s\S]*?\n---\n/, '')

      let content_ko = ''
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)
      try {
        const koRaw = fs.readFileSync(koFile, 'utf8')
        content_ko = koRaw.replace(/^---\n[\s\S]*?\n---\n/, '')
      } catch (e) {
        content_ko = ''
      }

      return NextResponse.json({ frontmatter, content_en, content_ko })
    }
  } catch (error) {
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

    if (isProduction) {
      const enContent = `---\n${frontmatter}\n---\n${content_en}`
      const koContent = content_ko?.trim() ? `---\n${frontmatter}\n---\n${content_ko}` : null

      // Always save to drafts branch
      await updateGitHubFile(`posts/${slug}.mdx`, enContent, `draft: update ${slug} via admin editor`, 'drafts')
      if (koContent) {
        await updateGitHubFile(`posts/ko/${slug}.mdx`, koContent, `draft: update ${slug} (KO) via admin editor`, 'drafts')
      }

      // If deploying, also push to main (triggers Vercel build)
      if (deploy) {
        await updateGitHubFile(`posts/${slug}.mdx`, enContent, `deploy: publish ${slug} via admin editor`, 'main')
        if (koContent) {
          await updateGitHubFile(`posts/ko/${slug}.mdx`, koContent, `deploy: publish ${slug} (KO) via admin editor`, 'main')
        }
      }
    } else {
      // Use local filesystem in development
      const enFile = path.join(postsDir, `${slug}.mdx`)
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

      const enContent = `---\n${frontmatter}\n---\n${content_en}`
      fs.writeFileSync(enFile, enContent, 'utf8')

      if (content_ko && content_ko.trim()) {
        fs.mkdirSync(path.dirname(koFile), { recursive: true })
        const koContent = `---\n${frontmatter}\n---\n${content_ko}`
        fs.writeFileSync(koFile, koContent, 'utf8')
      }

      // Git operations (local only)
      const cwd = process.cwd()
      const branch = deploy ? 'main' : 'drafts'
      try {
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

        execSync(`git add "${enFile}"`, { cwd, stdio: 'pipe' })
        if (content_ko && content_ko.trim()) {
          execSync(`git add "${koFile}"`, { cwd, stdio: 'pipe' })
        }

        const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
        if (status.trim()) {
          const commitMsg = deploy ? `deploy: publish ${slug}` : `draft: update ${slug}`
          execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'pipe' })
          execSync(`git push origin ${branch}`, { cwd, stdio: 'pipe' })
        }
      } catch (gitError) {
        console.error('Git operation error:', gitError instanceof Error ? gitError.message : String(gitError))
        throw new Error(`Git error: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
      }
    }

    // Only invalidate caches when deploying to main
    if (deploy) {
      revalidatePath(`/posts/${slug}`)
      revalidatePath(`/posts/[slug]`)
      revalidatePath('/')
      revalidatePath('/', 'layout')
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
      // Use GitHub API in production
      let enDeleted = false
      let koDeleted = false

      try {
        await deleteGitHubFile(`posts/${slug}.mdx`, `delete: remove ${slug} post`)
        enDeleted = true
      } catch (e) {
        // File may not exist
      }

      try {
        await deleteGitHubFile(`posts/ko/${slug}.mdx`, `delete: remove ${slug} (KO) post`)
        koDeleted = true
      } catch (e) {
        // File may not exist
      }

      if (!enDeleted && !koDeleted) {
        throw new Error('Post not found')
      }
    } else {
      // Use local filesystem in development
      const enFile = path.join(postsDir, `${slug}.mdx`)
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)

      let enDeleted = false
      let koDeleted = false

      try {
        fs.unlinkSync(enFile)
        enDeleted = true
      } catch (e) {
        // File may not exist
      }

      try {
        fs.unlinkSync(koFile)
        koDeleted = true
      } catch (e) {
        // File may not exist
      }

      if (!enDeleted && !koDeleted) {
        throw new Error('Post not found')
      }

      // Git operations (local only)
      const cwd = process.cwd()
      try {
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

        execSync(`git add -A`, { cwd, stdio: 'pipe' })

        const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
        if (status.trim()) {
          execSync(`git commit -m "delete: remove ${slug} post"`, { cwd, stdio: 'pipe' })
          execSync('git push origin main', { cwd, stdio: 'pipe' })
        }
      } catch (gitError) {
        console.error('Git operation error:', gitError instanceof Error ? gitError.message : String(gitError))
        throw new Error(`Git error: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
      }
    }

    // Invalidate related caches
    revalidatePath(`/posts/${slug}`)
    revalidatePath(`/posts/[slug]`)
    revalidatePath('/')
    revalidatePath('/', 'layout')

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
