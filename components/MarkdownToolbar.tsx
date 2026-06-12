'use client'

import { useState } from 'react'
import ImageUploadModal from './ImageUploadModal'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onChange: (content: string) => void
  disabled?: boolean
}

export default function MarkdownToolbar({ textareaRef, onChange, disabled }: MarkdownToolbarProps) {
  const [showModal, setShowModal] = useState(false)

  function getSelection() {
    const el = textareaRef.current
    if (!el) return { before: '', selected: '', after: '' }
    return {
      before: el.value.slice(0, el.selectionStart),
      selected: el.value.slice(el.selectionStart, el.selectionEnd),
      after: el.value.slice(el.selectionEnd),
    }
  }

  function insertMarkdown(before: string, after = '') {
    const { before: b, selected: s, after: a } = getSelection()
    const el = textareaRef.current
    if (!el) return
    onChange(b + before + s + after + a)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(b.length + before.length + s.length, b.length + before.length + s.length)
    }, 0)
  }

  function insertBlock(prefix: string, suffix = '') {
    const { before: b, selected: s, after: a } = getSelection()
    const el = textareaRef.current
    if (!el) return
    const bl = b.endsWith('\n') ? b : b + '\n'
    const al = a.startsWith('\n') ? a : '\n' + a
    onChange(bl + prefix + s + suffix + al)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(bl.length + prefix.length + s.length, bl.length + prefix.length + s.length)
    }, 0)
  }

  function handleHeader(level: 1 | 2 | 3) {
    const prefix = '#'.repeat(level) + ' '
    const { selected } = getSelection()
    insertBlock(prefix, selected ? '' : 'Heading text')
  }

  function handleLink() {
    const { selected } = getSelection()
    const url = prompt('Enter URL:')
    if (url) insertMarkdown(`[${selected || 'link text'}](${url})`)
  }

  // Called by the modal after a successful upload
  function handleImageInsert(url: string, alt: string, caption: string, credit: string) {
    const el = textareaRef.current
    if (!el) return

    let snippet: string
    if (caption || credit) {
      const creditHtml = credit
        ? `\n  <span class="figcredit">Source: ${credit}</span>`
        : ''
      snippet = `<figure>\n  <img src="${url}" alt="${alt}" />\n  <figcaption>${caption}${creditHtml}\n  </figcaption>\n</figure>`
    } else {
      snippet = `![${alt || 'Image'}](${url})`
    }

    const { before: b, after: a } = getSelection()
    const bl = b.endsWith('\n') ? b : b + '\n'
    const al = a.startsWith('\n') ? a : '\n' + a
    onChange(bl + snippet + al)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(bl.length + snippet.length, bl.length + snippet.length)
    }, 0)

    setShowModal(false)
  }

  const btn = 'markdown-toolbar-btn'
  const off = disabled

  return (
    <>
      <div className="markdown-toolbar">
        <div className="markdown-toolbar-group">
          <button onClick={() => handleHeader(1)} disabled={off} className={btn} title="Header 1">H1</button>
          <button onClick={() => handleHeader(2)} disabled={off} className={btn} title="Header 2">H2</button>
          <button onClick={() => handleHeader(3)} disabled={off} className={btn} title="Header 3">H3</button>
        </div>

        <div className="markdown-toolbar-group">
          <button onClick={() => insertMarkdown('**', '**')} disabled={off} className={btn} title="Bold"><strong>B</strong></button>
          <button onClick={() => insertMarkdown('*', '*')} disabled={off} className={btn} title="Italic"><em>I</em></button>
          <button onClick={() => insertMarkdown('~~', '~~')} disabled={off} className={btn} title="Strikethrough"><s>S</s></button>
          <button onClick={() => insertMarkdown('<u>', '</u>')} disabled={off} className={btn} title="Underline"><u>U</u></button>
        </div>

        <div className="markdown-toolbar-group">
          <button onClick={() => insertBlock('> ')} disabled={off} className={btn} title="Quote">„</button>
          <button onClick={() => insertBlock('```\n', '\n```')} disabled={off} className={btn} title="Code block">{'<>'}</button>
          <button onClick={() => insertBlock('- ')} disabled={off} className={btn} title="List">⋮</button>
        </div>

        <div className="markdown-toolbar-group">
          <button onClick={handleLink} disabled={off} className={btn} title="Link">
            <span className="material-icons-round" style={{ fontSize: '14px' }}>link</span>
          </button>
          {/* Image button → opens modal with drag-drop, compression, progress */}
          <button onClick={() => setShowModal(true)} disabled={off} className={btn} title="Insert image">
            <span className="material-icons-round" style={{ fontSize: '14px' }}>image</span>
          </button>
          <button onClick={() => insertBlock('---')} disabled={off} className={btn} title="Horizontal rule">—</button>
        </div>
      </div>

      {showModal && (
        <ImageUploadModal
          onInsert={handleImageInsert}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
