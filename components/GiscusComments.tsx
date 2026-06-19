'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

export default function GiscusComments({ lang }: { lang: string }) {
  const [theme, setTheme] = useState('dark_dimmed')

  useEffect(() => {
    // Check if body has light-theme class
    const isLight = document.body.classList.contains('light-theme')
    setTheme(isLight ? 'light' : 'dark_dimmed')

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isLightNow = document.body.classList.contains('light-theme')
          setTheme(isLightNow ? 'light' : 'dark_dimmed')
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
        repoId="R_kgDOSyI_qw"
        category="Comments"
        categoryId="DIC_kwDOSyI_q84Cm_z3"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang={lang}
        loading="lazy"
      />
    </div>
  )
}
