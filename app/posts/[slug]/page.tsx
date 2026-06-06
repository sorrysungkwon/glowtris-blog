import { getPost, getSlugs } from '@/lib/posts'
import { formatDate } from '@/lib/utils'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = getPost(slug)
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

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  let post
  try {
    post = getPost(slug)
  } catch {
    notFound()
  }

  return (
    <div className="post-page">
      <Link href="/" className="post-back">← All posts</Link>

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
          <span>{post.readingTime}분 읽기</span>
        </div>
      </header>

      <article className="mdx">
        <MDXRemote source={post.content} />
      </article>
    </div>
  )
}
