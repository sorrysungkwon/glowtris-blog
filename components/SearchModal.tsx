'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'
import { searchPosts } from '@/lib/search'
import { formatDate } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  posts: PostMeta[]
  lang?: string
}

export default function SearchModal({ isOpen, onClose, posts, lang }: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const results = query.trim() ? searchPosts(posts, query, lang) : []
  const resultsCount = results.length

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(-1)
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle keydown global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetIdx = selectedIndex > -1 ? selectedIndex : 0
      if (results[targetIdx]) {
        const slug = results[targetIdx].slug
        onClose()
        window.location.href = lang === 'ko' ? `/posts/${slug}?lang=ko` : `/posts/${slug}`
      }
    }
  }

  useEffect(() => {
    if (selectedIndex > -1 && resultsRef.current) {
      const children = resultsRef.current.children
      if (selectedIndex < children.length) {
        const activeEl = children[selectedIndex] as HTMLElement
        if (activeEl && typeof activeEl.scrollIntoView === 'function') {
          activeEl.scrollIntoView({ block: 'nearest' })
        }
      }
    }
  }, [selectedIndex, resultsCount])

  if (!isOpen) return null

  const highlightText = (text: string | undefined | null, search: string) => {
    const safeText = text || ''
    if (!search.trim()) return safeText
    const idx = safeText.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return safeText
    const match = safeText.slice(idx, idx + search.length)
    return (
      <>
        {safeText.slice(0, idx)}
        <mark className="search-highlight-mark">{match}</mark>
        {safeText.slice(idx + search.length)}
      </>
    )
  }

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-container" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <svg
            className="search-modal-icon"
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
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder={lang === 'ko' ? '포스트 내용, 제목으로 검색...' : 'Search posts by title, body...'}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="search-modal-esc">ESC</span>
        </div>

        <div className="search-modal-body" ref={resultsRef}>
          {query.trim() === '' ? (
            <div className="search-modal-state">
              {lang === 'ko' ? '검색어를 입력해 주세요...' : 'Type to start searching...'}
            </div>
          ) : results.length === 0 ? (
            <div className="search-modal-state">
              {lang === 'ko' ? `"${query}" 에 대한 결과가 없습니다.` : `No results found for "${query}"`}
            </div>
          ) : (
            results.map((item, idx) => (
              <Link
                key={item.slug}
                href={lang === 'ko' ? `/posts/${item.slug}?lang=ko` : `/posts/${item.slug}`}
                className={`search-modal-item ${selectedIndex === idx ? 'selected' : ''}`}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="search-modal-item-meta">
                  <span className="search-modal-item-category">{item.category}</span>
                  <span className="search-modal-item-date">{formatDate(item.date)}</span>
                </div>
                <div className="search-modal-item-title">
                  {highlightText(lang === 'ko' ? (item.title_ko ?? item.title) : item.title, query)}
                </div>
                {item.matchType !== 'title' && (
                  <div className="search-modal-item-match">
                    <span className="search-modal-match-context">
                      {highlightText(item.matchText, query)}
                    </span>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
