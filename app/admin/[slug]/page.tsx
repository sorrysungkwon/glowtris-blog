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
      } catch {
        setError('Failed to load post')
      }
    }
    if (slug) loadPost()
  }, [slug])

  function saveDraft() {
    localStorage.setItem(`draft_${slug}`, JSON.stringify(data))
    setHasDraft(true)
    setSuccess('Draft saved')
    setTimeout(() => setSuccess(''), 2000)
  }

  function restoreDraft() {
    const draft = localStorage.getItem(`draft_${slug}`)
    if (draft) {
      setData(JSON.parse(draft))
      setSuccess('Draft restored')
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  function clearDraft() {
    localStorage.removeItem(`draft_${slug}`)
    setHasDraft(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        setSuccess('Post deleted')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError(json.details || 'Failed to delete post')
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
        setSuccess('Saved and deployed!')
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
  const otherContent = lang === 'en' ? data.content_ko : data.content_en
  const enWords = data.content_en.split(/\s+/).filter(w => w).length
  const koWords = data.content_ko.split(/\s+/).filter(w => w).length

  /* ── Shared header bar ─────────────────────────────────────────────── */
  const headerBar = (
    <div className="editor-header">
      <div className="editor-header-inner">
        {/* Back link */}
        <Link href="/admin" className="editor-back">
          ← Admin
        </Link>

        {/* Slug label */}
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-faint)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.3px',
          display: isMobile ? 'none' : 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
        }}>
          {slug}
        </span>

        {/* Draft badge — ambient indicator */}
        {hasDraft && (
          <span className="editor-draft-badge">● DRAFT</span>
        )}

        {/* Language toggle */}
        {!isMobile && (
          <div className="editor-lang-toggle">
            {(['en', 'ko'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`editor-lang-btn${lang === l ? ' active' : ''}`}
              >
                {l === 'en' ? '🇺🇸 EN' : '🇰🇷 KO'}
              </button>
            ))}
          </div>
        )}

        {/* Action cluster — similarity: all same shape/weight */}
        <div className="editor-actions">
          {!isMobile ? (
            <>
              {hasDraft && (
                <button onClick={restoreDraft} className="admin-btn admin-btn-warning" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Restore
                </button>
              )}
              <button onClick={saveDraft} className="admin-btn admin-btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                💾 Draft
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="admin-btn admin-btn-primary"
                style={{ fontSize: '12px', padding: '6px 16px' }}
              >
                {saving ? 'Deploying…' : '🚀 Deploy'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="admin-btn admin-btn-danger"
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                🗑️
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '16px', padding: '6px 12px', lineHeight: 1 }}
            >
              ⋯
            </button>
          )}
        </div>
      </div>
    </div>
  )

  /* ── Mobile expanded menu ─────────────────────────────────────────── */
  const mobileMenu = isMobile && showMenu && (
    <div className="editor-mobile-menu">
      {/* Lang toggle */}
      <div className="editor-lang-toggle" style={{ width: '100%' }}>
        {(['en', 'ko'] as const).map(l => (
          <button
            key={l}
            onClick={() => { setLang(l); setShowMenu(false) }}
            className={`editor-lang-btn${lang === l ? ' active' : ''}`}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {l === 'en' ? '🇺🇸 EN' : '🇰🇷 KO'}
          </button>
        ))}
      </div>
      {hasDraft && (
        <button onClick={() => { restoreDraft(); setShowMenu(false) }} className="admin-btn admin-btn-warning" style={{ width: '100%' }}>
          📝 Restore Draft
        </button>
      )}
      <button onClick={() => { saveDraft(); setShowMenu(false) }} className="admin-btn admin-btn-secondary" style={{ width: '100%' }}>
        💾 Save Draft
      </button>
      <button
        onClick={() => { handleSave(); setShowMenu(false) }}
        disabled={saving}
        className="admin-btn admin-btn-primary"
        style={{ width: '100%' }}
      >
        {saving ? 'Deploying…' : '🚀 Deploy'}
      </button>
      <button
        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
        disabled={deleting}
        className="admin-btn admin-btn-danger"
        style={{ width: '100%' }}
      >
        🗑️ Delete
      </button>
    </div>
  )

  /* ── Delete confirm modal ─────────────────────────────────────────── */
  const deleteModal = showDeleteConfirm && (
    <div className="admin-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3 className="admin-modal-title">Delete this post?</h3>
        <p className="admin-modal-body">
          This will permanently delete <strong>{slug}</strong> and all versions. This cannot be undone.
        </p>
        <div className="admin-modal-actions">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleting}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="admin-btn admin-btn-danger"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Notification bar ─────────────────────────────────────────────── */
  const notify = (
    <>
      {error && <div className="editor-notify error">⚠ {error}</div>}
      {success && <div className="editor-notify success">✓ {success}</div>}
    </>
  )

  /* ── Desktop split layout ─────────────────────────────────────────── */
  const desktopLayout = (
    <div className="editor-body">
      <div className="editor-split">
        {/* Left pane: editable content */}
        <div className="editor-pane">
          {/* Frontmatter section */}
          <div className="pane-label">
            <span>📋</span>
            <span>Frontmatter</span>
            <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>— shared</span>
          </div>
          <textarea
            className="editor-textarea editor-textarea-frontmatter"
            value={data.frontmatter}
            onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
            placeholder="---&#10;title: Post title&#10;---"
          />

          {/* Content section */}
          <div className="pane-label">
            <span className="pane-label-accent">{lang === 'en' ? '🇺🇸' : '🇰🇷'}</span>
            <span>{lang === 'en' ? 'English Content' : 'Korean Content'}</span>
          </div>
          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => {
              if (lang === 'en') setData({ ...data, content_en: e.target.value })
              else setData({ ...data, content_ko: e.target.value })
            }}
            placeholder={`Write ${lang === 'en' ? 'English' : 'Korean'} content in Markdown…`}
          />
        </div>

        {/* Right pane: live preview */}
        <div className="editor-pane-right">
          <div className="pane-label">
            <span>{lang === 'en' ? '🇺🇸' : '🇰🇷'}</span>
            <span>Preview · {lang === 'en' ? 'English' : 'Korean'}</span>
          </div>
          <div className="pane-preview">
            <article
              className="mdx"
              dangerouslySetInnerHTML={{ __html: marked(content || '') as string }}
            />
            {!content.trim() && (
              <p className="pane-preview-empty">
                No {lang === 'en' ? 'English' : 'Korean'} content yet
              </p>
            )}
          </div>

          {/* Stats cluster — proximity: EN + KO stats together */}
          <div className="pane-stats">
            <div className="pane-stat">
              <span className="pane-stat-label">🇺🇸 EN words</span>
              <span className="pane-stat-value">{enWords.toLocaleString()}</span>
            </div>
            <div className="pane-stat">
              <span className="pane-stat-label">🇰🇷 KO words</span>
              <span className="pane-stat-value">{koWords.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Mobile tab layout ────────────────────────────────────────────── */
  const mobileLayout = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tabs — similarity: all same size/shape */}
      <div className="editor-tabs">
        {(['edit', 'preview', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`editor-tab${activeTab === tab ? ' active' : ''}`}
          >
            {tab === 'edit' ? '✎ Edit' : tab === 'preview' ? '👁 Preview' : '📊 Stats'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="pane-label">📋 Frontmatter</div>
            <textarea
              className="editor-textarea editor-textarea-frontmatter"
              style={{ height: '140px' }}
              value={data.frontmatter}
              onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
            />
            <div className="pane-label">
              <span className="pane-label-accent">{lang === 'en' ? '🇺🇸' : '🇰🇷'}</span>
              <span>{lang === 'en' ? 'English' : 'Korean'}</span>
            </div>
            <textarea
              className="editor-textarea"
              style={{ flex: 1 }}
              value={content}
              onChange={(e) => {
                if (lang === 'en') setData({ ...data, content_en: e.target.value })
                else setData({ ...data, content_ko: e.target.value })
              }}
            />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="pane-preview" style={{ minHeight: '100%' }}>
            <article
              className="mdx"
              dangerouslySetInnerHTML={{ __html: marked(content || '') as string }}
            />
            {!content.trim() && (
              <p className="pane-preview-empty">No {lang === 'en' ? 'English' : 'Korean'} content yet</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={{ padding: 'var(--space-5)' }}>
            <div className="pane-stats" style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
              <div className="pane-stat">
                <span className="pane-stat-label">🇺🇸 EN words</span>
                <span className="pane-stat-value">{enWords.toLocaleString()}</span>
              </div>
              <div className="pane-stat">
                <span className="pane-stat-label">🇰🇷 KO words</span>
                <span className="pane-stat-value">{koWords.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="editor-root">
      {headerBar}
      {mobileMenu}
      {notify}
      {deleteModal}
      {isMobile ? mobileLayout : desktopLayout}
    </div>
  )
}