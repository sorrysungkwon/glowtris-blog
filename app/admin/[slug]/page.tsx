'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import MarkdownToolbar from '@/components/MarkdownToolbar'

interface PostData {
  frontmatter: string
  content_en: string
  content_ko: string
}

interface DraftHistoryItem {
  timestamp: string
  data: PostData
}

const CATEGORY_GRADIENTS: Record<string, string[]> = {
  DEV: [
    'linear-gradient(135deg, #00c8ff 0%, #0040ff 100%)',
    'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    'linear-gradient(135deg, #8a2be2 0%, #4a00e0 100%)'
  ],
  NOTICE: [
    'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'
  ],
  DESIGN: [
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)'
  ],
  UPDATE: [
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #028090 0%, #00a896 100%)',
    'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)'
  ],
  GUIDE: [
    'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
    'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)',
    'linear-gradient(135deg, #cac531 0%, #f3f9a7 100%)'
  ]
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
  const [isDraft, setIsDraft] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'stats'>('edit')
  const [showMenu, setShowMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)

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

          const draftMatch = loaded.frontmatter.match(/draft:\s*(true|false)/i)
          setIsDraft(draftMatch ? draftMatch[1].toLowerCase() === 'true' : false)

          const historyKey = `draft_history_${slug}`
          const stored = localStorage.getItem(historyKey)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as DraftHistoryItem[]
              setDraftHistory(parsed)
              setHasDraft(parsed.length > 0)
            } catch (e) {
              console.error('Failed to parse draft history:', e)
            }
          }
        } else if (res.status === 404) {
          const today = new Date().toISOString().split('T')[0]
          const defaultFrontmatter = `title: "New Post Title"\ndescription: "Brief description of the post"\ndate: "${today}"\ncategory: "DEV"\nauthor: "sorrysungkwon"\nauthorEmoji: "🔧"\ncoverGradient: "linear-gradient(135deg, #00c8ff 0%, #0040ff 100%)"\ncoverEmoji: "⚙️"`
          setData({
            frontmatter: defaultFrontmatter,
            content_en: '# New English Post\n\nWrite English content here...',
            content_ko: '# 새 한국어 포스트\n\n한국어 내용을 여기에 작성하세요...',
          })
          setError('')
          
          const historyKey = `draft_history_${slug}`
          const stored = localStorage.getItem(historyKey)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as DraftHistoryItem[]
              setDraftHistory(parsed)
              setHasDraft(parsed.length > 0)
            } catch (e) {
              console.error('Failed to parse draft history:', e)
            }
          }
        } else {
          setError('Failed to load post')
        }
      } catch {
        setError('Failed to load post')
      }
    }
    if (slug) loadPost()
  }, [slug])

  function saveDraft() {
    const newItem: DraftHistoryItem = {
      timestamp: new Date().toISOString(),
      data: data
    }
    const updated = [newItem, ...draftHistory].slice(0, 10)
    setDraftHistory(updated)
    localStorage.setItem(`draft_history_${slug}`, JSON.stringify(updated))
    setHasDraft(true)
    setSuccess('Draft saved')
    setTimeout(() => setSuccess(''), 2000)
  }

  function restoreDraft(item: DraftHistoryItem) {
    setData(item.data)
    setShowHistoryModal(false)
    setSuccess('Draft version restored')
    setTimeout(() => setSuccess(''), 2000)
  }

  function clearDraft() {
    localStorage.removeItem(`draft_${slug}`)
    localStorage.removeItem(`draft_history_${slug}`)
    setDraftHistory([])
    setHasDraft(false)
  }

  function applySuggestedGradient(gradient: string) {
    let fm = data.frontmatter
    if (fm.includes('coverGradient:')) {
      fm = fm.replace(/coverGradient:\s*["']?.*?["']?(\r?\n|$)/, `coverGradient: "${gradient}"$1`)
    } else {
      fm = fm.trim() + `\ncoverGradient: "${gradient}"`
    }
    setData({ ...data, frontmatter: fm })
    setSuccess('Suggested gradient applied')
    setTimeout(() => setSuccess(''), 2000)
  }

  function toggleDraft() {
    let fm = data.frontmatter
    if (fm.includes('draft:')) {
      fm = fm.replace(/draft:\s*(true|false)/i, `draft: ${!isDraft}`)
    } else {
      fm = fm.trim() + `\ndraft: ${!isDraft}`
    }
    setData({ ...data, frontmatter: fm })
    setIsDraft(!isDraft)
    setSuccess(isDraft ? 'Post ready to publish' : 'Post marked as draft')
    setTimeout(() => setSuccess(''), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
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
      setDeleteConfirmText('')
    }
  }

  function withDraftFlag(frontmatter: string, draft: boolean): string {
    if (draft) {
      if (frontmatter.includes('draft:')) {
        return frontmatter.replace(/draft:\s*(true|false)/i, 'draft: true')
      }
      return frontmatter.trim() + '\ndraft: true'
    } else {
      return frontmatter.replace(/\ndraft:\s*(true|false)[^\n]*/i, '').replace(/^draft:\s*(true|false)[^\n]*\n?/im, '')
    }
  }

  async function handleSaveDraft() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('admin_token')
      const draftData = { ...data, frontmatter: withDraftFlag(data.frontmatter, true) }
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(draftData),
      })
      const resData = await res.json()
      if (res.ok) {
        setData(draftData)
        setIsDraft(true)
        setSuccess('Saved as draft')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(resData.details || resData.error || 'Failed to save draft')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving draft')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('admin_token')
      const liveData = { ...data, frontmatter: withDraftFlag(data.frontmatter, false) }
      const res = await fetch(`/api/admin/posts/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(liveData),
      })
      const resData = await res.json()
      if (res.ok) {
        setSuccess('Deployed!')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError(resData.details || resData.error || 'Failed to deploy post')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deploying post')
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

        {/* Status pill — clickable, always visible on desktop */}
        {!isMobile && (
          <button
            onClick={toggleDraft}
            title={isDraft ? 'Click to mark as Live' : 'Click to mark as Draft'}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '99px',
              border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
              background: isDraft ? 'rgba(255,149,0,0.10)' : 'rgba(34,197,94,0.10)',
              color: isDraft ? '#ff9500' : '#22c55e',
              cursor: 'pointer',
              letterSpacing: '0.3px',
              transition: 'all 120ms',
              flexShrink: 0,
            }}
          >
            {isDraft ? '📝 DRAFT' : '✅ LIVE'}
          </button>
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
                <button onClick={() => setShowHistoryModal(true)} className="admin-btn admin-btn-warning" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Restore
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {saving ? '…' : '💾 Save Draft'}
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
            <>
              {/* Status pill — visible on mobile header */}
              <button
                onClick={toggleDraft}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '99px',
                  border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
                  background: isDraft ? 'rgba(255,149,0,0.12)' : 'rgba(34,197,94,0.12)',
                  color: isDraft ? '#ff9500' : '#22c55e',
                  cursor: 'pointer',
                  flexShrink: 0,
                  letterSpacing: '0.3px',
                }}
              >
                {isDraft ? 'DRAFT' : 'LIVE'}
              </button>
              {/* Language toggle shown on mobile directly to the left of the ... menu */}
              <div className="editor-lang-toggle" style={{ marginLeft: '4px', marginRight: '4px' }}>
                {(['en', 'ko'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`editor-lang-btn${lang === l ? ' active' : ''}`}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    {l === 'en' ? '🇺🇸 EN' : '🇰🇷 KO'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '16px', padding: '6px 12px', lineHeight: 1 }}
              >
                ⋯
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  /* ── Mobile expanded menu ─────────────────────────────────────────── */
  const mobileMenu = isMobile && showMenu && (
    <div className="editor-mobile-menu">

      {hasDraft && (
        <button onClick={() => { setShowHistoryModal(true); setShowMenu(false) }} className="admin-btn admin-btn-warning" style={{ width: '100%' }}>
          📝 Restore Draft
        </button>
      )}
      {/* Status toggle in mobile menu */}
      <button
        onClick={() => { toggleDraft(); setShowMenu(false) }}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
          background: isDraft ? 'rgba(255,149,0,0.10)' : 'rgba(34,197,94,0.10)',
          color: isDraft ? '#ff9500' : '#22c55e',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        {isDraft ? '📝 DRAFT — tap to mark as Live' : '✅ LIVE — tap to mark as Draft'}
      </button>
      <button
        onClick={() => { handleSaveDraft(); setShowMenu(false) }}
        disabled={saving}
        className="admin-btn admin-btn-secondary"
        style={{ width: '100%' }}
      >
        {saving ? '…' : '💾 Save Draft'}
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
    <div className="admin-modal-backdrop" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3 className="admin-modal-title">Delete this post?</h3>
        <p className="admin-modal-body" style={{ marginBottom: '12px' }}>
          This will permanently delete <strong>{slug}</strong> and all versions. This cannot be undone.
        </p>

        <input
          type="text"
          className="admin-input"
          style={{ width: '100%', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}
          placeholder={`Type "${slug}" to confirm`}
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          disabled={deleting}
        />

        <div className="admin-modal-actions">
          <button
            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
            disabled={deleting}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || deleteConfirmText !== slug}
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

  const currentCategory = (() => {
    const categoryMatch = data.frontmatter.match(/category:\s*["']?([A-Za-z0-9_-]+)["']?/i)
    return categoryMatch ? categoryMatch[1].toUpperCase() : 'DEV'
  })()

  const suggestedGradients = CATEGORY_GRADIENTS[currentCategory] || CATEGORY_GRADIENTS.DEV

  const gradientSuggestions = (
    <div className="gradient-recommendations">
      <span className="recommendations-label">🎨 Recommend colors ({currentCategory}):</span>
      <div className="recommendations-list">
        {suggestedGradients.map((grad, idx) => (
          <button
            key={idx}
            className="gradient-recommendation-btn"
            style={{ background: grad }}
            onClick={() => applySuggestedGradient(grad)}
            title="Apply cover gradient"
          />
        ))}
      </div>
    </div>
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
          {gradientSuggestions}

          {/* Content section */}
          <div className="pane-label">
            <span className="pane-label-accent">{lang === 'en' ? '🇺🇸' : '🇰🇷'}</span>
            <span>{lang === 'en' ? 'English Content' : 'Korean Content'}</span>
          </div>
          <MarkdownToolbar
            textareaRef={contentTextareaRef}
            onChange={(newContent) => {
              if (lang === 'en') setData({ ...data, content_en: newContent })
              else setData({ ...data, content_ko: newContent })
            }}
            disabled={saving || deleting}
          />
          <textarea
            ref={contentTextareaRef}
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
            {gradientSuggestions}
            <div className="pane-label">
              <span className="pane-label-accent">{lang === 'en' ? '🇺🇸' : '🇰🇷'}</span>
              <span>{lang === 'en' ? 'English' : 'Korean'}</span>
            </div>
            <MarkdownToolbar
              textareaRef={contentTextareaRef}
              onChange={(newContent) => {
                if (lang === 'en') setData({ ...data, content_en: newContent })
                else setData({ ...data, content_ko: newContent })
              }}
              disabled={saving || deleting}
            />
            <textarea
              ref={contentTextareaRef}
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

  /* ── Restore draft history modal ────────────────────────────────────── */
  const historyModal = showHistoryModal && (
    <div className="admin-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
      <div className="admin-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <h3 className="admin-modal-title">Restore Draft</h3>
        <p className="admin-modal-body" style={{ marginBottom: '16px' }}>
          Select a saved version to restore. Up to 10 versions are stored locally.
        </p>

        <div className="draft-history-list">
          {draftHistory.map((item) => {
            const enWordCount = item.data.content_en.split(/\s+/).filter(w => w).length
            const koWordCount = item.data.content_ko.split(/\s+/).filter(w => w).length

            const date = new Date(item.timestamp)
            const formattedTime = date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })

            return (
              <button
                key={item.timestamp}
                onClick={() => restoreDraft(item)}
                className="draft-history-item"
              >
                <div className="draft-history-meta">
                  <span className="draft-history-time">🕒 {formattedTime}</span>
                  <span className="draft-history-stats">
                    EN: {enWordCount} words · KO: {koWordCount} words
                  </span>
                </div>
                <span className="draft-history-badge">Restore</span>
              </button>
            )
          })}
        </div>

        <div className="admin-modal-actions">
          <button
            onClick={() => setShowHistoryModal(false)}
            className="admin-btn admin-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="editor-root">
      {headerBar}
      {mobileMenu}
      {notify}
      {deleteModal}
      {historyModal}
      {isMobile ? mobileLayout : desktopLayout}
    </div>
  )
}