'use client'

import { useState } from 'react'
import PostCard from './PostCard'
import type { PostMeta } from '@/lib/posts'
import { searchPosts } from '@/lib/search'

const ALL_CATEGORIES = ['ALL', 'DEV', 'DESIGN', 'UPDATE', 'GUIDE', 'NOTICE', 'STORIES']

interface Props {
  posts: PostMeta[]
  lang?: string
}

export default function PostGrid({ posts, lang }: Props) {
  const [active, setActive] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const available = ALL_CATEGORIES.filter(
    c => c === 'ALL' || posts.some(p => p.category === c)
  )

  const query = searchQuery.trim()
  const searched = query ? searchPosts(posts, query) : posts
  const filtered = active === 'ALL' ? searched : searched.filter(p => p.category === active)

  // Disable featured layout when a search query is active
  const hasSearch = query.length > 0
  const featuredPost =
    !hasSearch && active === 'ALL' ? (filtered.find(p => p.featured) ?? filtered[0]) : null

  const rest = featuredPost
    ? filtered.filter(p => p.slug !== featuredPost.slug)
    : filtered

  return (
    <>
      <div className="filter-container">
        {/* Filter bar — Gestalt: similarity (all buttons identical shape/weight) */}
        <div className="filter-section">
          <span className="filter-label">Filter</span>
          {available.map(cat => (
            <button
              key={cat}
              className={`filter-btn${active === cat ? ' active' : ''}`}
              onClick={() => {
                setActive(cat)
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
              />
            </svg>
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ko' ? '포스트 검색...' : 'Search posts...'}
              aria-label="Search posts"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result count — shown when searching */}
      {hasSearch && (
        <p className="search-result-count">
          {filtered.length === 0
            ? (lang === 'ko' ? '결과 없음' : 'No results')
            : lang === 'ko'
              ? `"${query}" — ${filtered.length}개`
              : `"${query}" — ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* Post grid — common fate: all cards share same hover behavior */}
      <div className="post-grid">
        {featuredPost && <PostCard post={featuredPost} featured lang={lang} />}
        {rest.map(post => (
          <PostCard key={post.slug} post={post} lang={lang} />
        ))}
        {filtered.length === 0 && (
          <p className="grid-empty">
            {hasSearch
              ? (lang === 'ko' ? `"${query}"에 맞는 포스트가 없습니다.` : `No posts found for "${query}".`)
              : (lang === 'ko' ? '포스트가 없습니다.' : 'No posts yet.')
            }
          </p>
        )}
      </div>
    </>
  )
}

