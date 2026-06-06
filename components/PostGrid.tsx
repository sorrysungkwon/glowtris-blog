'use client'

import { useState } from 'react'
import PostCard from './PostCard'
import type { PostMeta } from '@/lib/posts'

const ALL_CATEGORIES = ['ALL', 'DEV', 'DESIGN', 'UPDATE', 'GUIDE', 'NOTICE']

interface Props {
  posts: PostMeta[]
  lang?: string
}

export default function PostGrid({ posts, lang }: Props) {
  const [active, setActive] = useState('ALL')

  const available = ALL_CATEGORIES.filter(
    c => c === 'ALL' || posts.some(p => p.category === c)
  )

  const filtered = active === 'ALL' ? posts : posts.filter(p => p.category === active)

  const featuredPost =
    active === 'ALL' ? (filtered.find(p => p.featured) ?? filtered[0]) : null
  const rest = featuredPost
    ? filtered.filter(p => p.slug !== featuredPost.slug)
    : filtered

  return (
    <>
      <div className="filter-section">
        {available.map(cat => (
          <button
            key={cat}
            className={`filter-btn${active === cat ? ' active' : ''}`}
            onClick={() => setActive(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="post-grid">
        {featuredPost && <PostCard post={featuredPost} featured lang={lang} />}
        {rest.map(post => (
          <PostCard key={post.slug} post={post} lang={lang} />
        ))}
        {filtered.length === 0 && (
          <p className="grid-empty">No posts in this category yet.</p>
        )}
      </div>
    </>
  )
}
