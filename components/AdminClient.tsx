'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PostMeta } from '@/lib/posts'

export default function AdminClient({ posts }: { posts: PostMeta[] }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_auth')
    if (stored === 'true') setAuthenticated(true)
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
        localStorage.setItem('admin_auth', 'true')
        setAuthenticated(true)
        setPassword('')
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setLogging(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_auth')
    setAuthenticated(false)
    setPassword('')
  }

  if (!mounted) return null

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
            <span className="admin-header-title">✏️ Blog Editor</span>
            <span className="admin-header-sub">
              {posts.length} post{posts.length !== 1 ? 's' : ''} · EN / KO simultaneous editing
            </span>
          </div>
          {/* Actions cluster */}
          <div className="admin-header-actions">
            <button onClick={handleNewPost} className="admin-btn admin-btn-primary">
              ➕ New Post
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
        <p className="admin-section-title">All posts</p>
        <div className="admin-posts-grid">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/admin/${post.slug}`}
              className="admin-post-card"
            >
              {/* Top cluster — title + badge */}
              <div className="admin-card-top">
                <h3 className="admin-card-title">{post.title}</h3>
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
      </div>
    </div>
  )
}
