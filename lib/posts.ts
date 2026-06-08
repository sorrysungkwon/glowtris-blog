import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
export { formatDate } from './utils'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

async function fetchFromGitHub(filePath: string, branch = 'main'): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) return null

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

    return await response.text()
  } catch (error) {
    console.error('GitHub fetch error:', error)
    return null
  }
}

async function listFilesFromGitHub(dirPath: string, branch = 'main'): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) return []

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const files = await response.json()
    return files
      .filter((f: any) => f.type === 'file' && f.name.endsWith('.mdx'))
      .map((f: any) => f.name)
  } catch (error) {
    console.error('GitHub list error:', error)
    return []
  }
}

export interface PostMeta {
  slug: string
  title: string
  title_ko?: string
  description: string
  description_ko?: string
  date: string
  category: string
  author: string
  authorEmoji: string
  readingTime: number
  coverGradient: string
  coverEmoji?: string
  featured?: boolean
  draft?: boolean
}

export interface Post extends PostMeta {
  content: string
}

export async function getAllPostMeta(lang?: string, includeDrafts: boolean = false, branch = 'main'): Promise<PostMeta[]> {
  let files: string[] = []
  const dir = lang === 'ko' ? 'posts/ko' : 'posts'

  try {
    if (isProduction) {
      files = await listFilesFromGitHub(dir, branch)
    } else {
      const targetDir = lang === 'ko' ? path.join(postsDir, 'ko') : postsDir
      if (!fs.existsSync(targetDir)) return []
      files = fs.readdirSync(targetDir).filter(f => f.endsWith('.mdx'))
    }
  } catch (e) {
    console.error(`Error listing files in ${dir}:`, e)
    return []
  }

  const posts: PostMeta[] = []

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    let content: string | null = null

    try {
      if (isProduction) {
        content = await fetchFromGitHub(`${dir}/${file}`, branch)
      } else {
        const targetDir = lang === 'ko' ? path.join(postsDir, 'ko') : postsDir
        content = fs.readFileSync(path.join(targetDir, file), 'utf8')
      }
    } catch (e) {
      console.error(`Error reading file ${file}:`, e)
      continue
    }

    if (!content) {
      console.warn(`Empty content for ${slug}`)
      continue
    }

    try {
      const { data } = matter(content)

      // Validate essential metadata
      if (!data.title || !data.date) {
        console.warn(`Post ${slug} missing required fields (title or date)`)
        continue
      }

      const post = { slug, ...data } as PostMeta

      // Filter out draft posts unless explicitly included
      if (post.draft && !includeDrafts) {
        continue
      }

      posts.push(post)
    } catch (e) {
      console.error(`Error parsing frontmatter for ${slug}:`, e)
      continue
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPost(slug: string, lang?: string, includeDraft: boolean = false, branch = 'main'): Promise<Post> {
  let content: string | null = null

  if (lang === 'ko') {
    try {
      if (isProduction) {
        content = await fetchFromGitHub(`posts/ko/${slug}.mdx`, branch)
      } else {
        const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)
        if (fs.existsSync(koFile)) {
          content = fs.readFileSync(koFile, 'utf8')
        }
      }

      if (content) {
        const { data, content: postContent } = matter(content)
        if (!postContent || !data.title) {
          throw new Error(`Invalid post structure for ${slug}`)
        }
        const post = { slug, content: postContent, ...data } as Post
        if (post.draft && !includeDraft) {
          throw new Error(`Post ${slug} is in draft`)
        }
        return post
      }
    } catch (e) {
      console.warn(`Error loading Korean post ${slug}, falling back to English:`, e)
    }
  }

  // Fallback to English
  try {
    if (isProduction) {
      content = await fetchFromGitHub(`posts/${slug}.mdx`, branch)
    } else {
      const file = path.join(postsDir, `${slug}.mdx`)
      content = fs.readFileSync(file, 'utf8')
    }
  } catch (e) {
    console.error(`Error reading post ${slug}:`, e)
    throw new Error(`Post ${slug} not found`)
  }

  if (!content) {
    throw new Error(`Post ${slug} not found or empty`)
  }

  try {
    const { data, content: postContent } = matter(content)
    if (!postContent || !data.title) {
      throw new Error(`Invalid post structure for ${slug}`)
    }
    const post = { slug, content: postContent, ...data } as Post
    if (post.draft && !includeDraft) {
      throw new Error(`Post ${slug} is in draft`)
    }
    return post
  } catch (e) {
    console.error(`Error parsing post ${slug}:`, e)
    throw new Error(`Failed to parse post ${slug}`)
  }
}

export async function getSlugs(): Promise<string[]> {
  let files: string[] = []

  if (isProduction) {
    files = await listFilesFromGitHub('posts')
  } else {
    if (!fs.existsSync(postsDir)) return []
    files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'))
  }

  return files.map(f => f.replace(/\.mdx$/, ''))
}
