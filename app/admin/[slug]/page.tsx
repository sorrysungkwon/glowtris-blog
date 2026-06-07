'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'

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
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/posts/${slug}`)
        if (res.ok) {
          const loaded = await res.json()
          const freshData = {
            frontmatter: loaded.frontmatter,
            content_en: loaded.content_en || loaded.content,
            content_ko: loaded.content_ko || '',
          }
          setData(freshData)

          // Check for draft
          const draftKey = `draft_${slug}`
          const draft = localStorage.getItem(draftKey)
          if (draft) {
            setHasDraft(true)
          }
        }
      } catch (err) {
        setError('Failed to load post')
      }
    }
    if (slug) loadPost()
  }, [slug])

  function saveDraft() {
    const draftKey = `draft_${slug}`
    localStorage.setItem(draftKey, JSON.stringify(data))
    setHasDraft(true)
    setSuccess('💾 Draft saved locally')
    setTimeout(() => setSuccess(''), 2000)
  }

  function restoreDraft() {
    const draftKey = `draft_${slug}`
    const draft = localStorage.getItem(draftKey)
    if (draft) {
      setData(JSON.parse(draft))
      setSuccess('✅ Draft restored')
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  function clearDraft() {
    const draftKey = `draft_${slug}`
    localStorage.removeItem(draftKey)
    setHasDraft(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSuccess('🗑️ Post deleted!')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError('Failed to delete post')
      }
    } catch (err) {
      setError('Error deleting post')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

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
      <div style={{ padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← Back to posts
          </Link>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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

            {/* Draft Actions */}
            {hasDraft && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>📝 Draft</span>
                <button
                  onClick={restoreDraft}
                  style={{
                    padding: '6px 12px',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  Restore
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={saveDraft}
                style={{
                  padding: '8px 16px',
                  background: '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                💾 Draft
              </button>

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
                {saving ? '💾 Saving...' : '🚀 Deploy'}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  background: deleting ? '#ccc' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <div style={{ padding: '12px 24px', background: '#fee', color: '#c33', fontSize: '13px', borderBottom: '1px solid #fcc', display: 'flex', justifyContent: 'center' }}><div style={{ maxWidth: '1280px', width: '100%' }}>{error}</div></div>}
      {success && <div style={{ padding: '12px 24px', background: '#efe', color: '#3a3', fontSize: '13px', borderBottom: '1px solid #cfc', display: 'flex', justifyContent: 'center' }}><div style={{ maxWidth: '1280px', width: '100%' }}>{success}</div></div>}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>
              Delete post?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
              This will permanently delete the post and all its versions (EN/KO). This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  background: '#e5e5e5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  background: deleting ? '#ccc' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        {/* Editor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', gap: '0', maxWidth: '1280px', width: '100%' }}>
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

        {/* Right: Other Language Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff' }}>
          <div style={{ padding: '12px 16px', background: '#f0f0f0', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
            {lang === 'en' ? '🇰🇷 Korean Preview' : '🇬🇧 English Preview'}
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px 20px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#333',
          }}>
            <article
              className="mdx"
              dangerouslySetInnerHTML={{
                __html: marked(lang === 'en' ? data.content_en : data.content_ko)
              }}
              style={{
                maxWidth: '100%',
              }}
            />
            {!(lang === 'en' ? data.content_en : data.content_ko).trim() && (
              <p style={{ color: '#999', fontStyle: 'italic' }}>
                {lang === 'en' ? 'No English content yet' : 'No Korean content yet'}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ padding: '12px 16px', background: '#f9f9f9', borderTop: '1px solid #e5e5e5', fontSize: '11px', color: '#666', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>🇬🇧 EN</div>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>{data.content_en.split(/\s+/).filter(w => w).length} words</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>🇰🇷 KO</div>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>{data.content_ko.split(/\s+/).filter(w => w).length} words</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
