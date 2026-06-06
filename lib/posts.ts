import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
export { formatDate } from './utils'

const postsDir = path.join(process.cwd(), 'posts')

export interface PostMeta {
  slug: string
  title: string
  description: string
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

export function getAllPostMeta(): PostMeta[] {
  if (!fs.existsSync(postsDir)) return []
  return fs
    .readdirSync(postsDir)
    .filter(f => f.endsWith('.mdx'))
    .map(file => {
      const slug = file.replace(/\.mdx$/, '')
      const { data } = matter(fs.readFileSync(path.join(postsDir, file), 'utf8'))
      return { slug, ...data } as PostMeta
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPost(slug: string): Post {
  const file = path.join(postsDir, `${slug}.mdx`)
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  return { slug, content, ...data } as Post
}

export function getSlugs(): string[] {
  if (!fs.existsSync(postsDir)) return []
  return fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx')).map(f => f.replace(/\.mdx$/, ''))
}

