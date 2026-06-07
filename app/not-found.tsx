import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <section className="not-found-section">
      <div className="container not-found-container">
        {/* Ambient background glows */}
        <div className="not-found-glow-1" />
        <div className="not-found-glow-2" />

        {/* 404 Block-themed Graphic */}
        <div className="not-found-graphic">
          <div className="not-found-grid" />
          <h1 className="not-found-code">404</h1>
          <div className="falling-block block-i" />
          <div className="falling-block block-t" />
          <div className="falling-block block-o" />
        </div>

        {/* Message */}
        <div className="not-found-content">
          <h2 className="not-found-title">
            Lost in the Grid <span className="not-found-title-ko">· 길을 잃다</span>
          </h2>
          <p className="not-found-desc">
            The block did not land in the right spot. The page you are looking for has been cleared, or never fell into place.
            <span className="not-found-desc-ko">블록이 제 위치에 착지하지 못했습니다. 찾으시는 페이지가 삭제되었거나 이동되었을 수 있습니다.</span>
          </p>

          {/* Action buttons */}
          <div className="not-found-actions">
            <Link href="/" className="not-found-btn not-found-btn-primary">
              ← Back to Home
            </Link>
            <a
              href="https://glowtris.com"
              target="_blank"
              rel="noopener noreferrer"
              className="not-found-btn not-found-btn-secondary"
            >
              ⚡ Play Glowtris
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
