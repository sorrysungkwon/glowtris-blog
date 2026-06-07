'use client'

import { useState } from 'react'

const colorsData = {
  game: {
    palette: [
      { name: '--cyan', hex: '#00c8ff', description: 'Primary brand accent' },
      { name: '--purple', hex: '#a000ff', description: 'Secondary brand accent' },
      { name: '--pink', hex: '#ff0080', description: 'Brand highlights' }
    ],
    states: [
      { name: '--green', hex: '#00ff88', description: 'Success state' },
      { name: '--amber', hex: '#ffe600', description: 'Warning state / Leaderboard' }
    ]
  },
  blog: {
    dark: {
      palette: [
        { name: '--cyan', hex: '#00c8ff', description: 'Electric cyan accent' },
        { name: '--purple', hex: '#a855f7', description: 'Neon purple tag border' },
        { name: '--pink', hex: '#f472b6', description: 'Highlight tag background' }
      ],
      states: [
        { name: '--green', hex: '#34d399', description: 'Success badge' },
        { name: '--amber', hex: '#fbbf24', description: 'Warning draft badge' }
      ]
    },
    light: {
      palette: [
        { name: '--cyan', hex: '#2563eb', description: 'Royal blue accent' },
        { name: '--purple', hex: '#7c3aed', description: 'Violet tag border' },
        { name: '--pink', hex: '#db2777', description: 'Highlight tag background' }
      ],
      states: [
        { name: '--green', hex: '#059669', description: 'Success badge' },
        { name: '--amber', hex: '#d97706', description: 'Warning draft badge' }
      ]
    }
  }
}

const radiiData = {
  game: [
    { token: '--r-xs', val: '0px', desc: 'Sharp corner. Tetris blocks & grid boundary' },
    { token: '--r-sm', val: '2px', desc: 'Mini button borders & checkbox' },
    { token: '--r-md', val: '4px', desc: 'Regular button borders, control inputs' },
    { token: '--r-lg', val: '6px', desc: 'Game panel subcontainers, sidebar tabs' },
    { token: '--r-xl', val: '8px', desc: 'Main UI overlay panels, modal borders' }
  ],
  blog: [
    { token: '--r-xs', val: '4px', desc: 'In-line code block tags, category badges' },
    { token: '--r-sm', val: '6px', desc: 'Theme switch buttons, language toggle buttons' },
    { token: '--r-md', val: '8px', desc: 'Standard input field borders, admin buttons' },
    { token: '--r-lg', val: '12px', desc: 'Post card containers, admin card lists' },
    { token: '--r-xl', val: '18px', desc: 'Featured post banner containers, modal screens' }
  ]
}

const elevData = {
  game: [
    { level: 'Elevation 1 (Border Focus)', desc: 'Transparent borders for grid separation.' },
    { level: 'Elevation 2 (Cyan Glow)', desc: 'Glowing shadow effect on cyan action buttons.' },
    { level: 'Elevation 3 (Purple Glow)', desc: 'Medium glow on purple panel frames.' },
    { level: 'Elevation 4 (Pink Neon)', desc: 'Intense flashing glow for play CTA buttons.' }
  ],
  blog: [
    { level: 'Elevation 1 (shadow-xs)', desc: 'Faint layered shadow. Used for language selection bars.' },
    { level: 'Elevation 2 (shadow-sm)', desc: 'Standard shadow. Used on blog post cards.' },
    { level: 'Elevation 3 (shadow-md)', desc: 'Floating shadow. Used on navigation headers.' },
    { level: 'Elevation 4 (shadow-lg)', desc: 'Modal overlays, delete confirmation boxes.' }
  ]
}

