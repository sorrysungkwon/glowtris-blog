import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import LangToggle from '@/components/LangToggle'
import { GoogleTagManager } from '@next/third-parties/google'
import { Orbitron } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-brand',
  display: 'swap',
})

const pretendard = localFont({
  src: [
    {
      path: '../public/fonts/Pretendard-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Bold.woff',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-body',
  display: 'swap',
})

const materialIcons = localFont({
  src: '../public/fonts/MaterialIconsRound.woff2',
  variable: '--font-material',
  display: 'block',
  weight: '400',
  style: 'normal',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,

}

export const metadata: Metadata = {
  title: {
    default: 'Glowtris Blog — Indie Game Dev Log',
    template: '%s — Glowtris Blog',
  },
  description: 'Behind-the-scenes dev log for Glowtris — a free browser block-stacking game. Game mechanics, design decisions, and indie dev stories.',
  keywords: ['indie game dev blog', 'tetris clone devlog', 'block game development', 'browser game dev', 'Next.js game', 'indie game development', 'Glowtris'],
  metadataBase: new URL('https://blog.glowtris.com'),
  openGraph: {
    type: 'website',
    siteName: 'Glowtris Blog',
    title: 'Glowtris Blog — Indie Game Dev Log',
    description: 'Behind-the-scenes dev log for Glowtris — a free browser block-stacking game.',
    url: 'https://blog.glowtris.com',
    images: [{ url: '/og?title=Glowtris+Blog&category=HOME', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glowtris Blog — Indie Game Dev Log',
    description: 'Behind-the-scenes dev log for Glowtris — a free browser block-stacking game.',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://blog.glowtris.com/rss.xml',
    },
    languages: {
      'en': 'https://blog.glowtris.com',
      'ko': 'https://blog.glowtris.com/?lang=ko',
      'x-default': 'https://blog.glowtris.com',
    },
  },
}

const noFlashScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

const googleTranslateCrashPatch = `
(function(){
  if (typeof window === 'undefined') return;
  var originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };
  var originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${orbitron.variable} ${pretendard.variable} ${materialIcons.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script dangerouslySetInnerHTML={{ __html: googleTranslateCrashPatch }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Glowtris Blog",
            "url": "https://blog.glowtris.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://blog.glowtris.com/?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Glowtris Blog",
            "description": "Indie game dev log for Glowtris — a free browser block-stacking game.",
            "url": "https://blog.glowtris.com",
            "author": { "@type": "Person", "name": "sorrysungkwon" },
            "inLanguage": ["en", "ko"],
            "about": { "@type": "VideoGame", "name": "Glowtris", "url": "https://glowtris.com" }
          }
        ])}} />
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <div className="header-inner">
              <Link href="/" className="header-logo">GLOWTRIS BLOG</Link>

              <nav className="header-nav">
                <Link
                  href="https://glowtris.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                  aria-label="Play Glowtris"
                >
                  <span className="nav-play-text">Play the game ↗</span>
                  <span className="nav-play-icon material-icons-round" aria-hidden="true" title="Play Glowtris" style={{ fontSize: '16px' }}>sports_esports</span>
                </Link>

                {/* Controls grouped together — Gestalt: proximity */}
                <div className="header-controls">
                  <LangToggle />
                  <div className="header-divider" />
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>
        <GoogleTagManager gtmId="GTM-PMZTHX9N" />

        <footer className="site-footer">
          <div className="container">
            <div className="footer-inner">
              {/* Brand cluster — proximity */}
              <div className="footer-brand">
                <span className="footer-logo">GLOWTRIS</span>
                <span className="footer-tagline">Behind the blocks</span>
              </div>
              <div className="footer-links">
                <Link href="https://glowtris.com" target="_blank" rel="noopener noreferrer">Game</Link>
                <Link href="https://glowtris.com/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</Link>
              </div>
              <span className="footer-copy">© 2026 Glowtris</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
