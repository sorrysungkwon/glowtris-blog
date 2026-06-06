import { getPost, getSlugs } from '@/lib/posts'
import { formatDate } from '@/lib/utils'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

export async function generateStaticParams() {
  return getSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { lang = 'en' } = await searchParams
  try {
    const post = getPost(slug, lang)
    return {
      title: post.title,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
      },
    }
  } catch {
    return {}
  }
}

export default async function PostPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lang = 'en' } = await searchParams

  let post
  try {
    post = getPost(slug, lang)
  } catch {
    notFound()
  }

  const backHref = lang === 'ko' ? '/?lang=ko' : '/'
  const readUnit = lang === 'ko' ? '분 읽기' : 'min read'

  return (
    <div className="post-page">
      <Link href={backHref} className="post-back">← All posts</Link>

      <div className="post-hero" style={{ background: post.coverGradient }}>
        {post.coverEmoji && (
          <span className="post-cover-emoji" aria-hidden="true">{post.coverEmoji}</span>
        )}
        <span className="post-hero-cat">{post.category}</span>
      </div>

      <header className="post-header">
        <h1>{post.title}</h1>
        <div className="post-meta-row">
          <span>{post.authorEmoji} {post.author}</span>
          <span className="dot">·</span>
          <span>{formatDate(post.date, true)}</span>
          <span className="dot">·</span>
          <span>{post.readingTime} {readUnit}</span>
        </div>
      </header>

      <article className="mdx">
        <MDXRemote source={post.content} />
      </article>
    </div>
  )
}
