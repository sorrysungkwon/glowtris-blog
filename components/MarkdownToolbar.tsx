'use client'

import { useRef, useState } from 'react'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onChange: (content: string) => void
  disabled?: boolean
}

export default function MarkdownToolbar({ textareaRef, onChange, disabled }: MarkdownToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function getSelection() {
    const textarea = textareaRef.current
    if (!textarea) return { before: '', selected: '', after: '' }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = textarea.value

    return {
      before: content.slice(0, start),
      selected: content.slice(start, end),
      after: content.slice(end),
    }
  }

  function insertMarkdown(before: string, after: string = '') {
    const { before: contentBefore, selected, after: contentAfter } = getSelection()
    const textarea = textareaRef.current
    if (!textarea) return

    const newContent = contentBefore + before + selected + after + contentAfter
    onChange(newContent)

    setTimeout(() => {
      const newCursorPos = contentBefore.length + before.length + selected.length
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  function insertBlock(prefix: string, suffix: string = '') {
    const { before: contentBefore, selected, after: contentAfter } = getSelection()
    const textarea = textareaRef.current
    if (!textarea) return

    const beforeLine = contentBefore.endsWith('\n') ? contentBefore : contentBefore + '\n'
    const afterLine = contentAfter.startsWith('\n') ? contentAfter : '\n' + contentAfter

    const newContent = beforeLine + prefix + selected + suffix + afterLine
    onChange(newContent)

    setTimeout(() => {
      const newCursorPos = beforeLine.length + prefix.length + selected.length
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  function handleHeader(level: 1 | 2 | 3) {
    const prefix = '#'.repeat(level) + ' '
    const { selected } = getSelection()
    insertBlock(prefix, selected ? '' : 'Heading text')
  }

  function handleBold() {
    insertMarkdown('**', '**')
  }

  function handleItalic() {
    insertMarkdown('*', '*')
  }

  function handleStrikethrough() {
    insertMarkdown('~~', '~~')
  }

  function handleUnderline() {
    insertMarkdown('<u>', '</u>')
  }

  function handleQuote() {
    insertBlock('> ')
  }

  function handleCodeBlock() {
    insertBlock('```\n', '\n```')
  }

  function handleList() {
    insertBlock('- ')
  }

  function handleLink() {
    const { selected } = getSelection()
    const url = prompt('Enter URL:')
    if (url) {
      insertMarkdown(`[${selected || 'link text'}](${url})`)
    }
  }

  // Compress an image client-side using the Canvas API.
  // Resizes to max 1920px on the longest side and encodes as WebP at 0.85 quality.
  // Falls back to the original file if compression fails or isn't supported.
  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1920
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(file); return }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          },
          'image/webp',
          0.85
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]
    if (!raw) return

    setUploading(true)
    try {
      const file = await compressImage(raw)
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      })

      if (res.ok) {
        const { url } = await res.json()
        insertBlock(`![Image](${url})`, '')
      } else {
        const error = await res.json()
        alert(`Upload failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleHorizontalRule() {
    insertBlock('---')
  }

  function handleFigure() {
    const { before: contentBefore, selected, after: contentAfter } = getSelection()
    const textarea = textareaRef.current
    if (!textarea) return

    // If selection is a markdown image, extract URL + alt for the figure
    const imgMatch = selected.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    const src = imgMatch ? imgMatch[2] : (prompt('Image URL:') || '')
    const alt = imgMatch ? imgMatch[1] : ''
    if (!src) return

    const caption = prompt('Caption text:') || ''
    const credit = prompt('Source / credit (optional — press Enter to skip):') || ''

    const creditHtml = credit ? `\n  <span class="figcredit">Source: ${credit}</span>` : ''
    const figcaptionHtml = caption || credit
      ? `\n<figcaption>${caption}${creditHtml}\n</figcaption>`
      : ''
    const figure = `<figure>\n  <img src="${src}" alt="${alt}" />${figcaptionHtml}\n</figure>`

    const newContent = contentBefore + figure + contentAfter
    onChange(newContent)
    setTimeout(() => {
      const pos = contentBefore.length + figure.length
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    }, 0)
  }

  const btnClass = 'markdown-toolbar-btn'
  const disabledState = disabled || uploading

  return (
    <div className="markdown-toolbar">
      <div className="markdown-toolbar-group">
        <button
          onClick={() => handleHeader(1)}
          disabled={disabledState}
          className={btnClass}
          title="Header 1"
        >
          H1
        </button>
        <button
          onClick={() => handleHeader(2)}
          disabled={disabledState}
          className={btnClass}
          title="Header 2"
        >
          H2
        </button>
        <button
          onClick={() => handleHeader(3)}
          disabled={disabledState}
          className={btnClass}
          title="Header 3"
        >
          H3
        </button>
      </div>

      <div className="markdown-toolbar-group">
        <button
          onClick={handleBold}
          disabled={disabledState}
          className={btnClass}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={handleItalic}
          disabled={disabledState}
          className={btnClass}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={handleStrikethrough}
          disabled={disabledState}
          className={btnClass}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          onClick={handleUnderline}
          disabled={disabledState}
          className={btnClass}
          title="Underline"
        >
          <u>U</u>
        </button>
      </div>

      <div className="markdown-toolbar-group">
        <button
          onClick={handleQuote}
          disabled={disabledState}
          className={btnClass}
          title="Quote"
        >
          „
        </button>
        <button
          onClick={handleCodeBlock}
          disabled={disabledState}
          className={btnClass}
          title="Code block"
        >
          {"<>"}
        </button>
        <button
          onClick={handleList}
          disabled={disabledState}
          className={btnClass}
          title="List"
        >
          ⋮
        </button>
      </div>

      <div className="markdown-toolbar-group">
        <button
          onClick={handleLink}
          disabled={disabledState}
          className={btnClass}
          title="Link"
        >
          <span className="material-icons-round" style={{ fontSize: '14px' }}>link</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabledState || uploading}
          className={btnClass}
          title="Image"
        >
          <span className="material-icons-round" style={{ fontSize: '14px' }}>{uploading ? 'hourglass_empty' : 'image'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleHorizontalRule}
          disabled={disabledState}
          className={btnClass}
          title="Horizontal rule"
        >
          —
        </button>
        <button
          onClick={handleFigure}
          disabled={disabledState}
          className={btnClass}
          title="Image with caption"
        >
          <span className="material-icons-round" style={{ fontSize: '14px' }}>photo_camera</span>
        </button>
      </div>
    </div>
  )
}
