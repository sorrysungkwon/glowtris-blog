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
    let fallbackTimer: NodeJS.Timeout;

    // Listen for Giscus load event to hide Skeleton
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      if (!(typeof event.data === 'object' && event.data.giscus)) return;
      
      const giscusData = event.data.giscus;
      
      // Giscus sends preliminary 'resizeHeight' messages while the cat loading spinner is active.
      // We MUST wait until it actually sends 'discussion' (success) or 'error' (empty/not created).
      if (!('discussion' in giscusData) && !('error' in giscusData)) {
        return; // Ignore preliminary messages
      }
      
      // Add a slight delay to allow iframe CSS to render completely
      setTimeout(() => setIsLoaded(true), 150);
      clearTimeout(fallbackTimer);
    };

    window.addEventListener('message', handleMessage);

    // Fallback: If Giscus fails to send a message (or event is missed), force load after 3.5s
    fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 3500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    const getThemeUrl = (isDark: boolean) => 
      `https://blog.glowtris.com/giscus-${isDark ? 'dark' : 'light'}.css`

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
    <div style={{ marginTop: '4rem' }}>
      <div className="giscus-grid">
        {/* Skeleton maintains minimum height to prevent footer jump */}
        <div className={`giscus-grid-item ${isLoaded ? 'giscus-invisible' : 'giscus-visible'}`}>
          <SkeletonUI />
        </div>
        
        {/* Giscus iframe loads and fades in, overlapping perfectly */}
        <div className={`giscus-grid-item ${isLoaded ? 'giscus-visible' : 'giscus-invisible'}`}>
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
          />
        </div>
      </div>
    </div>
  )
}
