'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'

export default function AdminClient({ posts }: { posts: PostMeta[] }) {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

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
    }
  }

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px' }}>
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
          {error && <p style={{ color: '#d32f2f', fontSize: '13px' }}>{error}</p>}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#0f0f11',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Blog Editor</h1>
        <button
          onClick={() => setAuthenticated(false)}
          style={{
            padding: '6px 12px',
            background: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/admin/${post.slug}`}
            style={{
              padding: '16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 700 }}>{post.title}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>{post.description}</p>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
              <span style={{ display: 'inline-block', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                {post.category}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
