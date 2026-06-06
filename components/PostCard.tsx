'use client'

import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'
import { formatDate } from '@/lib/utils'

interface Props {
  post: PostMeta
  featured?: boolean
}

export default function PostCard({ post, featured }: Props) {
  return (
    <Link href={`/posts/${post.slug}`} className={`post-card${featured ? ' featured' : ''}`}>
      <div className="post-cover" style={{ background: post.coverGradient }}>
        {post.coverEmoji && (
          <span className="post-cover-emoji" aria-hidden="true">{post.coverEmoji}</span>
        )}
        <span className="post-category">{post.category}</span>
      </div>
      <div className="post-body">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-desc">{post.description}</p>
        <div className="post-footer">
          <span className="post-author">{post.authorEmoji} {post.author}</span>
          <div className="post-meta">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTime}분</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
