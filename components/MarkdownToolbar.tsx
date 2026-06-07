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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
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
          🔗
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabledState || uploading}
          className={btnClass}
          title="Image"
        >
          {uploading ? '⏳' : '🖼️'}
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
      </div>
    </div>
  )
}
