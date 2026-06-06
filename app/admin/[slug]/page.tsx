'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface PostData {
  frontmatter: string
  content_en: string
  content_ko: string
}

export default function PostEditor() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [data, setData] = useState<PostData>({ frontmatter: '', content_en: '', content_ko: '' })
  const [lang, setLang] = useState<'en' | 'ko'>('en')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/posts/${slug}`)
        if (res.ok) {
          const loaded = await res.json()
          setData({
            frontmatter: loaded.frontmatter,
            content_en: loaded.content_en || loaded.content,
            content_ko: loaded.content_ko || '',
          })
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
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setSuccess('✅ Saved and deployed!')
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

  const content = lang === 'en' ? data.content_en : data.content_ko

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9f9f9' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          ← Back to posts
        </Link>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Language Toggle */}
          <div style={{
            display: 'flex',
            background: '#f0f0f0',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}>
            {(['en', 'ko'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '6px 12px',
                  background: lang === l ? '#ffffff' : 'transparent',
                  border: lang === l ? '1px solid #e5e5e5' : 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: lang === l ? '#2563eb' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                {l === 'en' ? '🇬🇧 EN' : '🇰🇷 KO'}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px',
              background: saving ? '#ccc' : '#0f0f11',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {saving ? '💾 Saving...' : '🚀 Save & Deploy'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div style={{ padding: '12px 24px', background: '#fee', color: '#c33', fontSize: '13px', borderBottom: '1px solid #fcc' }}>{error}</div>}
      {success && <div style={{ padding: '12px 24px', background: '#efe', color: '#3a3', fontSize: '13px', borderBottom: '1px solid #cfc' }}>{success}</div>}

      {/* Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', gap: '0' }}>
        {/* Left: Frontmatter + Current Language */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e5e5e5', background: '#ffffff' }}>
          {/* Frontmatter */}
          <div>
            <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
              📋 Frontmatter (공유 / Shared)
            </div>
            <textarea
              value={data.frontmatter}
              onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
              style={{
                width: '100%',
                height: '180px',
                padding: '12px',
                border: 'none',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
                borderBottom: '1px solid #e5e5e5',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
              {lang === 'en' ? '🇬🇧 English Content' : '🇰🇷 Korean Content'}
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                if (lang === 'en') {
                  setData({ ...data, content_en: e.target.value })
                } else {
                  setData({ ...data, content_ko: e.target.value })
                }
              }}
              style={{
                flex: 1,
                width: '100%',
                padding: '12px',
                border: 'none',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Right: Other Language / Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9f9f9' }}>
          <div style={{ padding: '12px 16px', background: '#f0f0f0', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
            {lang === 'en' ? '🇰🇷 Korean Version' : '🇬🇧 English Version'} (읽기 전용 / Read-only)
          </div>
          <textarea
            value={lang === 'en' ? data.content_ko : data.content_en}
            readOnly
            style={{
              flex: 1,
              width: '100%',
              padding: '12px',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              resize: 'none',
              outline: 'none',
              background: '#ffffff',
              color: '#999',
            }}
          />

          {/* Stats */}
          <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e5e5e5', fontSize: '12px', color: '#666' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>EN</div>
                <div style={{ fontWeight: 600 }}>{data.content_en.split(' ').length} words</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{data.content_en.length} chars</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>KO</div>
                <div style={{ fontWeight: 600 }}>{data.content_ko.split(' ').length} words</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{data.content_ko.length} chars</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