export default function DesignSystemPage() {
  const [system, setSystem] = useState<'game' | 'blog'>('game')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [sampleText, setSampleText] = useState('Behind the blocks: Glowtris Arcade Spec.')
  const [toastText, setToastText] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Motion demos
  const [fastMoved, setFastMoved] = useState(false)
  const [springMoved, setSpringMoved] = useState(false)

  const isGame = system === 'game'

  // Dynamic values injected based on active System/Theme
  const currentColors = isGame ? colorsData.game : colorsData.blog[theme]
  const currentRadii = isGame ? radiiData.game : radiiData.blog

  const handleCopy = (tokenName: string) => {
    navigator.clipboard.writeText(`var(${tokenName})`)
    setToastText(`Copied: var(${tokenName})`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1500)
  }

  // Generate local CSS variable overrides for preview containers
  const getPreviewStyles = () => {
    if (isGame) {
      return {
        '--bg': '#070514',
        '--surface': '#0a0820',
        '--surface-2': '#100d30',
        '--surface-3': '#181448',
        '--border': 'rgba(0, 200, 255, 0.2)',
        '--border-hi': 'rgba(0, 200, 255, 0.4)',
        '--text-color': 'rgba(255, 255, 255, 0.95)',
        '--text-sub': 'rgba(255, 255, 255, 0.6)',
        '--cyan': '#00c8ff',
        '--purple': '#a000ff',
        '--pink': '#ff0080',
        '--green': '#00ff88',
        '--amber': '#ffe600',
        '--font-brand': 'var(--font-brand)',
        '--font-body': 'var(--font-brand)',
        '--r-xl': '8px',
        '--r-lg': '6px',
        '--r-md': '4px',
        '--r-sm': '2px',
        '--r-xs': '0px',
        '--shadow-xs': '0 1px 2px rgba(0,0,0,0.5)',
        '--shadow-sm': '0 0 10px rgba(0, 200, 255, 0.2)',
        '--shadow-md': '0 0 15px rgba(160, 0, 255, 0.35)',
        '--shadow-lg': '0 0 25px rgba(255, 0, 128, 0.45)',
        '--ease-out': 'cubic-bezier(0.1, 0.9, 0.2, 1)',
        '--ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        '--t-fast': '100ms',
        '--t-mid': '180ms',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-body)',
        backgroundColor: 'var(--bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-hi)',
      } as React.CSSProperties
    }

    if (theme === 'light') {
      return {
        '--bg': '#f8f8fc',
        '--surface': '#ffffff',
        '--surface-2': '#f0f0f8',
        '--surface-3': '#e8e8f4',
        '--border': 'rgba(0, 0, 0, 0.06)',
        '--border-hi': 'rgba(0, 0, 0, 0.10)',
        '--text-color': '#2d2d3d',
        '--text-sub': '#6b7280',
        '--cyan': '#2563eb',
        '--purple': '#7c3aed',
        '--pink': '#db2777',
        '--green': '#059669',
        '--amber': '#d97706',
        '--font-brand': 'var(--font-brand)',
        '--font-body': 'var(--font-body)',
        '--r-xl': '18px',
        '--r-lg': '12px',
        '--r-md': '8px',
        '--r-sm': '6px',
        '--r-xs': '4px',
        '--shadow-xs': '0 1px 2px rgba(0,0,0,0.05)',
        '--shadow-sm': '0 2px 8px rgba(0,0,0,0.06)',
        '--shadow-md': '0 8px 24px rgba(0,0,0,0.08)',
        '--shadow-lg': '0 20px 48px rgba(0,0,0,0.1)',
        '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        '--ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        '--t-fast': '120ms',
        '--t-mid': '200ms',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-body)',
        backgroundColor: 'var(--bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-hi)',
      } as React.CSSProperties
    }

    // Default Blog Dark
    return {
      '--bg': '#080814',
      '--surface': '#0e0e20',
      '--surface-2': '#141428',
      '--surface-3': '#1c1c34',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hi': 'rgba(255, 255, 255, 0.11)',
      '--text-color': 'rgba(240, 240, 255, 0.9)',
      '--text-sub': 'rgba(240, 240, 255, 0.55)',
      '--cyan': '#00c8ff',
      '--purple': '#a855f7',
      '--pink': '#f472b6',
      '--green': '#34d399',
      '--amber': '#fbbf24',
      '--font-brand': 'var(--font-brand)',
      '--font-body': 'var(--font-body)',
      '--r-xl': '18px',
      '--r-lg': '12px',
      '--r-md': '8px',
      '--r-sm': '6px',
      '--r-xs': '4px',
      '--shadow-xs': '0 1px 2px rgba(0,0,0,0.3)',
      '--shadow-sm': '0 2px 8px rgba(0,0,0,0.3)',
      '--shadow-md': '0 8px 24px rgba(0,0,0,0.4)',
      '--shadow-lg': '0 20px 48px rgba(0,0,0,0.5)',
      '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      '--ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      '--t-fast': '120ms',
      '--t-mid': '200ms',
      color: 'var(--text-color)',
      fontFamily: 'var(--font-body)',
      backgroundColor: 'var(--bg)',
      borderRadius: '12px',
      border: '1px solid var(--border-hi)',
    } as React.CSSProperties
  }

  const pStyle = getPreviewStyles()

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
      
      {/* Control Navigation Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 20px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
            GLOWTRIS SYSTEM SPEC
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
            Interactive Guidelines
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Main system selector */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-3)',
            borderRadius: '999px',
            padding: '3px',
            border: '1px solid var(--border)'
          }}>
            <button
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '10px',
                fontWeight: 900,
                padding: '6px 14px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: isGame ? 'var(--text-primary)' : 'transparent',
                color: isGame ? 'var(--bg)' : 'var(--text-muted)',
                transition: 'all 0.15s'
              }}
              onClick={() => setSystem('game')}
            >
              🎮 GAME
            </button>
            <button
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '10px',
                fontWeight: 900,
                padding: '6px 14px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: !isGame ? 'var(--text-primary)' : 'transparent',
                color: !isGame ? 'var(--bg)' : 'var(--text-muted)',
                transition: 'all 0.15s'
              }}
              onClick={() => setSystem('blog')}
            >
              📝 BLOG
            </button>
          </div>

          {/* Sub theme selector (Blog only) */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-3)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border)',
            opacity: isGame ? 0.3 : 1,
            pointerEvents: isGame ? 'none' : 'auto',
            transition: 'opacity 0.2s'
          }}>
            <button
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: !isGame && theme === 'dark' ? 'var(--surface)' : 'transparent',
                color: !isGame && theme === 'dark' ? 'var(--text-primary)' : 'var(--text-faint)',
                transition: 'all 0.15s'
              }}
              onClick={() => setTheme('dark')}
            >
              🌙 DARK
            </button>
            <button
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: !isGame && theme === 'light' ? 'var(--surface)' : 'transparent',
                color: !isGame && theme === 'light' ? 'var(--text-primary)' : 'var(--text-faint)',
                transition: 'all 0.15s'
              }}
              onClick={() => setTheme('light')}
            >
              ☀ LIGHT
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Block */}
      <div style={pStyle}>
        <div style={{ padding: '40px 32px' }}>
          
          {/* 1. Overview */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
              01. OVERVIEW
            </h2>
            <p style={{ fontSize: isGame ? '12px' : '15px', letterSpacing: isGame ? '1.5px' : 'normal', opacity: 0.85 }}>
              {isGame 
                ? '글로우트리스 게임 디자인 가이드는 몰입감 넘치는 아케이드 연출을 위해 전용 Orbitron 타이포그래피와 각진 테트리스 미립자 코너(0px~8px) 설계, 그리고 초발광 형광 네온 컬러 조합을 적용받습니다.'
                : '글로우트리스 블로그 디자인 가이드는 다국어 가독성(Readability) 확보를 우선하여 Pretendard 폰트 페어링, 부드러운 UI 둥글기(4px~18px) 코너 및 고차원 다층 머티리얼 그림자 깊이를 적용받습니다.'
              }
            </p>
          </div>

          {/* 2. Color Tokens */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '1px' }}>
              02. COLORS
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '20px' }}>
              각 색상 카드를 클릭하여 클립보드에 CSS 토큰 변수를 복사할 수 있습니다.
            </p>

            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '12px' }}>
              Core Brand Palette
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {currentColors.palette.map(c => (
                <div 
                  key={c.name} 
                  onClick={() => handleCopy(c.name)}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="interactive-design-card"
                >
                  <div style={{ height: '70px', background: c.hex, boxShadow: isGame ? `0 0 12px ${c.hex}66` : 'none' }} />
                  <div style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, display: 'block' }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-sub)' }}>{c.hex}</span>
                  </div>
                </div>
              ))}
            </div>

            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '12px' }}>
              Functional States
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {currentColors.states.map(c => (
                <div 
                  key={c.name} 
                  onClick={() => handleCopy(c.name.split(' ')[0])}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="interactive-design-card"
                >
                  <div style={{ height: '70px', background: c.hex }} />
                  <div style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, display: 'block' }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-sub)' }}>{c.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Typography Playground */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
              03. TYPOGRAPHY
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '16px' }}>
              입력란의 내용을 바꾸어 각 테마 타이포그라피의 비례와 자간을 점검해 보세요.
            </p>
            <input 
              type="text" 
              value={sampleText} 
              onChange={e => setSampleText(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-hi)',
                color: 'var(--text-color)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '24px'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                  DISPLAY LARGE (Orbitron 900)
                </span>
                <span style={{ fontFamily: 'var(--font-brand)', fontSize: isGame ? '28px' : '36px', fontWeight: 900, display: 'block', wordBreak: 'break-all' }}>
                  {sampleText}
                </span>
              </div>
              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                  HEADLINE MEDIUM ({isGame ? 'Orbitron' : 'Pretendard'} Bold)
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: isGame ? '18px' : '20px', fontWeight: 700, display: 'block', wordBreak: 'break-all' }}>
                  {sampleText}
                </span>
              </div>
              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '4px' }}>
                  BODY MEDIUM ({isGame ? 'Orbitron' : 'Pretendard'} Regular)
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: isGame ? '12px' : '14px', fontWeight: 400, opacity: 0.85, display: 'block', wordBreak: 'break-all', letterSpacing: isGame ? '1.5px' : 'normal' }}>
                  {sampleText}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Shapes & Corners */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
              04. SHAPES
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {currentRadii.map((r, i) => {
                const radiusToken = ['xs', 'sm', 'md', 'lg', 'xl'][i]
                return (
                  <div 
                    key={r.token} 
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
                      borderRadius: `var(--r-${radiusToken})`,
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{r.token} ({r.val})</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-sub)', opacity: 0.8 }}>{r.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 5. Elevation */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
              05. ELEVATION
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {elevData[system].map((e, i) => {
                const shadowToken = ['xs', 'sm', 'md', 'lg'][i]
                const boxS = isGame && i > 0 
                  ? { borderColor: `var(${['--cyan', '--purple', '--pink'][i-1]})`, boxShadow: `0 0 15px var(${['--cyan', '--purple', '--pink'][i-1]})` }
                  : { boxShadow: `var(--shadow-${shadowToken})` }

                return (
                  <div 
                    key={e.level} 
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '24px 20px',
                      ...boxS
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '12px',
                      fontWeight: 900,
                      color: isGame && i > 0 ? `var(${['--cyan', '--purple', '--pink'][i-1]})` : 'var(--cyan)',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      {e.level}
                    </span>
                    <p style={{ fontSize: '11px', margin: 0 }}>{e.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 6. Motion */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
              06. MOTION & TIMING
            </h2>
            <div style={{ background: 'var(--surface-2)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isGame ? 'ARCADE FAST EASE' : 'BLOG FAST EASE'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '40px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: '40px',
                      height: '38px',
                      background: 'linear-gradient(to right, var(--cyan), var(--purple))',
                      position: 'absolute',
                      borderRadius: '4px',
                      left: fastMoved ? 'calc(100% - 40px)' : '0px',
                      transitionProperty: 'left',
                      transitionTimingFunction: 'var(--ease-out)',
                      transitionDuration: 'var(--t-fast)'
                    }} />
                  </div>
                  <button 
                    onClick={() => setFastMoved(!fastMoved)}
                    style={{
                      background: 'var(--cyan)',
                      color: '#000',
                      border: 'none',
                      fontFamily: 'var(--font-brand)',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '10px 16px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(0, 200, 255, 0.2)'
                    }}
                  >
                    RUN
                  </button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', opacity: 0.6, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isGame ? 'ARCADE SHARP BOUNCE' : 'BLOG SPRING BOUNCE'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '40px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: '40px',
                      height: '38px',
                      background: 'linear-gradient(to right, var(--cyan), var(--purple))',
                      position: 'absolute',
                      borderRadius: '4px',
                      left: springMoved ? 'calc(100% - 40px)' : '0px',
                      transitionProperty: 'left',
                      transitionTimingFunction: 'var(--ease-spring)',
                      transitionDuration: isGame ? '180ms' : '340ms'
                    }} />
                  </div>
                  <button 
                    onClick={() => setSpringMoved(!springMoved)}
                    style={{
                      background: 'var(--cyan)',
                      color: '#000',
                      border: 'none',
                      fontFamily: 'var(--font-brand)',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '10px 16px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(0, 200, 255, 0.2)'
                    }}
                  >
                    RUN
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Copy notification toast */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        background: 'var(--green)',
        color: '#000',
        padding: '12px 20px',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '13px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transform: showToast ? 'translateY(0)' : 'translateY(100px)',
        opacity: showToast ? 1 : 0,
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 9999
      }}>
        {toastText}
      </div>

    </div>
  )
}
