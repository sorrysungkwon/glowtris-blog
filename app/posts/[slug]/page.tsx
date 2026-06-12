import { getPost, getSlugs, getAllPostMeta } from '@/lib/posts'
import { formatDate } from '@/lib/utils'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PostCard from '@/components/PostCard'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { lang = 'en' } = await searchParams
  try {
    const post = await getPost(slug, lang)
    const title = lang === 'ko' ? (post.title_ko || post.title) : post.title
    const description = lang === 'ko' ? (post.description_ko || post.description) : post.description
    return {
      title,
      description,
      openGraph: {
        title,
        description,
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
    post = await getPost(slug, lang)
  } catch {
    notFound()
  }

  const backHref = lang === 'ko' ? '/?lang=ko' : '/'
  const readUnit = lang === 'ko' ? '분 읽기' : 'min read'

  // Get recommended posts — same category first, fill remainder from other posts
  const allPosts = await getAllPostMeta(lang)
  const sameCat = allPosts.filter(p => p.category === post.category && p.slug !== slug)
  const otherPosts = allPosts.filter(p => p.category !== post.category && p.slug !== slug)
  const postsToShow = [...sameCat, ...otherPosts].slice(0, 3)
  const isSameCategory = sameCat.length > 0

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
        <h1>{lang === 'ko' ? (post.title_ko || post.title) : post.title}</h1>
        <div className="post-meta-row">
          <span>{post.authorEmoji} {post.author}</span>
          <span className="dot">·</span>
          <span>{formatDate(post.date)}</span>
          <span className="dot">·</span>
          <span>{post.readingTime} {readUnit}</span>
        </div>
      </header>

      <article className="mdx">
        <MDXRemote source={post.content} />
      </article>

      {/* Recommended posts nudge */}
      {postsToShow.length > 0 && (
        <div className="post-nudge">
          <h2 className="post-nudge-title">
            {isSameCategory
              ? (lang === 'ko' ? `다른 ${post.category} 글` : `More in ${post.category}`)
              : (lang === 'ko' ? '다음 글을 읽어보세요' : 'Keep reading')
            }
          </h2>
          <div className="nudge-grid">
            {postsToShow.map(p => (
              <PostCard key={p.slug} post={p} lang={lang} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
