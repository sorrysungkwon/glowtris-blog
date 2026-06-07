'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LangToggleInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lang = searchParams.get('lang') ?? 'en'

  function setLang(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'ko') {
      params.set('lang', 'ko')
    } else {
      params.delete('lang')
    }
    const qs = params.toString()
    router.push(pathname + (qs ? '?' + qs : ''))
  }

  return (
    <div className="lang-toggle">
      <button
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
        aria-label="English"
      >
        EN
      </button>
      <button
        className={lang === 'ko' ? 'active' : ''}
        onClick={() => setLang('ko')}
        aria-label="한국어"
      >
        KO
      </button>
    </div>
  )
}

export default function LangToggle() {
  return (
    <Suspense fallback={
      <div className="lang-toggle">
        <span>EN</span><span>KO</span>
      </div>
    }>
      <LangToggleInner />
    </Suspense>
  )
}
