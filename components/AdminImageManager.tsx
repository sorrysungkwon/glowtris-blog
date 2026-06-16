'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface ImageReference {
  slug: string
  title: string
  lang: string
}

interface ImageFile {
  name: string
  url: string
  size: number
  referencedBy?: ImageReference[]
}

export default function AdminImageManager() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<{ idx: number; type: 'md' | 'url' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchImages = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/images', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || [])
      } else {
        console.error('Failed to fetch images:', res.statusText)
      }
    } catch (err) {
      console.error('Error fetching images:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleUpload = async (file: File) => {
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (res.ok) {
        await fetchImages()
      } else {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload failed due to connection error')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleDelete = async (fileName: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileName }),
      })

      if (res.ok) {
        setImages(images.filter((img) => img.name !== fileName))
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Delete failed')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Delete failed')
    }
  }

  const copyToClipboard = async (text: string, index: number, type: 'md' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex({ idx: index, type })
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive
            ? 'var(--accent-dim, rgba(6, 182, 212, 0.08))'
            : 'var(--surface-raised, rgba(255, 255, 255, 0.02))',
          borderColor: dragActive ? 'var(--cyan)' : 'var(--border)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif, image/webp, image/avif"
          style={{ display: 'none' }}
        />
        <span
          className="material-icons-round"
          style={{
            fontSize: '40px',
            color: dragActive ? 'var(--cyan)' : 'var(--text-faint)',
            transition: 'color 0.2s',
          }}
        >
          {uploading ? 'sync' : 'cloud_upload'}
        </span>
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
            }}
          >
            {uploading ? 'Uploading your image...' : 'Drag & drop your image here'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>
            {uploading ? 'Processing file' : 'Or click to browse from files (max 5MB)'}
          </p>
        </div>
      </div>

      {/* Images List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-faint)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }}></div>
          <span>Loading uploaded images...</span>
        </div>
      ) : images.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 0',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            color: 'var(--text-faint)',
            background: 'var(--surface-raised, rgba(255, 255, 255, 0.01))',
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '36px', marginBottom: '8px' }}>
            image_not_supported
          </span>
          <p style={{ margin: 0, fontSize: '14px' }}>No uploaded images found.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {images.map((img, idx) => {
            const isCopiedMd = copiedIndex?.idx === idx && copiedIndex?.type === 'md'
            const isCopiedUrl = copiedIndex?.idx === idx && copiedIndex?.type === 'url'
            const isDeleting = deleteConfirm === img.name
            const references = img.referencedBy || []
            const isUsed = references.length > 0

            return (
              <div
                key={img.name}
                className="admin-post-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised, rgba(255,255,255,0.01))',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                {/* Image Preview Container */}
                <div
                  style={{
                    width: '100%',
                    paddingBottom: '65%',
                    position: 'relative',
                    borderRadius: 'var(--r-md)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                  {/* Status Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      borderRadius: 'var(--r-lg)',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isUsed ? 'rgba(16, 185, 129, 0.9)' : 'rgba(107, 114, 128, 0.9)',
                      color: 'var(--bg)',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span className="material-icons-round" style={{ fontSize: '10px' }}>
                      {isUsed ? 'check_circle' : 'help_outline'}
                    </span>
                    {isUsed ? `Used (${references.length})` : 'Unused'}
                  </div>
                </div>

                {/* Meta details */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginBottom: '12px',
                    flexGrow: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-all',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.4',
                      height: '2.8em',
                    }}
                    title={img.name}
                  >
                    {img.name}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'between',
                      alignItems: 'center',
                      width: '100%',
                      fontSize: '11px',
                      color: 'var(--text-faint)',
                    }}
                  >
                    <span>Size: {formatSize(img.size)}</span>
                  </div>
                </div>

                {/* References info */}
                {isUsed && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '8px',
                      marginBottom: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)' }}>
                      Referenced in:
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        maxHeight: '40px',
                        overflowY: 'auto',
                      }}
                    >
                      {references.map((ref, rIdx) => (
                        <Link
                          key={rIdx}
                          href={`/admin/${ref.slug}`}
                          style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-xs)',
                            color: 'var(--cyan)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title={`Go to editor for ${ref.title} (${ref.lang})`}
                        >
                          <span>{ref.slug}</span>
                          <span style={{ opacity: 0.6 }}>({ref.lang.toUpperCase()})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions container */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {isDeleting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                      {isUsed && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--pink)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            padding: '6px',
                            borderRadius: 'var(--r-sm)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            textAlign: 'center',
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ Used in {references.length} post(s)!
                        </div>
                      )}
                      <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
                        <button
                          onClick={() => handleDelete(img.name)}
                          className="admin-btn admin-btn-danger"
                          style={{
                            flex: 1,
                            fontSize: '11px',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="admin-btn admin-btn-secondary"
                          style={{
                            flex: 1,
                            fontSize: '11px',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          copyToClipboard(`![image](${img.url})`, idx, 'md')
                        }
                        className="admin-btn admin-btn-primary"
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          background: isCopiedMd ? 'var(--green)' : undefined,
                        }}
                      >
                        <span className="material-icons-round" style={{ fontSize: '12px' }}>
                          {isCopiedMd ? 'check' : 'code'}
                        </span>
                        {isCopiedMd ? 'Copied' : 'MD'}
                      </button>

                      <button
                        onClick={() => copyToClipboard(img.url, idx, 'url')}
                        className="admin-btn admin-btn-secondary"
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          background: isCopiedUrl ? 'var(--green)' : undefined,
                          color: isCopiedUrl ? 'var(--bg)' : undefined,
                        }}
                      >
                        <span className="material-icons-round" style={{ fontSize: '12px' }}>
                          {isCopiedUrl ? 'check' : 'link'}
                        </span>
                        {isCopiedUrl ? 'Copied' : 'Link'}
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(img.name)}
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          color: 'var(--pink)',
                        }}
                        title="Delete Image"
                      >
                        <span className="material-icons-round" style={{ fontSize: '13px' }}>
                          delete
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
