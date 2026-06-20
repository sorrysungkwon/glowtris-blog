'use client'

import { useState, useEffect } from 'react'

export default function ShareButton({ title, lang = 'en' }: { title: string, lang?: string }) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShare(true)
    }
  }, [])

  const handleShare = async () => {
    const url = window.location.href

    if (canShare) {
      try {
        await navigator.share({
          title,
          url,
        })
        return
      } catch (err) {
        // Fallback to copy if share fails (e.g., user aborts or not supported)
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="share-btn"
      aria-label={lang === 'ko' ? '공유하기' : 'Share'}
      title={lang === 'ko' ? '공유하기' : 'Share'}
    >
      <span className="material-icons-round" aria-hidden="true" style={{ fontSize: '16px' }}>
        {copied ? 'check' : 'ios_share'}
      </span>
      <span className="share-btn-text">
        {copied 
          ? (lang === 'ko' ? '복사됨!' : 'Copied!') 
          : (lang === 'ko' ? '공유' : 'Share')
        }
      </span>
    </button>
  )
}
