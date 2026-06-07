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
  const [searchQuery, setSearchQuery] = useState('')

  const available = ALL_CATEGORIES.filter(
    c => c === 'ALL' || posts.some(p => p.category === c)
  )

  const filtered = posts.filter(p => {
    const matchesCategory = active === 'ALL' || p.category === active
    
    const query = searchQuery.trim().toLowerCase()
    if (!query) return matchesCategory

    const titleMatch = (p.title || '').toLowerCase().includes(query) || (p.title_ko || '').toLowerCase().includes(query)
    const descMatch = (p.description || '').toLowerCase().includes(query) || (p.description_ko || '').toLowerCase().includes(query)
    const slugMatch = (p.slug || '').toLowerCase().includes(query)
    const catMatch = (p.category || '').toLowerCase().includes(query)

    return matchesCategory && (titleMatch || descMatch || slugMatch || catMatch)
  })

  // Disable featured layout when a search query is active
  const hasSearch = searchQuery.trim().length > 0
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

      {/* Post grid — common fate: all cards share same hover behavior */}
      <div className="post-grid">
        {featuredPost && <PostCard post={featuredPost} featured lang={lang} />}
        {rest.map(post => (
          <PostCard key={post.slug} post={post} lang={lang} />
        ))}
        {filtered.length === 0 && (
          <p className="grid-empty">
            {lang === 'ko'
              ? '검색 결과와 일치하는 포스트가 없습니다.'
              : 'No posts match your search.'}
          </p>
        )}
      </div>
    </>
  )
}

