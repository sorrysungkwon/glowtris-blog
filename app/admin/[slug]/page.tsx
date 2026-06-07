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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'stats'>('edit')
  const [showMenu, setShowMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
          const draftKey = `draft_${slug}`
          const draft = localStorage.getItem(draftKey)
          if (draft) setHasDraft(true)
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
    setSuccess('💾 Draft saved')
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
      const res = await fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setSuccess('🗑️ Post deleted!')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError(data.details || 'Failed to delete post')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting post')
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
      const resData = await res.json()
      if (res.ok) {
        setSuccess('✅ Saved and deployed!')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError(resData.details || resData.error || 'Failed to save post')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving post')
    } finally {
      setSaving(false)
    }
  }

  const content = lang === 'en' ? data.content_en : data.content_ko
  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => ({
    padding: isMobile ? '10px 14px' : '8px 16px',
    fontSize: isMobile ? '14px' : '13px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: isMobile ? '44px' : 'auto',
    ...(variant === 'primary' ? {
      background: '#0f0f11',
      color: '#fff',
    } : variant === 'secondary' ? {
      background: '#94a3b8',
      color: '#fff',
    } : {
      background: '#ef4444',
      color: '#fff',
    }),
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9f9f9' }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '12px 16px' : '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '12px' : '0' }}>
            <Link href="/admin" style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 600
            }}>
              ← Back
            </Link>

            {isMobile ? (
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ⋯
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      {l === 'en' ? '🇬🇧' : '🇰🇷'}
                    </button>
                  ))}
                </div>

                {hasDraft && (
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
                    }}
                  >
                    📝 Restore
                  </button>
                )}

                <button onClick={saveDraft} style={{ ...buttonStyle('secondary'), padding: '6px 12px' }}>💾</button>
                <button onClick={handleSave} disabled={saving} style={{ ...buttonStyle('primary'), padding: '6px 16px', opacity: saving ? 0.6 : 1 }}>🚀</button>
                <button onClick={() => setShowDeleteConfirm(true)} disabled={deleting} style={{ ...buttonStyle('danger'), padding: '6px 12px', opacity: deleting ? 0.6 : 1 }}>🗑️</button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobile && showMenu && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid #e5e5e5',
            }}>
              <div style={{ display: 'flex', gap: '6px', background: '#f0f0f0', borderRadius: '6px', padding: '2px' }}>
                {(['en', 'ko'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setShowMenu(false) }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: lang === l ? '#fff' : 'transparent',
                      border: lang === l ? '1px solid #ddd' : 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: lang === l ? '#2563eb' : '#666',
                    }}
                  >
                    {l === 'en' ? '🇬🇧 EN' : '🇰🇷 KO'}
                  </button>
                ))}
              </div>
              {hasDraft && (
                <button
                  onClick={() => { restoreDraft(); setShowMenu(false) }}
                  style={{ ...buttonStyle('secondary'), width: '100%' }}
                >
                  📝 Restore Draft
                </button>
              )}
              <button
                onClick={() => { saveDraft(); setShowMenu(false) }}
                style={{ ...buttonStyle('secondary'), width: '100%' }}
              >
                💾 Save Draft
              </button>
              <button
                onClick={() => { handleSave(); setShowMenu(false) }}
                disabled={saving}
                style={{ ...buttonStyle('primary'), width: '100%', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? '🚀 Deploying...' : '🚀 Deploy'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                disabled={deleting}
                style={{ ...buttonStyle('danger'), width: '100%', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', fontSize: '13px', borderBottom: '1px solid #fcc', textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#efe', color: '#3a3', fontSize: '13px', borderBottom: '1px solid #cfc', textAlign: 'center' }}>{success}</div>}

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
          padding: '16px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: isMobile ? '20px' : '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Delete post?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
              This will permanently delete the post and all versions. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  ...buttonStyle('secondary'),
                  flex: isMobile ? 1 : 'auto',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  ...buttonStyle('danger'),
                  flex: isMobile ? 1 : 'auto',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        {isMobile ? (
          /* Mobile Tab Layout */
          <div style={{ flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5', background: '#fff', gap: '0' }}>
              {(['edit', 'preview', 'stats'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: activeTab === tab ? '#fff' : '#f9f9f9',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: activeTab === tab ? '#2563eb' : '#666',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab === 'edit' ? '✎ Edit' : tab === 'preview' ? '👁 Preview' : '📊 Stats'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              {activeTab === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Frontmatter */}
                  <div style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <div style={{ padding: '12px 16px', background: '#f9f9f9', fontSize: '11px', fontWeight: 600, color: '#666' }}>
                      📋 Frontmatter
                    </div>
                    <textarea
                      value={data.frontmatter}
                      onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
                      style={{
                        width: '100%',
                        height: '140px',
                        padding: '12px 16px',
                        border: 'none',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', background: '#f9f9f9', fontSize: '11px', fontWeight: 600, color: '#666' }}>
                      {lang === 'en' ? '🇬🇧 English' : '🇰🇷 Korean'}
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
                        padding: '12px 16px',
                        border: 'none',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div style={{ padding: '16px', fontSize: '14px', lineHeight: 1.6, color: '#333' }}>
                  <article
                    className="mdx"
                    dangerouslySetInnerHTML={{
                      __html: marked(lang === 'en' ? data.content_en : data.content_ko)
                    }}
                  />
                  {!content.trim() && (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>
                      No {lang === 'en' ? 'English' : 'Korean'} content yet
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🇬🇧 English</div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{data.content_en.split(/\s+/).filter(w => w).length}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>words</div>
                    </div>
                    <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🇰🇷 Korean</div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{data.content_ko.split(/\s+/).filter(w => w).length}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>words</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Split Layout */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', gap: '0', maxWidth: '1280px', width: '100%' }}>
            {/* Left: Frontmatter + Current Language */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e5e5e5', background: '#ffffff' }}>
              {/* Frontmatter */}
              <div>
                <div style={{ padding: '12px 16px', background: '#f9f9f9', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
                  📋 Frontmatter (Shared)
                </div>
                <textarea
                  value={data.frontmatter}
                  onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
                  style={{
                    width: '100%',
                    height: '180px',
                    padding: '12px',
                    border: 'none',
                    fontFamily: 'monospace',
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
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Right: Language Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff' }}>
              <div style={{ padding: '12px 16px', background: '#f0f0f0', borderBottom: '1px solid #e5e5e5', fontSize: '11px', fontWeight: 600, color: '#666' }}>
                {lang === 'en' ? '🇰🇷 Korean Preview' : '🇬🇧 English Preview'}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', fontSize: '13px', lineHeight: 1.6, color: '#333' }}>
                <article
                  className="mdx"
                  dangerouslySetInnerHTML={{
                    __html: marked(lang === 'en' ? data.content_en : data.content_ko)
                  }}
                  style={{ maxWidth: '100%' }}
                />
                {!content.trim() && (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>
                    {lang === 'en' ? 'No English content yet' : 'No Korean content yet'}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{ padding: '12px 16px', background: '#f9f9f9', borderTop: '1px solid #e5e5e5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
        )}
      </div>
    </div>
  )
}