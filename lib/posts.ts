import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fetchRawFile, listMdxFiles } from './github'
export { formatDate } from './utils'

const postsDir = path.join(process.cwd(), 'posts')
const isProduction = process.env.NODE_ENV === 'production'

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

function localDir(lang?: string): string {
  return lang === 'ko' ? path.join(postsDir, 'ko') : postsDir
}

export async function getAllPostMeta(lang?: string, includeDrafts: boolean = false, branch = 'main'): Promise<PostMeta[]> {
  let files: string[] = []
  const dir = lang === 'ko' ? 'posts/ko' : 'posts'

  try {
    if (isProduction) {
      files = await listMdxFiles(dir, branch)
    } else {
      const targetDir = localDir(lang)
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
        content = await fetchRawFile(`${dir}/${file}`, branch)
      } else {
        content = fs.readFileSync(path.join(localDir(lang), file), 'utf8')
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

      if (!data.title || !data.date) {
        console.warn(`Post ${slug} missing required fields (title or date)`)
        continue
      }

      const post = { slug, ...data } as PostMeta

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

function parsePost(slug: string, raw: string, includeDraft: boolean): Post {
  const { data, content } = matter(raw)
  if (!content || !data.title) {
    throw new Error(`Invalid post structure for ${slug}`)
  }
  const post = { slug, content, ...data } as Post
  if (post.draft && !includeDraft) {
    throw new Error(`Post ${slug} is in draft`)
  }
  return post
}

export async function getPost(slug: string, lang?: string, includeDraft: boolean = false, branch = 'main'): Promise<Post> {
  if (lang === 'ko') {
    try {
      let content: string | null = null
      if (isProduction) {
        content = await fetchRawFile(`posts/ko/${slug}.mdx`, branch)
      } else {
        const koFile = path.join(postsDir, 'ko', `${slug}.mdx`)
        if (fs.existsSync(koFile)) {
          content = fs.readFileSync(koFile, 'utf8')
        }
      }
      if (content) {
        return parsePost(slug, content, includeDraft)
      }
    } catch (e) {
      console.warn(`Error loading Korean post ${slug}, falling back to English:`, e)
    }
  }

  // English (default / fallback)
  let content: string | null = null
  try {
    if (isProduction) {
      content = await fetchRawFile(`posts/${slug}.mdx`, branch)
    } else {
      content = fs.readFileSync(path.join(postsDir, `${slug}.mdx`), 'utf8')
    }
  } catch (e) {
    console.error(`Error reading post ${slug}:`, e)
    throw new Error(`Post ${slug} not found`)
  }

  if (!content) {
    throw new Error(`Post ${slug} not found or empty`)
  }

  try {
    return parsePost(slug, content, includeDraft)
  } catch (e) {
    console.error(`Error parsing post ${slug}:`, e)
    throw new Error(`Failed to parse post ${slug}`)
  }
}

export async function getSlugs(): Promise<string[]> {
  let files: string[] = []

  if (isProduction) {
    files = await listMdxFiles('posts')
  } else {
    if (!fs.existsSync(postsDir)) return []
    files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'))
  }

  return files.map(f => f.replace(/\.mdx$/, ''))
}
