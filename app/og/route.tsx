import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Fetch fonts
    const fontRegular = await fetch(new URL('/fonts/Pretendard-Regular.woff', req.url)).then((res) => res.arrayBuffer())
    const fontBold = await fetch(new URL('/fonts/Pretendard-Bold.woff', req.url)).then((res) => res.arrayBuffer())

    // Parse parameters
    const title = searchParams.get('title')?.slice(0, 80) || 'Glowtris Blog'
    const category = searchParams.get('category') || 'TECH'
    const date = searchParams.get('date') || ''
    const readTime = searchParams.get('readTime') || ''
    const author = searchParams.get('author') || 'Glowtris Team'
    // Fallback to a nice dark gradient if none provided
    const gradient = searchParams.get('gradient') || 'linear-gradient(135deg, #0e0e20 0%, #080814 100%)'
    const emoji = searchParams.get('emoji') || '✨'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '80px',
            background: gradient, // Can be a color or gradient string
            color: 'white',
            fontFamily: '"Pretendard", sans-serif',
          }}
        >
          {/* Top Row: Category & Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 24px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              {category}
            </div>
            <div style={{ display: 'flex' }}>
              <img src={new URL('/logo-blog-white.png', req.url).href} alt="Glowtris Logo" height="36" />
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              marginTop: '40px',
            }}
          >
            <div style={{ fontSize: 72 }}>{emoji}</div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                textShadow: '0 4px 24px rgba(0,0,0,0.3)',
                wordBreak: 'keep-all',
              }}
            >
              {title}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Pretendard',
            data: fontRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Pretendard',
            data: fontBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    )
  } catch (e: any) {
    return new Response('Failed to generate image', { status: 500 })
  }
}
