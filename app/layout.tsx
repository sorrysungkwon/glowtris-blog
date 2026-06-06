import type { Metadata } from 'next'
import Link from 'next/link'
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
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
                <Link href="https://glowtris.com" target="_blank" rel="noopener noreferrer">
                  Play the game ↗
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-inner">
              <span className="footer-logo">GLOWTRIS</span>
              <div className="footer-links">
                <Link href="https://glowtris.com" target="_blank" rel="noopener noreferrer">Game</Link>
                <Link href="https://glowtris.com/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</Link>
              </div>
              <span>© 2026 Glowtris</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
