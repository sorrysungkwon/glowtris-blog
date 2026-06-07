import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
export { formatDate } from './utils'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

async function fetchFromGitHub(filePath: string): Promise<string | null> {
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

    return await response.text()
  } catch (error) {
    console.error('GitHub fetch error:', error)
    return null
  }
}

async function listFilesFromGitHub(dirPath: string): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return []
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
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
}

export interface Post extends PostMeta {
  content: string
}

export async function getAllPostMeta(lang?: string): Promise<PostMeta[]> {
  let files: string[] = []
  const dir = lang === 'ko' ? 'posts/ko' : 'posts'

  if (isProduction) {
    // Use GitHub API in production
    files = await listFilesFromGitHub(dir)
  } else {
    // Use local filesystem in development
    const targetDir = lang === 'ko' ? path.join(postsDir, 'ko') : postsDir
    if (!fs.existsSync(targetDir)) return []
    files = fs.readdirSync(targetDir).filter(f => f.endsWith('.mdx'))
  }

  const posts: PostMeta[] = []

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    let content: string | null = null

    if (isProduction) {
      content = await fetchFromGitHub(`${dir}/${file}`)
    } else {
      try {
        const targetDir = lang === 'ko' ? path.join(postsDir, 'ko') : postsDir
        content = fs.readFileSync(path.join(targetDir, file), 'utf8')
      } catch (e) {
        content = null
      }
    }

    if (content) {
      const { data } = matter(content)
      posts.push({ slug, ...data } as PostMeta)
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPost(slug: string, lang?: string): Promise<Post> {
  let content: string | null = null

  if (lang === 'ko') {
    if (isProduction) {
      content = await fetchFromGitHub(`posts/ko/${slug}.mdx`)
    } else {
      const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)
      if (fs.existsSync(koFile)) {
        content = fs.readFileSync(koFile, 'utf8')
      }
    }

    if (content) {
      const { data, content: postContent } = matter(content)
      return { slug, content: postContent, ...data } as Post
    }
  }

  // Fallback to English
  if (isProduction) {
    content = await fetchFromGitHub(`posts/${slug}.mdx`)
  } else {
    const file = path.join(postsDir, `${slug}.mdx`)
    content = fs.readFileSync(file, 'utf8')
  }

  if (!content) {
    throw new Error(`Post ${slug} not found`)
  }

  const { data, content: postContent } = matter(content)
  return { slug, content: postContent, ...data } as Post
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
