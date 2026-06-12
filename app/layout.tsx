import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import LangToggle from '@/components/LangToggle'
import { GoogleTagManager } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Glowtris Blog',
    template: '%s — Glowtris Blog',
  },
  description: 'Dev logs, updates, and game tips from the Glowtris team.',
  metadataBase: new URL('https://blog.glowtris.com'),
  openGraph: {
    type: 'website',
    siteName: 'Glowtris Blog',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://blog.glowtris.com/feed.xml',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
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
                >
                  <span className="nav-play-text">Play the game ↗</span>
                  <span className="nav-play-icon" aria-hidden="true" title="Play Glowtris">🎮</span>
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
