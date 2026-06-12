'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PostMeta } from '@/lib/posts'
import AdminImageManager from './AdminImageManager'


interface AdminClientProps {
  publishedPosts: PostMeta[]
  draftPosts: PostMeta[]
}

export default function AdminClient({ publishedPosts, draftPosts }: AdminClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'drafts' | 'images'>('all')


  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) {
      setToken(stored)
      setAuthenticated(true)
    }
    setMounted(true)
  }, [])

  function handleNewPost() {
    const raw = prompt('Enter a slug for the new post (e.g. my-new-post):')
    if (!raw) return
    const slug = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (slug) {
      router.push(`/admin/${slug}`)
    } else {
      alert('Invalid slug!')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLogging(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('admin_token', data.token)
          setToken(data.token)
          setAuthenticated(true)
          setPassword('')
        }
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setLogging(false)
    }
  }

  async function handleLogout() {
    const currentToken = localStorage.getItem('admin_token')
    if (currentToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
        })
      } catch (err) {
        console.error('Logout request failed:', err)
      }
    }
    localStorage.removeItem('admin_token')
    setToken(null)
    setAuthenticated(false)
    setPassword('')
  }

  if (!mounted) return null

  const allPosts = publishedPosts
  const filteredPosts = tab === 'all' ? allPosts : draftPosts
  const hasDrafts = draftPosts.length > 0

  /* ── Login ──────────────────────────────────────────────────────────── */
  if (!authenticated) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          {/* Brand anchor — continuity from main site */}
          <span className="admin-login-logo">GLOWTRIS BLOG</span>

          {/* Identity cluster — proximity */}
          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-sub">Blog Post Editor</p>

          {/* Form — closure: contained input unit */}
          <form onSubmit={handleLogin} className="admin-form">
            <div>
              <label className="admin-label">Password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={logging}
                className="admin-input"
              />
            </div>

            {error && <div className="admin-error">{error}</div>}

            <button
              type="submit"
              disabled={logging}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {logging ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Admin dashboard ─────────────────────────────────────────────────── */
  return (
    <div className="admin-root">
      {/* Header — figure-ground: surface above bg */}
      <div className="admin-header">
        <div className="admin-header-inner">
          {/* Info cluster — proximity */}
          <div className="admin-header-info">
            <span className="admin-header-title"><span className="material-icons-round" style={{ fontSize: '15px', verticalAlign: 'middle' }}>edit</span> Blog Editor</span>
            <span className="admin-header-sub">
              {tab === 'images' ? (
                'Manage blog image assets'
              ) : (
                `${filteredPosts.length} ${tab === 'drafts' ? 'draft' : 'published'}${filteredPosts.length !== 1 ? 's' : ''} · EN / KO simultaneous editing`
              )}
            </span>
          </div>
          {/* Actions cluster */}
          <div className="admin-header-actions">
            <button onClick={handleNewPost} className="admin-btn admin-btn-primary">
              <span className="material-icons-round" style={{ fontSize: '14px', verticalAlign: 'middle' }}>add</span> New Post
            </button>
            <Link href="/" className="admin-btn admin-btn-secondary admin-back-blog-btn">
              ← Blog
            </Link>
            <button onClick={handleLogout} className="admin-btn admin-btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="admin-body">
        {/* Tab divider */}
        <div style={{
          display: 'flex',
          gap: '1px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}>
          <button
            onClick={() => setTab('all')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: tab === 'all' ? 700 : 400,
              color: tab === 'all' ? 'var(--text-primary)' : 'var(--text-faint)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === 'all' ? '2px solid var(--text-primary)' : 'none',
              marginBottom: '-12px',
              paddingBottom: '20px',
            }}
          >
            Published ({allPosts.length})
          </button>
          {hasDrafts && (
            <button
              onClick={() => setTab('drafts')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: tab === 'drafts' ? 700 : 400,
                color: tab === 'drafts' ? 'var(--text-primary)' : 'var(--text-faint)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: tab === 'drafts' ? '2px solid var(--text-primary)' : 'none',
                marginBottom: '-12px',
                paddingBottom: '20px',
              }}
            >
              <span className="material-icons-round" style={{ fontSize: '13px', verticalAlign: 'middle' }}>edit_note</span> Drafts ({draftPosts.length})
            </button>
          )}
          <button
            onClick={() => setTab('images')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: tab === 'images' ? 700 : 400,
              color: tab === 'images' ? 'var(--text-primary)' : 'var(--text-faint)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === 'images' ? '2px solid var(--text-primary)' : 'none',
              marginBottom: '-12px',
              paddingBottom: '20px',
            }}
          >
            <span className="material-icons-round" style={{ fontSize: '13px', verticalAlign: 'middle' }}>image</span> Images
          </button>
        </div>

        {tab === 'images' ? (
          <AdminImageManager />
        ) : (
          <div className="admin-posts-grid">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/admin/${post.slug}`}
                className="admin-post-card"
                style={post.draft ? { opacity: 0.7 } : {}}
              >
                {/* Top cluster — title + badges */}
                <div className="admin-card-top">
                  <h3 className="admin-card-title">
                    {post.title}
                    {post.draft && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}><span className="material-icons-round" style={{ fontSize: '12px', verticalAlign: 'middle' }}>edit_note</span> DRAFT</span>}
                  </h3>
                  <span className="admin-card-badge">{post.category}</span>
                </div>

                {/* Description */}
                <p className="admin-card-desc">{post.description}</p>

                {/* Meta cluster — separated from content by border */}
                <div className="admin-card-meta">
                  <span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    {post.author}
                  </span>
                  <span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    {new Date(post.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
