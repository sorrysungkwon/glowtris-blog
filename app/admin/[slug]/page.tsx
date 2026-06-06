'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'

export default function PostEditor() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [content, setContent] = useState('')
  const [frontmatter, setFrontmatter] = useState('')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/posts/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setFrontmatter(data.frontmatter)
          setContent(data.content)
          setPreview(data.frontmatter + '---\n\n' + data.content)
        }
      } catch (err) {
        setError('Failed to load post')
      }
    }
    if (slug) loadPost()
  }, [slug])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontmatter, content }),
      })

      if (res.ok) {
        setSuccess('Post saved and deployed!')
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError('Failed to save post')
      }
    } catch (err) {
      setError('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    setPreview(frontmatter + '---\n\n' + content)
  }, [frontmatter, content])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px' }}>
          ← Back to posts
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 16px',
            background: saving ? '#ccc' : '#0f0f11',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {saving ? 'Saving...' : 'Save & Deploy'}
        </button>
      </div>

      {error && <div style={{ padding: '12px 24px', background: '#ffebee', color: '#d32f2f', fontSize: '13px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 24px', background: '#e8f5e9', color: '#2e7d32', fontSize: '13px' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e0e0e0' }}>
          <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #e0e0e0', fontSize: '12px', fontWeight: 600, color: '#666' }}>
            Frontmatter
          </div>
          <textarea
            value={frontmatter}
            onChange={(e) => setFrontmatter(e.target.value)}
            placeholder="---&#10;title: ...&#10;---"
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
            }}
          />

          <div style={{ padding: '12px 16px', background: '#f9f9f9', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', fontSize: '12px', fontWeight: 600, color: '#666' }}>
            Content (Markdown)
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write markdown here..."
            style={{
              flex: 2,
              padding: '12px',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Preview */}
        <div style={{ overflow: 'auto', padding: '24px', background: '#fafafa' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', fontSize: '14px', lineHeight: 1.6 }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Preview</h2>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {preview.slice(0, 200)}...
              </code>
            </div>
            {/* Basic markdown rendering */}
            <article style={{ color: '#0f0f11' }}>
              {content.split('\n\n').map((para, i) => {
                if (para.startsWith('# ')) return <h1 key={i} style={{ fontSize: '28px', marginTop: '24px', marginBottom: '16px', fontWeight: 700 }}>{para.slice(2)}</h1>
                if (para.startsWith('## ')) return <h2 key={i} style={{ fontSize: '20px', marginTop: '20px', marginBottom: '12px', fontWeight: 700 }}>{para.slice(3)}</h2>
                if (para.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '12px', color: '#666', fontStyle: 'italic' }}>{para.slice(2)}</blockquote>
                return <p key={i}>{para}</p>
              })}
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
