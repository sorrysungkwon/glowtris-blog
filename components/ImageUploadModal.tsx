'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(2)} MB`
}

async function compressToWebP(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const MAX = 1920
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
        },
        'image/webp', 0.85
      )
    }
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file) }
    img.src = blobUrl
  })
}

function uploadWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('admin_token')
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100))
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        try { resolve(JSON.parse(xhr.responseText).url) }
        catch { reject(new Error('Invalid response')) }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).error || `HTTP ${xhr.status}`)) }
        catch { reject(new Error(`Upload failed (HTTP ${xhr.status})`)) }
      }
    }
    xhr.onerror = () => reject(new Error('Network error — check connection'))
    const fd = new FormData()
    fd.append('file', file)
    xhr.open('POST', '/api/admin/upload-image')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(fd)
  })
}

/* ── Types ───────────────────────────────────────────────────────────────── */

type Phase = 'idle' | 'compressing' | 'ready' | 'uploading'

export interface BilingualImageFields {
  alt: string
  caption: string
}

interface Props {
  onInsert: (
    url: string,
    en: BilingualImageFields,
    ko: BilingualImageFields,
    credit: string
  ) => void
  onClose: () => void
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function LangSection({
  lang,
  alt,
  caption,
  onAlt,
  onCaption,
  inputStyle,
}: {
  lang: 'EN' | 'KO'
  alt: string
  caption: string
  onAlt: (v: string) => void
  onCaption: (v: string) => void
  inputStyle: React.CSSProperties
}) {
  const accent = lang === 'EN' ? 'var(--cyan)' : '#f59e0b'
  const accentBg = lang === 'EN' ? 'rgba(37,99,235,0.07)' : 'rgba(245,158,11,0.07)'
  const accentBorder = lang === 'EN' ? 'rgba(37,99,235,0.25)' : 'rgba(245,158,11,0.25)'

  return (
    <div style={{
      border: `1px solid ${accentBorder}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        background: accentBg,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: `1px solid ${accentBorder}`,
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.8px',
          color: accent,
        }}>{lang}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          {lang === 'EN' ? '— English fields' : '— 한국어 필드'}
        </span>
      </div>

      {/* Inputs */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px', background: 'var(--surface)' }}>
        <input
          style={inputStyle}
          placeholder={lang === 'EN' ? 'Alt text (accessibility)' : '대체 텍스트 (접근성)'}
          value={alt}
          onChange={e => onAlt(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder={lang === 'EN' ? 'Caption (optional)' : '캡션 (선택)'}
          value={caption}
          onChange={e => onCaption(e.target.value)}
        />
      </div>
    </div>
  )
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function ImageUploadModal({ onInsert, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState('')
  const [originalSize, setOriginalSize] = useState(0)
  const [compressed, setCompressed] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  // EN fields
  const [altEn, setAltEn] = useState('')
  const [captionEn, setCaptionEn] = useState('')

  // KO fields
  const [altKo, setAltKo] = useState('')
  const [captionKo, setCaptionKo] = useState('')

  // Shared
  const [credit, setCredit] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke object URL on unmount
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Mirror EN alt → KO alt while KO alt is empty (convenience)
  useEffect(() => {
    if (!altKo) setAltKo(altEn)
  }, [altEn]) // eslint-disable-line react-hooks/exhaustive-deps

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPEG, WebP, AVIF, GIF).')
      return
    }
    setError('')
    setOriginalSize(file.size)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setPhase('compressing')
    const result = await compressToWebP(file)
    setCompressed(result)
    setPhase('ready')
  }

  async function handleUpload() {
    if (!compressed) return
    setPhase('uploading')
    setProgress(0)
    setError('')
    try {
      const url = await uploadWithProgress(compressed, setProgress)
      onInsert(
        url,
        { alt: altEn, caption: captionEn },
        { alt: altKo, caption: captionKo },
        credit,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setPhase('ready')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    fontSize: '12.5px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-body)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  }

  const savedPct = compressed && compressed.size < originalSize
    ? Math.round((1 - compressed.size / originalSize) * 100)
    : 0

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={onClose}
      >
        {/* Card */}
        <div
          style={{ background: 'var(--surface)', borderRadius: '14px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span className="material-icons-round" style={{ fontSize: '16px', color: 'var(--cyan)' }}>upload</span>
              Insert Image
            </span>
            <button
              onClick={onClose}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              title="Close"
            >
              <span className="material-icons-round" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* ── Drop zone (idle) ─────────────────────────────────── */}
            {phase === 'idle' && (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--cyan)' : 'var(--border-hi)'}`,
                  borderRadius: '10px',
                  padding: '44px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging ? 'rgba(37,99,235,0.05)' : 'var(--surface-2)',
                  transition: 'border-color 0.15s, background 0.15s',
                  userSelect: 'none',
                }}
              >
                <span className="material-icons-round" style={{ fontSize: '44px', color: isDragging ? 'var(--cyan)' : 'var(--text-faint)', display: 'block', marginBottom: '12px', transition: 'color 0.15s' }}>
                  upload_file
                </span>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  {isDragging ? 'Drop to select' : 'Drag image here'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                  or click to browse files
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', background: 'var(--surface-3)', padding: '4px 10px', borderRadius: '99px' }}>
                  PNG · JPEG · WebP · AVIF · GIF · max 5 MB
                </span>
              </div>
            )}

            {/* ── Compressing ──────────────────────────────────────── */}
            {phase === 'compressing' && (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <span className="material-icons-round mi-spin" style={{ fontSize: '40px', color: 'var(--cyan)', display: 'block', marginBottom: '14px' }}>
                  autorenew
                </span>
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 4px' }}>Compressing…</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Resizing to max 1920 px · encoding WebP</p>
              </div>
            )}

            {/* ── Ready + Uploading ────────────────────────────────── */}
            {(phase === 'ready' || phase === 'uploading') && compressed && (
              <>
                {/* Preview */}
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', maxHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} />
                  {phase === 'ready' && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span className="material-icons-round" style={{ fontSize: '12px' }}>swap_horiz</span>
                      Change
                    </button>
                  )}
                </div>

                {/* Size info pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span className="material-icons-round" style={{ fontSize: '15px', color: savedPct > 0 ? '#22c55e' : 'var(--text-faint)', flexShrink: 0 }}>
                    {savedPct > 0 ? 'compress' : 'check_circle'}
                  </span>
                  {savedPct > 0 ? (
                    <span>
                      {fmtBytes(originalSize)}
                      <span style={{ color: 'var(--text-faint)', margin: '0 6px' }}>→</span>
                      <strong style={{ color: '#22c55e' }}>{fmtBytes(compressed.size)}</strong>
                      <span style={{ color: 'var(--text-faint)', marginLeft: '6px' }}>WebP · {savedPct}% smaller</span>
                    </span>
                  ) : (
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{fmtBytes(compressed.size)}</strong>
                      <span style={{ color: 'var(--text-faint)', marginLeft: '6px' }}>already optimal</span>
                    </span>
                  )}
                </div>

                {/* Bilingual fields */}
                {phase === 'ready' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <LangSection
                      lang="EN"
                      alt={altEn}
                      caption={captionEn}
                      onAlt={setAltEn}
                      onCaption={setCaptionEn}
                      inputStyle={inputStyle}
                    />
                    <LangSection
                      lang="KO"
                      alt={altKo}
                      caption={captionKo}
                      onAlt={setAltKo}
                      onCaption={setCaptionKo}
                      inputStyle={inputStyle}
                    />
                    {/* Shared credit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons-round" style={{ fontSize: '14px', color: 'var(--text-faint)', flexShrink: 0 }}>link</span>
                      <input
                        style={inputStyle}
                        placeholder="Source / credit (optional — shared)"
                        value={credit}
                        onChange={e => setCredit(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {phase === 'uploading' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="material-icons-round mi-spin" style={{ fontSize: '13px', color: 'var(--cyan)' }}>autorenew</span>
                        Uploading to GitHub…
                      </span>
                      <span style={{ color: progress === 100 ? '#22c55e' : 'var(--text-primary)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: progress === 100 ? '#22c55e' : 'var(--cyan)',
                          borderRadius: '99px',
                          transition: 'width 0.2s ease, background 0.3s',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', fontSize: '12px', color: '#ef4444' }}>
                    <span className="material-icons-round" style={{ fontSize: '14px', flexShrink: 0 }}>error</span>
                    {error}
                  </div>
                )}

                {/* Actions */}
                {phase === 'ready' && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={onClose}
                      style={{ padding: '9px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-body)', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', background: 'var(--cyan)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span className="material-icons-round" style={{ fontSize: '15px' }}>cloud_upload</span>
                      Upload & Insert
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Top-level error (idle phase) */}
            {error && phase === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', fontSize: '12px', color: '#ef4444' }}>
                <span className="material-icons-round" style={{ fontSize: '14px' }}>error</span>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }}
      />
    </>
  )
}
