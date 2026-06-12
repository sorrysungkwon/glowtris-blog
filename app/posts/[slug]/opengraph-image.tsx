import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/posts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = 'Glowtris Blog'
  let category = 'BLOG'
  let gradient = 'linear-gradient(135deg, #00c8ff 0%, #0040ff 100%)'
  let readingTime = 0
  let emoji = ''

  try {
    const post = await getPost(slug)
    title = post.title
    category = post.category
    gradient = post.coverGradient
    readingTime = post.readingTime
    emoji = post.coverEmoji || ''
  } catch {
    // fallback values above
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          background: gradient,
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Subtle dark overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 60%)',
          }}
        />

        {/* Background emoji */}
        {emoji && (
          <div
            style={{
              position: 'absolute',
              right: 72,
              top: '50%',
              fontSize: 180,
              opacity: 0.15,
              transform: 'translateY(-50%)',
            }}
          >
            {emoji}
          </div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
              }}
            >
              GLOWTRIS BLOG · {category}
            </span>
          </div>

          <div
            style={{
              fontSize: title.length > 60 ? 40 : title.length > 40 ? 48 : 56,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {title}
          </div>

          {readingTime > 0 && (
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              {readingTime} min read
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
