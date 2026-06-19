'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

export default function GiscusComments({ lang }: { lang: string }) {
  const [theme, setTheme] = useState('https://blog.glowtris.com/giscus-dark.css')

  useEffect(() => {
    // Check if body has light-theme class
    const getThemeUrl = (isLight: boolean) => 
      `${window.location.origin}/giscus-${isLight ? 'light' : 'dark'}.css`

    const isLight = document.body.classList.contains('light-theme')
    setTheme(getThemeUrl(isLight))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isLightNow = document.body.classList.contains('light-theme')
          setTheme(getThemeUrl(isLightNow))
        }
      })
    })

    observer.observe(document.body, { attributes: true })
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
