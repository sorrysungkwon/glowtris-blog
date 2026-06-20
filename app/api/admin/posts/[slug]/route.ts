import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { revalidatePath } from 'next/cache'
import matter from 'gray-matter'
import { compile } from '@mdx-js/mdx'
import { requireAuth } from '@/lib/auth'
import { fetchRawFile, putFile, deleteFile } from '@/lib/github'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/
const FRONTMATTER_STRIP_RE = /^---\n[\s\S]*?\n---\n/

// Slug whitelist: blocks path traversal (../) and shell metacharacters
// since slug flows into file paths, GitHub API paths, and git commands.
const SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,99}$/i

function invalidSlug(slug: string): NextResponse | null {
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }
  return null
}

function splitPost(raw: string): { frontmatter: string; content: string } {
  const match = raw.match(FRONTMATTER_RE)
  return {
    frontmatter: match ? match[1] : '',
    content: raw.replace(FRONTMATTER_STRIP_RE, ''),
  }
}

/* ── MDX auto-sanitizer ─────────────────────────────────────────────────
   Applies safe, reversible transforms to the *body* content (not frontmatter)
   to prevent the most common MDX v3 parse errors writers hit:

   1. class= → className=  (MDX is JSX; class is not a valid JSX attribute)
   2. Multi-line content inside inline HTML elements collapses onto one line
      e.g. <figcaption>text\n  </figcaption>  →  <figcaption>text</figcaption>
   3. Bare < / > that are NOT part of tags get escaped
      (only when they look like stray angle brackets, not real tags)

   Returns { content: string, fixes: string[] }                           */
function sanitizeMDXContent(raw: string): { content: string; fixes: string[] } {
  const fixes: string[] = []
  let content = raw

  // 1. class= → className= inside HTML opening tags
  const classRe = /(<[a-zA-Z][^>]*)\bclass=/g
  if (classRe.test(content)) {
    content = content.replace(/(<[a-zA-Z][^>]*)\bclass=/g, '$1className=')
    fixes.push('Converted class= → className= (MDX requires JSX attribute names)')
  }

  // 2. Collapse multi-line inline HTML elements that MDX can't parse
  //    Targets tags whose opening and closing tag are NOT on the same line
  //    and whose inner content does not itself contain block-level HTML.
  //    Covers: figcaption, span, em, strong, a, cite, code, kbd, sub, sup
  const inlineTags = ['figcaption', 'span', 'em', 'strong', 'a', 'cite', 'code', 'kbd', 'sub', 'sup', 'mark', 'small', 'del', 'ins']
  for (const tag of inlineTags) {
    const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\/${tag}>`, 'g')
    let changed = false
    content = content.replace(re, (_match, attrs, inner) => {
      if (!inner.includes('\n')) return _match // already single-line
      changed = true
      const collapsed = inner.replace(/\n\s*/g, ' ').trim()
      return `<${tag}${attrs}>${collapsed}</${tag}>`
    })
    if (changed) {
      fixes.push(`Collapsed multi-line <${tag}> onto a single line (MDX v3 requirement)`)
    }
  }

  return { content, fixes }
}

/* ── MDX compile-time validator ─────────────────────────────────────────
   Runs the real @mdx-js/mdx compiler on the *full* file content (including
   frontmatter stripped) so we catch syntax errors before they reach Vercel.
   Returns null when valid, or a human-readable error string.              */
async function validateMDXContent(bodyContent: string): Promise<string | null> {
  try {
    await compile(bodyContent, {
      outputFormat: 'function-body',
      development: false,
    })
    return null // compilation succeeded
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message: string }).message
      // Extract line number if present
      const lineMatch = msg.match(/(\d+):(\d+)/)
      if (lineMatch) {
        return `MDX syntax error at line ${lineMatch[1]}, column ${lineMatch[2]}: ${msg.split('\n')[0]}`
      }
      return `MDX syntax error: ${msg.split('\n')[0]}`
    }
    return 'MDX compilation failed — check for unclosed tags, stray { } characters, or invalid HTML attributes'
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
  const auth = requireAuth(req)
  if (!auth.valid) return auth.response

  const { slug } = await params
  const slugError = invalidSlug(slug)
  if (slugError) return slugError

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
  const slugError = invalidSlug(slug)
  if (slugError) return slugError

  try {
    const { frontmatter, content_en, content_ko, deploy = false } = await req.json()

    // ── Auto-sanitize MDX content (fix class=, multi-line tags, etc.) ──
    const { content: sanitizedEn, fixes: fixesEn } = sanitizeMDXContent(content_en || '')
    const { content: sanitizedKo, fixes: fixesKo } = sanitizeMDXContent(content_ko || '')
    const allFixes = [...fixesEn.map(f => `EN: ${f}`), ...fixesKo.map(f => `KO: ${f}`)]

    // Map title_ko/description_ko to title/description for the KO file
    let koFrontmatter = frontmatter
    try {
      const { data } = matter(`---\n${frontmatter}\n---`)
      if (data.title_ko) {
        koFrontmatter = koFrontmatter.replace(/^title:.*$/m, `title: ${JSON.stringify(data.title_ko)}`)
      }
      if (data.description_ko) {
        koFrontmatter = koFrontmatter.replace(/^description:.*$/m, `description: ${JSON.stringify(data.description_ko)}`)
      }
      koFrontmatter = koFrontmatter.replace(/^title_ko:.*$\n?/m, '')
      koFrontmatter = koFrontmatter.replace(/^description_ko:.*$\n?/m, '')
    } catch (e) {
      // Ignored: validation catches it later
    }

    const enContent = `---\n${frontmatter}\n---\n${sanitizedEn}`
    const koContent = sanitizedKo?.trim() ? `---\n${koFrontmatter}\n---\n${sanitizedKo}` : null

    // ── Validate frontmatter ─────────────────────────────────────────
    try {
      const { data } = matter(enContent)
      if (!data.title || !data.date) {
        return NextResponse.json({
          error: 'Invalid frontmatter',
          details: 'Frontmatter must include title and date',
        }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid frontmatter',
        details: `Frontmatter is not valid YAML: ${e instanceof Error ? e.message : String(e)}`,
      }, { status: 400 })
    }

    // ── Validate MDX compilation ──────────────────────────────────────
    const enValidationError = await validateMDXContent(sanitizedEn)
    if (enValidationError) {
      return NextResponse.json({
        error: 'MDX validation failed (EN)',
        details: enValidationError,
      }, { status: 422 })
    }
    if (sanitizedKo?.trim()) {
      const koValidationError = await validateMDXContent(sanitizedKo)
      if (koValidationError) {
        return NextResponse.json({
          error: 'MDX validation failed (KO)',
          details: koValidationError,
        }, { status: 422 })
      }
    }


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

    // Return sanitized content + fix list so the editor can update its state
    return NextResponse.json({
      success: true,
      deployed: deploy,
      fixes: allFixes,
      sanitized_en: sanitizedEn,
      sanitized_ko: sanitizedKo,
    })

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
  const slugError = invalidSlug(slug)
  if (slugError) return slugError

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
