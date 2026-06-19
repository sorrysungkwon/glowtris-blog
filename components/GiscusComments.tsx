'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

export default function GiscusComments({ lang }: { lang: string }) {
  const [theme, setTheme] = useState('https://blog.glowtris.com/giscus-dark.css')

  useEffect(() => {
    const getThemeUrl = (isDark: boolean) => 
      `${window.location.origin}/giscus-${isDark ? 'dark' : 'light'}.css`

    const checkTheme = () => document.documentElement.getAttribute('data-theme') === 'dark'
    
    setTheme(getThemeUrl(checkTheme()))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(getThemeUrl(checkTheme()))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="giscus-wrapper" style={{ marginTop: '4rem' }}>
      <Giscus
        id="comments"
        repo="sorrysungkwon/glowtris-blog"
        repoId="R_kgDOSy2Pqw"
        category="Show and tell"
        categoryId="DIC_kwDOSy2Pq84C_ep8"
        mapping="pathname"
        strict="0"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme}
        lang={lang}
        loading="lazy"
      />
    </div>
  )
}
