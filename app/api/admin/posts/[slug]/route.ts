import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { revalidatePath } from 'next/cache'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

async function fetchGitHubFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const content = await response.text()

    // Get SHA for update operations
    const metaResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    const metaData = await metaResponse.json()
    return { content, sha: metaData.sha }
  } catch (error) {
    console.error('GitHub fetch error:', error)
    return null
  }
}

async function updateGitHubFile(
  filePath: string,
  content: string,
  message: string
): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials not configured')
  }

  try {
    // Get current SHA if file exists
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
      // File doesn't exist, will create new
    }

    const requestBody: any = {
      message,
      content: Buffer.from(content).toString('base64'),
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
      // Use GitHub API in production
      const enFile = await fetchGitHubFile(`posts/${slug}.mdx`)
      if (!enFile) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const enMatch = enFile.content.match(/^---\n([\s\S]*?)\n---/)
      const frontmatter = enMatch ? enMatch[1] : ''
      const content_en = enFile.content.replace(/^---\n[\s\S]*?\n---\n/, '')

      // Try to load KO version
      const koFile = await fetchGitHubFile(`posts/ko/${slug}.mdx`)
      const content_ko = koFile ? koFile.content.replace(/^---\n[\s\S]*?\n---\n/, '') : ''

      return NextResponse.json({ frontmatter, content_en, content_ko })
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
  const { slug } = await params
  try {
    const { frontmatter, content_en, content_ko } = await req.json()

    if (isProduction) {
      // Use GitHub API in production
      const enContent = `---\n${frontmatter}\n---\n${content_en}`
      await updateGitHubFile(`posts/${slug}.mdx`, enContent, `edit: update ${slug} (EN/KO) via admin editor`)

      // Update KO file if has content
      if (content_ko && content_ko.trim()) {
        const koContent = `---\n${frontmatter}\n---\n${content_ko}`
        await updateGitHubFile(`posts/ko/${slug}.mdx`, koContent, `edit: update ${slug} (KO) via admin editor`)
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
          execSync(`git commit -m "edit: update ${slug} (EN/KO) via admin editor"`, { cwd, stdio: 'pipe' })
          execSync('git push origin main', { cwd, stdio: 'pipe' })
        }
      } catch (gitError) {
        console.error('Git operation error:', gitError instanceof Error ? gitError.message : String(gitError))
        throw new Error(`Git error: ${gitError instanceof Error ? gitError.message : String(gitError)}`)
      }
    }

    revalidatePath(`/posts/${slug}`)
    revalidatePath('/', 'layout')
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

    revalidatePath(`/posts/${slug}`)
    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete post',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
