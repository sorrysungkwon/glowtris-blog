'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

const SkeletonUI = () => (
  <div className="animate-pulse w-full">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-5 mb-6">
      <div className="flex items-center gap-4">
        <div className="h-6 w-24 bg-gray-200 dark:bg-white/5 rounded"></div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-white/5 rounded"></div>
      </div>
      <div className="h-8 w-28 bg-gray-200 dark:bg-white/5 rounded-full"></div>
    </div>
    
    {/* Input Box Skeleton */}
    <div className="h-[120px] w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl mb-8"></div>
    
    {/* Comments Area Skeleton */}
    <div className="space-y-6">
      {/* Comment 1 */}
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/5 shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 w-32 bg-gray-200 dark:bg-white/5 rounded mb-3"></div>
          <div className="h-28 w-full bg-gray-100 dark:bg-[#0e0e20] border border-gray-200 dark:border-white/5 rounded-2xl"></div>
        </div>
      </div>
      
      {/* Comment 2 */}
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/5 shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 w-24 bg-gray-200 dark:bg-white/5 rounded mb-3"></div>
          <div className="h-20 w-full bg-gray-100 dark:bg-[#0e0e20] border border-gray-200 dark:border-white/5 rounded-2xl"></div>
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
      <div className={`transition-opacity duration-500 w-full ${isLoaded ? 'opacity-100 block' : 'opacity-0 absolute top-0 left-0 -z-10 pointer-events-none'}`}>
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
          inputPosition="top"
          theme={theme}
          lang={lang}
          loading="lazy"
        />
      </div>
    </div>
  )
}
