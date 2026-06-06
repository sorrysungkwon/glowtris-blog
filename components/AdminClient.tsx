'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'

export default function AdminClient({ posts }: { posts: PostMeta[] }) {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)

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
        setAuthenticated(true)
        setPassword('')
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('Authentication failed')
    } finally {
      setLogging(false)
    }
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
        padding: '20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e5e5',
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Admin Panel</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Blog Post Editor</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#333' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={logging}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  opacity: logging ? 0.6 : 1,
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#c33',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={logging}
              style={{
                padding: '10px 16px',
                background: logging ? '#ccc' : '#0f0f11',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: logging ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {logging ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0', marginBottom: '4px' }}>✏️ Blog Editor</h1>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Manage all posts with EN/KO simultaneous editing</p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            style={{
              padding: '8px 16px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e0e0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0f0f0'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/admin/${post.slug}`}
              style={{
                padding: '20px',
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.25s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, flex: 1 }}>{post.title}</h3>
                <span style={{
                  display: 'inline-block',
                  background: '#f0f0f0',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#666',
                  whiteSpace: 'nowrap',
                }}>
                  {post.category}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.5 }}>{post.description}</p>
              <div style={{ fontSize: '11px', color: '#999', display: 'flex', gap: '12px', marginTop: '4px' }}>
                <span>✏️ {post.author}</span>
                <span>📅 {new Date(post.date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
