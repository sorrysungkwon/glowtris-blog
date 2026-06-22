import GameEmbed from './GameEmbed'

type Props = { lang?: string }

export default function GlowtrisCTA({ lang = 'en' }: Props) {
  const isKo = lang === 'ko'

  return (
    <div className="glowtris-cta">
      <div className="glowtris-cta-inner" style={{ marginBottom: '24px' }}>
        <div>
          <span className="glowtris-cta-label">Play Now</span>
          <h3 className="glowtris-cta-title">GLOWTRIS</h3>
          <p className="glowtris-cta-desc">
            {isKo
              ? '무료 네온 블록 퍼즐. 설치 없이 웹에서 바로 즐기세요!'
              : 'Free neon block puzzle. Play instantly in your browser!'}
          </p>
        </div>
        <a
          href="https://glowtris.com"
          target="_blank"
          rel="noopener"
          className="glowtris-cta-btn"
        >
          {isKo ? '🎮 플레이하기 →' : '🎮 Play Free →'}
        </a>
      </div>
      <GameEmbed />
    </div>
  )
}
