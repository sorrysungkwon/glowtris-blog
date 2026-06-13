import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const fontData = await readFile(join(process.cwd(), 'public', 'fonts', 'Orbitron-GLOWTRIS.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          background: '#04041e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Full-page grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,200,255,0.055) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(0,200,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            display: 'flex',
          }}
        />

        {/* Ambient glow — cyan top-left */}
        <div style={{ position: 'absolute', top: -60, left: 180, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.11) 0%, transparent 65%)', display: 'flex' }} />
        {/* Ambient glow — purple bottom-right */}
        <div style={{ position: 'absolute', bottom: -60, right: 140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,0,255,0.09) 0%, transparent 65%)', display: 'flex' }} />

        {/* Content column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* GLOWTRIS */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
            <span
              style={{
                fontSize: 104,
                fontWeight: 900,
                fontFamily: 'Orbitron',
                letterSpacing: '16px',
                color: '#00c8ff',
                textShadow: '0 2px 18px rgba(0,200,255,0.65), 0 0 44px rgba(0,200,255,0.2)',
              }}
            >
              GLOW
            </span>
            <span
              style={{
                fontSize: 104,
                fontWeight: 900,
                fontFamily: 'Orbitron',
                letterSpacing: '16px',
                color: '#a000ff',
                textShadow: '0 2px 18px rgba(160,0,255,0.65), 0 0 44px rgba(160,0,255,0.2)',
              }}
            >
              TRIS
            </span>
          </div>

          {/* Separator */}
          <div
            style={{
              width: 520,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.5), rgba(160,0,255,0.5), transparent)',
              marginBottom: 24,
              display: 'flex',
            }}
          />

          {/* URL */}
          <div
            style={{
              fontSize: 22,
              fontFamily: 'monospace',
              letterSpacing: '6px',
              color: 'rgba(255,255,255,0.35)',
              display: 'flex',
            }}
          >
            blog.glowtris.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Orbitron', data: fontData, weight: 900, style: 'normal' }],
    }
  )
}
