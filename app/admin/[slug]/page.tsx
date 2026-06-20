'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import MarkdownToolbar from '@/components/MarkdownToolbar'
import type { BilingualImageFields } from '@/components/ImageUploadModal'
import { fixKoreanMarkdownBold } from '@/lib/utils'

function MI({ icon, size = 14 }: { icon: string; size?: number }) {
  return (
    <span
      className="material-icons-round"
      style={{ fontSize: `${size}px`, verticalAlign: 'middle', lineHeight: 1, userSelect: 'none' }}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}

interface SeoCheck {
  id: string
  label: string
  short: string
  pass: boolean
  weight: 'critical' | 'recommended'
  group: 'meta' | 'en' | 'ko'
}

function computeSeo(fm: string, contentEn: string, contentKo: string): { checks: SeoCheck[], score: number } {
  const title = getFmField(fm, 'title')
  const description = getFmField(fm, 'description')
  const enWords = contentEn.split(/\s+/).filter(Boolean).length
  const koWords = contentKo.split(/\s+/).filter(Boolean).length

  const checks: SeoCheck[] = [
    { id: 'title_min',  label: `Title ≥ 30 chars (${title.length})`,        short: 'title too short',  pass: title.length >= 30,                   weight: 'critical',    group: 'meta' },
    { id: 'title_max',  label: `Title ≤ 70 chars (${title.length})`,        short: 'title too long',   pass: title.length > 0 && title.length <= 70, weight: 'critical',  group: 'meta' },
    { id: 'desc_min',   label: `Description ≥ 100 chars (${description.length})`, short: 'description too short', pass: description.length >= 100, weight: 'critical', group: 'meta' },
    { id: 'desc_max',   label: `Description ≤ 160 chars (${description.length})`, short: 'description too long', pass: description.length > 0 && description.length <= 160, weight: 'critical', group: 'meta' },
    { id: 'reading_time', label: 'readingTime set',                         short: 'no readingTime',   pass: /^readingTime:/m.test(fm),            weight: 'recommended', group: 'meta' },
    { id: 'cover',      label: 'coverGradient set',                         short: 'no coverGradient', pass: /^coverGradient:/m.test(fm),          weight: 'recommended', group: 'meta' },
    { id: 'en_300',     label: `EN ≥ 300 words (${enWords})`,               short: 'EN too thin',      pass: enWords >= 300,                       weight: 'critical',    group: 'en' },
    { id: 'en_500',     label: `EN ≥ 500 words (${enWords})`,               short: 'EN under 500 words', pass: enWords >= 500,                     weight: 'recommended', group: 'en' },
    { id: 'en_h2',      label: 'EN has H2 headings',                        short: 'EN missing headings', pass: /^## /m.test(contentEn),           weight: 'recommended', group: 'en' },
    { id: 'ko_present', label: `KO content present (${koWords} words)`,     short: 'KO missing',       pass: koWords >= 50,                        weight: 'critical',    group: 'ko' },
    { id: 'ko_300',     label: `KO ≥ 300 words (${koWords})`,               short: 'KO too thin',      pass: koWords >= 300,                       weight: 'recommended', group: 'ko' },
    { id: 'ko_h2',      label: 'KO has H2 headings',                        short: 'KO missing headings', pass: /^## /m.test(contentKo),           weight: 'recommended', group: 'ko' },
  ]

  const score = Math.round(checks.filter(c => c.pass).length / checks.length * 100)
  return { checks, score }
}

function seoColor(score: number): string {
  return score >= 90 ? 'var(--green)' : score >= 70 ? 'var(--amber)' : score >= 50 ? 'var(--amber)' : 'var(--pink)'
}

/* ── Frontmatter field helpers — keep raw string as source of truth ─────
   Quoted YAML values may span multiple lines, so field matching must
   consume the entire quoted scalar — replacing only the first line once
   orphaned the tail of a multiline description and broke YAML parsing. */
function fmFieldRe(name: string): RegExp {
  // Either a double-quoted scalar (may contain newlines) or a single line
  return new RegExp(`^${name}:[ \\t]*(?:"((?:[^"\\\\]|\\\\[\\s\\S])*)"|([^\\n]*))[ \\t]*(\\r?\\n|$)`, 'm')
}

function getFmField(fm: string, name: string): string {
  const m = fm.match(fmFieldRe(name))
  if (!m) return ''
  if (m[1] !== undefined) {
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return (m[2] || '').trim().replace(/^['"]|['"]$/g, '')
}

function setFmField(fm: string, name: string, value: string | null): string {
  const re = fmFieldRe(name)
  if (value === null) {
    return fm.replace(re, '')
  }
  const line = `${name}: ${value}`
  if (re.test(fm)) {
    return fm.replace(re, (...args) => line + args[args.length - 3])
  }
  return fm.trim() ? fm.trim() + `\n${line}` : line
}

function fmQuote(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')}"`
}

const FM_CATEGORIES = ['DEV', 'DESIGN', 'UPDATE', 'NOTICE', 'GUIDE', 'STORIES']

function ScoreRing({ score, size, label, stroke = 4 }: { score: number; size: number; label?: string; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const c = 2 * Math.PI * r
  const color = seoColor(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }}
        />
        <text
          x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          fontSize={size * 0.3} fontWeight={800} fill={color}
          fontFamily="var(--font-mono)"
        >
          {score}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
          {label}
        </span>
      )}
    </div>
  )
}

interface PostData {
  frontmatter: string
  content_en: string
  content_ko: string
}

interface DraftHistoryItem {
  timestamp: string
  data: PostData
}

const EMOJI_LIST = ['📝', '🎨', '🎮', '🕹️', '👾', '🚀', '🛠️', '⚙️', '🔍', '💡', '🔥', '✨', '🛡️', '📦', '🎉', '🪖', '🧠', '🎧', '⚡', '🏆', '📈', '🌐', '💻', '🔮', '🎯', '🧪', '🐛', '📱']

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

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$|^[a-z0-9]$/

export default function PostEditor() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [data, setData] = useState<PostData>({ frontmatter: '', content_en: '', content_ko: '' })
  const [newSlug, setNewSlug] = useState('')          // editable slug (mirrors slug on load)
  const [slugError, setSlugError] = useState('')      // inline slug validation message
  const [lang, setLang] = useState<'en' | 'ko'>('en')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoFixWarning, setAutoFixWarning] = useState<string[]>([])  // MDX auto-fix notices
  const [hasDraft, setHasDraft] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'stats'>('edit')
  const [showMenu, setShowMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [fmMode, setFmMode] = useState<'form' | 'raw'>('form')
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'author' | 'cover' | null>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  function handleSlugChange(val: string) {
    setNewSlug(val)
    if (!val) {
      setSlugError('Slug cannot be empty')
    } else if (!/^[a-z0-9-]+$/.test(val)) {
      setSlugError('Only lowercase letters, numbers, and hyphens allowed')
    } else if (!SLUG_RE.test(val)) {
      setSlugError('Must start and end with a letter or number')
    } else {
      setSlugError('')
    }
  }

  // Auto-grow the content textarea so the pane scrolls (not the textarea),
  // letting the sticky markdown toolbar follow the scroll.
  // We freeze the scroll container's position around the height change so the
  // browser cannot jump to re-center the cursor on every keystroke.
  const autoResize = () => {
    const el = contentTextareaRef.current
    if (!el) return
    // Walk up to find the nearest scrollable ancestor
    let container: HTMLElement | null = el.parentElement
    while (container && container !== document.documentElement) {
      const { overflowY } = window.getComputedStyle(container)
      if (overflowY === 'auto' || overflowY === 'scroll') break
      container = container.parentElement
    }
    const savedTop = container ? container.scrollTop : 0
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 4}px`
    if (container) container.scrollTop = savedTop
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    autoResize()
  }, [data.content_en, data.content_ko, lang, isMobile, activeTab])

  useEffect(() => {
    async function loadPost() {
      try {
        const token = localStorage.getItem('admin_token')
        const res = await fetch(`/api/admin/posts/${slug}?t=${Date.now()}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          cache: 'no-store',
        })
        if (res.ok) {
          const loaded = await res.json()
          const freshData = {
            frontmatter: loaded.frontmatter,
            content_en: loaded.content_en || loaded.content,
            content_ko: loaded.content_ko || '',
          }
          setData(freshData)
          setNewSlug(slug)  // initialise editable slug

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
          setNewSlug(slug)  // initialise even for new posts
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

  /* ── Bilingual image insertion ─────────────────────────────────────────
     Active language: insert at textarea cursor position
     Inactive language: append to the end of that content            */
  function buildImageSnippet(
    url: string,
    fields: BilingualImageFields,
    credit: string,
  ): string {
    const creditHtml = credit
      ? `<span className="figcredit"> Source: ${credit}</span>`
      : ''
    if (fields.caption || credit) {
      return `<figure>\n  <img src="${url}" alt="${fields.alt}" />\n  <figcaption>${fields.caption}${creditHtml}</figcaption>\n</figure>`
    }
    return `![${fields.alt || 'Image'}](${url})`
  }

  function handleBilingualImageInsert(
    en: BilingualImageFields,
    ko: BilingualImageFields,
    credit: string,
    url: string,
  ) {
    const el = contentTextareaRef.current
    const enSnippet = buildImageSnippet(url, en, credit)
    const koSnippet = buildImageSnippet(url, ko, credit)

    setData(prev => {
      if (lang === 'en') {
        // Insert EN at cursor, append KO at end
        let enContent = prev.content_en
        if (el) {
          const before = enContent.slice(0, el.selectionStart)
          const after = enContent.slice(el.selectionEnd)
          const bl = before.endsWith('\n') ? before : before + '\n'
          const al = after.startsWith('\n') ? after : '\n' + after
          enContent = bl + enSnippet + al
          setTimeout(() => {
            el.focus()
            el.setSelectionRange(bl.length + enSnippet.length, bl.length + enSnippet.length)
          }, 0)
        } else {
          enContent = enContent.trimEnd() + '\n\n' + enSnippet
        }
        const koContent = prev.content_ko.trimEnd() + '\n\n' + koSnippet
        return { ...prev, content_en: enContent, content_ko: koContent }
      } else {
        // Insert KO at cursor, append EN at end
        let koContent = prev.content_ko
        if (el) {
          const before = koContent.slice(0, el.selectionStart)
          const after = koContent.slice(el.selectionEnd)
          const bl = before.endsWith('\n') ? before : before + '\n'
          const al = after.startsWith('\n') ? after : '\n' + after
          koContent = bl + koSnippet + al
          setTimeout(() => {
            el.focus()
            el.setSelectionRange(bl.length + koSnippet.length, bl.length + koSnippet.length)
          }, 0)
        } else {
          koContent = koContent.trimEnd() + '\n\n' + koSnippet
        }
        const enContent = prev.content_en.trimEnd() + '\n\n' + enSnippet
        return { ...prev, content_en: enContent, content_ko: koContent }
      }
    })
  }

  // Renames the post if slug changed: write to new slug, then delete old slug.
  // Returns fixes list and sanitized content from the API response.
  async function renameSlugIfNeeded(
    token: string | null,
    targetSlug: string,
    payload: object,
    deploy: boolean,
  ): Promise<{ ok: boolean; error?: string; fixes?: string[]; sanitized_en?: string; sanitized_ko?: string }> {
    const slugChanged = targetSlug !== slug

    // Write to the target slug first
    const writeRes = await fetch(`/api/admin/posts/${targetSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, deploy }),
    })
    const writeJson = await writeRes.json()
    if (!writeRes.ok) {
      return { ok: false, error: writeJson.details || writeJson.error || 'Failed to save post' }
    }

    // If slug changed, delete old slug
    if (slugChanged) {
      const delRes = await fetch(`/api/admin/posts/${slug}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!delRes.ok) {
        return { ok: false, error: `Post written to "${targetSlug}" but old slug could not be deleted` }
      }
    }

    return {
      ok: true,
      fixes: writeJson.fixes || [],
      sanitized_en: writeJson.sanitized_en,
      sanitized_ko: writeJson.sanitized_ko,
    }
  }

  async function handleSaveDraft() {
    if (slugError) { setError('Fix the slug error first'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    setAutoFixWarning([])
    const targetSlug = newSlug.trim() || slug
    try {
      const token = localStorage.getItem('admin_token')
      const draftData = { ...data, frontmatter: withDraftFlag(data.frontmatter, true) }
      const result = await renameSlugIfNeeded(token, targetSlug, draftData, false)
      if (result.ok) {
        // Update editor with sanitized content from server
        const updatedData = {
          ...draftData,
          content_en: result.sanitized_en ?? draftData.content_en,
          content_ko: result.sanitized_ko ?? draftData.content_ko,
        }
        setData(updatedData)
        setIsDraft(true)
        if (result.fixes && result.fixes.length > 0) {
          setAutoFixWarning(result.fixes)
        }
        setSuccess(targetSlug !== slug ? `Slug renamed → ${targetSlug} · Draft saved` : 'Saved as draft')
        if (targetSlug !== slug) {
          setTimeout(() => router.replace(`/admin/${targetSlug}`), 1200)
        } else {
          setTimeout(() => setSuccess(''), 3000)
        }
      } else {
        setError(result.error || 'Failed to save draft')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving draft')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (slugError) { setError('Fix the slug error first'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    setAutoFixWarning([])
    const targetSlug = newSlug.trim() || slug
    try {
      const token = localStorage.getItem('admin_token')
      const liveData = { ...data, frontmatter: withDraftFlag(data.frontmatter, false) }
      const result = await renameSlugIfNeeded(token, targetSlug, liveData, true)
      if (result.ok) {
        if (result.fixes && result.fixes.length > 0) {
          setAutoFixWarning(result.fixes)
        }
        setSuccess(targetSlug !== slug ? `Slug renamed → ${targetSlug} · Deployed!` : 'Deployed!')
        clearDraft()
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setError(result.error || 'Failed to deploy post')
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

        {/* Slug label — shows current (possibly edited) slug */}
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
          {newSlug || slug}
          {newSlug && newSlug !== slug && (
            <span style={{ color: 'var(--amber)', marginLeft: '4px' }}>*</span>
          )}
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
              borderRadius: 'var(--r-full)',
              border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
              background: isDraft ? 'rgba(255,149,0,0.10)' : 'rgba(34,197,94,0.10)',
              color: isDraft ? 'var(--amber)' : 'var(--green)',
              cursor: 'pointer',
              letterSpacing: '0.3px',
              transition: 'all 120ms',
              flexShrink: 0,
            }}
          >
            {isDraft ? <><MI icon="edit_note" size={13} /> DRAFT</> : <><MI icon="check_circle" size={13} /> LIVE</>}
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
                {l === 'en' ? 'EN' : 'KO'}
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
                {saving ? '…' : <><MI icon="save" size={13} /> Save Draft</>}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="admin-btn admin-btn-primary"
                style={{ fontSize: '12px', padding: '6px 16px' }}
              >
                {saving ? 'Deploying…' : <><MI icon="rocket_launch" size={13} /> Deploy</>}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="admin-btn admin-btn-danger"
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <MI icon="delete" size={14} />
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
                  borderRadius: 'var(--r-full)',
                  border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
                  background: isDraft ? 'rgba(255,149,0,0.12)' : 'rgba(34,197,94,0.12)',
                  color: isDraft ? 'var(--amber)' : 'var(--green)',
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
                    {l === 'en' ? 'EN' : 'KO'}
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
          <MI icon="history" size={14} /> Restore Draft
        </button>
      )}
      {/* Status toggle in mobile menu */}
      <button
        onClick={() => { toggleDraft(); setShowMenu(false) }}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 'var(--r-md)',
          border: isDraft ? '1px solid #ff9500' : '1px solid #22c55e',
          background: isDraft ? 'rgba(255,149,0,0.10)' : 'rgba(34,197,94,0.10)',
          color: isDraft ? 'var(--amber)' : 'var(--green)',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        {isDraft ? <><MI icon="edit_note" size={13} /> DRAFT — tap to mark as Live</> : <><MI icon="check_circle" size={13} /> LIVE — tap to mark as Draft</>}
      </button>
      <button
        onClick={() => { handleSaveDraft(); setShowMenu(false) }}
        disabled={saving}
        className="admin-btn admin-btn-secondary"
        style={{ width: '100%' }}
      >
        {saving ? '…' : <><MI icon="save" size={14} /> Save Draft</>}
      </button>
      <button
        onClick={() => { handleSave(); setShowMenu(false) }}
        disabled={saving}
        className="admin-btn admin-btn-primary"
        style={{ width: '100%' }}
      >
        {saving ? 'Deploying…' : <><MI icon="rocket_launch" size={14} /> Deploy</>}
      </button>
      <button
        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
        disabled={deleting}
        className="admin-btn admin-btn-danger"
        style={{ width: '100%' }}
      >
        <MI icon="delete" size={14} /> Delete
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
      {error && <div className="editor-notify error"><MI icon="warning" size={14} /> {error}</div>}
      {success && <div className="editor-notify success"><MI icon="check" size={14} /> {success}</div>}
      {autoFixWarning.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: '0',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--amber)',
          lineHeight: 1.5,
        }}>
          <MI icon="auto_fix_high" size={14} />
          <div style={{ flex: 1 }}>
            <strong>Auto-fixed before saving:</strong>
            <ul style={{ margin: '3px 0 0 0', padding: '0 0 0 16px' }}>
              {autoFixWarning.map((fix, i) => <li key={i}>{fix}</li>)}
            </ul>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>Content in the editor has been updated to match.</span>
          </div>
          <button
            onClick={() => setAutoFixWarning([])}
            style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 4px', flexShrink: 0 }}
          >×</button>
        </div>
      )}
    </>
  )

  const currentCategory = (() => {
    const categoryMatch = data.frontmatter.match(/category:\s*["']?([A-Za-z0-9_-]+)["']?/i)
    return categoryMatch ? categoryMatch[1].toUpperCase() : 'DEV'
  })()

  const suggestedGradients = CATEGORY_GRADIENTS[currentCategory] || CATEGORY_GRADIENTS.DEV

  const gradientSuggestions = (
    <div className="gradient-recommendations">
      <span className="recommendations-label"><MI icon="palette" size={12} /> Recommend colors ({currentCategory}):</span>
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

  /* ── Frontmatter form UI ───────────────────────────────────────────── */
  const fmField = (name: string) => getFmField(data.frontmatter, name)
  const updateFm = (name: string, value: string | null) =>
    setData(d => ({ ...d, frontmatter: setFmField(d.frontmatter, name, value) }))

  const fmInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px', 
    border: '1px solid var(--border)', borderRadius: '4px',
    backgroundColor: 'var(--surface)', color: 'var(--text-primary)',
    outline: 'none', transition: 'border 0.2s',
    boxSizing: 'border-box'
  }
  
  const emojiPickerContainerStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: '0', marginTop: '4px',
    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '8px', display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px',
    zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    width: '240px'
  }
  const emojiPickerButtonStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', fontSize: '20px',
    cursor: 'pointer', padding: '4px', borderRadius: '4px', textAlign: 'center',
    transition: 'background 0.2s'
  }
  const fmLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--text-faint)',
    display: 'block',
    marginBottom: '3px',
  }
  const descLenColor = (n: number) => (n >= 100 && n <= 160 ? 'var(--green)' : n === 0 ? 'var(--text-faint)' : 'var(--amber)')

  const fmLabelBar = (
    <div className="pane-label">
      <MI icon="list_alt" size={13} />
      <span>Frontmatter</span>
      <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>— shared</span>
      <button
        onClick={() => setFmMode(m => (m === 'form' ? 'raw' : 'form'))}
        style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        {fmMode === 'form' ? '{ } Raw' : <><MI icon="list_alt" size={11} /> Form</>}
      </button>
    </div>
  )

  const frontmatterSection = (
    <>
      {fmLabelBar}
      {fmMode === 'raw' ? (
        <textarea
          className="editor-textarea editor-textarea-frontmatter"
          value={data.frontmatter}
          onChange={(e) => setData({ ...data, frontmatter: e.target.value })}
          placeholder="---&#10;title: Post title&#10;---"
        />
      ) : (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          {/* Slug field */}
          <div>
            <label style={fmLabelStyle}>
              Slug
              <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', textTransform: 'none', fontWeight: 400, color: newSlug !== slug ? 'var(--amber)' : 'var(--text-faint)' }}>
                {newSlug !== slug ? `(was: ${slug})` : '— URL identifier'}
              </span>
            </label>
            <input
              style={{
                ...fmInputStyle,
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                border: slugError ? '1px solid #ef4444' : fmInputStyle.border,
              }}
              value={newSlug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="my-post-slug"
              spellCheck={false}
            />
            {slugError && (
              <span style={{ fontSize: '11px', color: 'var(--pink)', marginTop: '3px', display: 'block' }}>
                {slugError}
              </span>
            )}
          </div>
          <div>
            <label style={fmLabelStyle}>Title (EN)</label>
            <input style={fmInputStyle} value={fmField('title')} onChange={e => updateFm('title', fmQuote(e.target.value))} placeholder="Post title" />
          </div>
          <div>
            <label style={fmLabelStyle}>Title (KO)</label>
            <input style={fmInputStyle} value={fmField('title_ko')} onChange={e => updateFm('title_ko', e.target.value ? fmQuote(e.target.value) : null)} placeholder="한국어 제목 (없으면 EN 사용)" />
          </div>
          <div>
            <label style={fmLabelStyle}>
              Description (EN)
              <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', color: descLenColor(fmField('description').length), textTransform: 'none' }}>
                {fmField('description').length}/160
              </span>
            </label>
            <textarea style={{ ...fmInputStyle, resize: 'vertical', minHeight: '48px' }} rows={2} value={fmField('description')} onChange={e => updateFm('description', fmQuote(e.target.value))} placeholder="SEO description (100–160 chars)" />
          </div>
          <div>
            <label style={fmLabelStyle}>
              Description (KO)
              <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', color: descLenColor(fmField('description_ko').length), textTransform: 'none' }}>
                {fmField('description_ko').length}/160
              </span>
            </label>
            <textarea style={{ ...fmInputStyle, resize: 'vertical', minHeight: '48px' }} rows={2} value={fmField('description_ko')} onChange={e => updateFm('description_ko', e.target.value ? fmQuote(e.target.value) : null)} placeholder="한국어 SEO 설명" />
          </div>
          <div>
            <label style={fmLabelStyle}>TL;DR (EN) <span style={{fontSize: '10px', color: 'var(--text-secondary)'}}>(Optional. Uses description if empty)</span></label>
            <textarea style={{ ...fmInputStyle, resize: 'vertical', minHeight: '64px' }} rows={3} value={fmField('tldr')} onChange={e => updateFm('tldr', e.target.value ? fmQuote(e.target.value) : null)} placeholder="Brief summary displayed at the top of the post" />
          </div>
          <div>
            <label style={fmLabelStyle}>TL;DR (KO) <span style={{fontSize: '10px', color: 'var(--text-secondary)'}}>(Optional. Uses description_ko if empty)</span></label>
            <textarea style={{ ...fmInputStyle, resize: 'vertical', minHeight: '64px' }} rows={3} value={fmField('tldr_ko')} onChange={e => updateFm('tldr_ko', e.target.value ? fmQuote(e.target.value) : null)} placeholder="한국어 세 줄 요약 (빈칸이면 한국어 SEO 설명 사용)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={fmLabelStyle}>Date</label>
              <input type="date" style={{ ...fmInputStyle, WebkitAppearance: 'none', height: '34px', boxSizing: 'border-box' }} value={fmField('date')} onChange={e => updateFm('date', e.target.value)} />
            </div>
            <div>
              <label style={fmLabelStyle}>Category</label>
              <select style={{ ...fmInputStyle, cursor: 'pointer' }} value={fmField('category') || 'DEV'} onChange={e => updateFm('category', e.target.value)}>
                {FM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={fmLabelStyle}>Read (min)</label>
              <input type="number" min={1} style={fmInputStyle} value={fmField('readingTime')} onChange={e => updateFm('readingTime', e.target.value ? String(parseInt(e.target.value)) : null)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={fmLabelStyle}>Author</label>
              <input style={fmInputStyle} value={fmField('author')} onChange={e => updateFm('author', e.target.value)} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={fmLabelStyle}>Author emoji</label>
              <input style={{ ...fmInputStyle, cursor: 'pointer' }} readOnly value={fmField('authorEmoji')} onClick={() => setEmojiPickerTarget(emojiPickerTarget === 'author' ? null : 'author')} placeholder="🪖" />
              {emojiPickerTarget === 'author' && (
                <div style={emojiPickerContainerStyle}>
                  {EMOJI_LIST.map(e => (
                    <button key={e} type="button" style={emojiPickerButtonStyle} onClick={() => { updateFm('authorEmoji', fmQuote(e)); setEmojiPickerTarget(null); }}>{e}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <label style={fmLabelStyle}>Cover emoji</label>
              <input style={{ ...fmInputStyle, cursor: 'pointer' }} readOnly value={fmField('coverEmoji')} onClick={() => setEmojiPickerTarget(emojiPickerTarget === 'cover' ? null : 'cover')} placeholder="📝" />
              {emojiPickerTarget === 'cover' && (
                <div style={emojiPickerContainerStyle}>
                  {EMOJI_LIST.map(e => (
                    <button key={e} type="button" style={emojiPickerButtonStyle} onClick={() => { updateFm('coverEmoji', fmQuote(e)); setEmojiPickerTarget(null); }}>{e}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={fmLabelStyle}>Cover gradient</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input style={{ ...fmInputStyle, fontFamily: 'var(--font-mono)', fontSize: '11px' }} value={fmField('coverGradient')} onChange={e => updateFm('coverGradient', e.target.value ? fmQuote(e.target.value) : null)} placeholder="linear-gradient(…)" />
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-sm)', flexShrink: 0, border: '1px solid var(--border)', background: fmField('coverGradient') || 'var(--surface-2)' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-body)', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={fmField('featured') === 'true'}
              onChange={e => updateFm('featured', e.target.checked ? 'true' : null)}
              style={{ width: '15px', height: '15px', accentColor: 'var(--cyan)', cursor: 'pointer' }}
            />
            <MI icon="star" size={14} /> Featured post
          </label>
        </div>
      )}
    </>
  )

  /* ── Desktop split layout ─────────────────────────────────────────── */
  const desktopLayout = (
    <div className="editor-body">
      <div className="editor-split">
        {/* Left pane: editable content */}
        <div className="editor-pane">
          {frontmatterSection}
          {gradientSuggestions}

          {/* Content section */}
          <div className="pane-label">
            <span className="pane-label-accent"><MI icon="language" size={13} /></span>
            <span>{lang === 'en' ? 'English Content' : 'Korean Content'}</span>
          </div>
          <MarkdownToolbar
            textareaRef={contentTextareaRef}
            onChange={(newContent) => {
              if (lang === 'en') setData({ ...data, content_en: newContent })
              else setData({ ...data, content_ko: newContent })
            }}
            onImageInsert={handleBilingualImageInsert}
            disabled={saving || deleting}
          />
          <textarea
            ref={contentTextareaRef}
            className="editor-textarea"
            style={{ flex: 'none', overflow: 'hidden', minHeight: '320px' }}
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
            <MI icon="preview" size={13} />
            <span>Preview · {lang === 'en' ? 'English' : 'Korean'}</span>
          </div>
          <div className="pane-preview">
            {(() => {
              const t = lang === 'ko' ? (fmField('tldr_ko') || fmField('description_ko') || fmField('description')) : (fmField('tldr') || fmField('description'));
              if (!t) return null;
              return (
                <div className="tldr-block" style={{ marginBottom: '2rem' }}>
                  <strong>{lang === 'ko' ? '내용 요약' : 'Summary'}</strong>
                  <p>{t}</p>
                </div>
              );
            })()}
            <article
              className="mdx"
              dangerouslySetInnerHTML={{ __html: marked(fixKoreanMarkdownBold(content || '')) as string }}
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
              <span className="pane-stat-label">EN words</span>
              <span className="pane-stat-value">{enWords.toLocaleString()}</span>
            </div>
            <div className="pane-stat">
              <span className="pane-stat-label">KO words</span>
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
            {tab === 'edit' ? <><MI icon="edit" size={14} /> Edit</> : tab === 'preview' ? <><MI icon="visibility" size={14} /> Preview</> : <><MI icon="bar_chart" size={14} /> Stats</>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {frontmatterSection}
            {gradientSuggestions}
            <div className="pane-label">
              <span className="pane-label-accent"><MI icon="language" size={13} /></span>
              <span>{lang === 'en' ? 'English' : 'Korean'}</span>
            </div>
            <MarkdownToolbar
              textareaRef={contentTextareaRef}
              onChange={(newContent) => {
                if (lang === 'en') setData({ ...data, content_en: newContent })
                else setData({ ...data, content_ko: newContent })
              }}
              onImageInsert={handleBilingualImageInsert}
              disabled={saving || deleting}
            />
            <textarea
              ref={contentTextareaRef}
              className="editor-textarea"
              style={{ flex: 'none', overflow: 'hidden', minHeight: '280px' }}
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
            {(() => {
              const t = lang === 'ko' ? (fmField('tldr_ko') || fmField('description_ko') || fmField('description')) : (fmField('tldr') || fmField('description'));
              if (!t) return null;
              return (
                <div className="tldr-block" style={{ marginBottom: '2rem' }}>
                  <strong>{lang === 'ko' ? '내용 요약' : 'Summary'}</strong>
                  <p>{t}</p>
                </div>
              );
            })()}
            <article
              className="mdx"
              dangerouslySetInnerHTML={{ __html: marked(fixKoreanMarkdownBold(content || '')) as string }}
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
                <span className="pane-stat-label">EN words</span>
                <span className="pane-stat-value">{enWords.toLocaleString()}</span>
              </div>
              <div className="pane-stat">
                <span className="pane-stat-label">KO words</span>
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
                  <span className="draft-history-time"><MI icon="schedule" size={12} /> {formattedTime}</span>
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

  /* ── SEO floating panel ─────────────────────────────────────────────── */
  const { checks: seoChecks, score: seoScore } = computeSeo(data.frontmatter, data.content_en, data.content_ko)
  const overallColor = seoColor(seoScore)
  const criticalChecks = seoChecks.filter(c => c.weight === 'critical')
  const recChecks = seoChecks.filter(c => c.weight === 'recommended')

  const groupScore = (g: SeoCheck['group']) => {
    const gc = seoChecks.filter(c => c.group === g)
    return Math.round(gc.filter(c => c.pass).length / gc.length * 100)
  }

  const failedCrit = criticalChecks.filter(c => !c.pass)
  const failedRec = recChecks.filter(c => !c.pass)
  const seoSummary = failedCrit.length === 0 && failedRec.length === 0
    ? '✓ All checks passed — ready to publish.'
    : [
        failedCrit.length > 0 ? `Fix: ${failedCrit.map(c => c.short).join(', ')}` : '',
        failedRec.length > 0 ? `Improve: ${failedRec.map(c => c.short).join(', ')}` : '',
      ].filter(Boolean).join(' · ')

  const seoFloating = (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      {seoOpen && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          width: '300px',
          maxHeight: '480px',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Score rings row — overall + per-group */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '4px' }}>
            <ScoreRing score={seoScore} size={64} label="Overall" stroke={5} />
            <ScoreRing score={groupScore('meta')} size={48} label="Meta" />
            <ScoreRing score={groupScore('en')} size={48} label="EN" />
            <ScoreRing score={groupScore('ko')} size={48} label="KO" />
          </div>

          {/* Reason summary */}
          <div style={{
            fontSize: '11.5px',
            lineHeight: 1.5,
            color: failedCrit.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '8px 10px',
          }}>
            {seoSummary}
          </div>

          {/* Critical */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '6px' }}>Critical</div>
            {criticalChecks.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: c.pass ? 'var(--green)' : 'var(--pink)', flexShrink: 0, marginTop: '1px' }}><MI icon={c.pass ? 'check_circle' : 'cancel'} size={12} /></span>
                <span style={{ fontSize: '12px', color: c.pass ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.4 }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Recommended */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '6px' }}>Recommended</div>
            {recChecks.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: c.pass ? 'var(--green)' : 'var(--text-faint)', flexShrink: 0, marginTop: '1px' }}><MI icon={c.pass ? 'check_circle' : 'radio_button_unchecked'} size={12} /></span>
                <span style={{ fontSize: '12px', color: c.pass ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.4 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB — circular score ring */}
      <button
        onClick={() => setSeoOpen(o => !o)}
        title={seoOpen ? 'Close SEO panel' : 'Open SEO panel'}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: `1.5px solid ${seoOpen ? overallColor : 'var(--border)'}`,
          background: 'var(--surface)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          transition: 'border-color 0.15s',
        }}
      >
        <ScoreRing score={seoScore} size={46} stroke={4} />
      </button>
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
      {seoFloating}
    </div>
  )
}