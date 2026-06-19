'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

const SkeletonUI = () => (
  <div className="skeleton-wrapper">
    <div className="skeleton-header">
      <div className="skeleton-header-left">
        <div className="skeleton-box skeleton-text-sm"></div>
        <div className="skeleton-box skeleton-text-sm"></div>
      </div>
      <div className="skeleton-box skeleton-text-md"></div>
    </div>
    
    <div className="skeleton-box skeleton-input"></div>
    
    <div>
      <div className="skeleton-comment">
        <div className="skeleton-box skeleton-avatar"></div>
        <div className="skeleton-comment-body">
          <div className="skeleton-box skeleton-comment-name"></div>
          <div className="skeleton-box skeleton-comment-box"></div>
        </div>
      </div>
      
      <div className="skeleton-comment">
        <div className="skeleton-box skeleton-avatar"></div>
        <div className="skeleton-comment-body">
          <div className="skeleton-box skeleton-comment-name" style={{ width: '90px' }}></div>
          <div className="skeleton-box skeleton-comment-box-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function GiscusComments({ lang }: { lang: string }) {
  const [theme, setTheme] = useState('https://blog.glowtris.com/giscus-dark.css')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Listen for Giscus load event to hide Skeleton
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      if (!(typeof event.data === 'object' && event.data.giscus)) return;
      
      // Add a slight delay to allow iframe CSS to render completely
      setTimeout(() => setIsLoaded(true), 150);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    <div className="giscus-wrapper relative min-h-[400px]" style={{ marginTop: '4rem' }}>
      {/* Display Skeleton until Giscus fires load event */}
      {!isLoaded && <SkeletonUI />}
      
      {/* Keep Giscus in DOM to load, but hide visually until ready to prevent partial renders */}
      <div className={`giscus-fade ${isLoaded ? 'giscus-loaded' : 'giscus-loading'}`}>
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
          emitMetadata="1"
          inputPosition="top"
          theme={theme}
          lang={lang}
          loading="lazy"
        />
      </div>
    </div>
  )
}
