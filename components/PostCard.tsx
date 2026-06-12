'use client'

import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'
import { formatDate } from '@/lib/utils'

interface Props {
  post: PostMeta
  featured?: boolean
  lang?: string
}

export default function PostCard({ post, featured, lang }: Props) {
  const isKo = lang === 'ko'
  const title = isKo ? (post.title_ko ?? post.title) : post.title
  const desc = isKo ? (post.description_ko ?? post.description) : post.description
  const href = isKo ? `/posts/${post.slug}?lang=ko` : `/posts/${post.slug}`
  const readUnit = isKo ? '분' : 'min'

  return (
    <Link href={href} className={`post-card${featured ? ' featured' : ''}`}>
      {/* Cover — figure-ground: gradient backdrop makes card float */}
      <div className="post-cover" style={{ background: post.coverGradient }}>
        {post.coverEmoji && (
          <span className="post-cover-emoji" aria-hidden="true">{post.coverEmoji}</span>
        )}
        <span className="post-category">{post.category}</span>
      </div>

      {/* Body — proximity: two clusters */}
      <div className="post-body">
        {/* Cluster 1: title + description (tightly spaced) */}
        <h2 className="post-title">{title}</h2>
        <p className="post-desc">{desc}</p>

        {/* Cluster 2: meta (separated by border) */}
        <div className="post-footer">
          <span className="post-author">
            <span>{post.authorEmoji}</span>
            <span>{post.author}</span>
          </span>
          <div className="post-meta-chips">
            <span>{formatDate(post.date)}</span>
            <span className="post-meta-dot">·</span>
            <span>{post.readingTime} {readUnit}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
