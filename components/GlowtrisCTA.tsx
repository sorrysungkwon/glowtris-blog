type Props = { lang?: string }

export default function GlowtrisCTA({ lang = 'en' }: Props) {
  const isKo = lang === 'ko'

  return (
    <div className="glowtris-cta">
      <div className="glowtris-cta-inner">
        <div className="glowtris-cta-left">
          <span className="glowtris-cta-label">
            {isKo ? '이 블로그에 대해' : 'About this blog'}
          </span>
          <p className="glowtris-cta-title">Glowtris</p>
          <p className="glowtris-cta-desc">
            {isKo
              ? '브라우저에서 무료로 즐기는 네온 블록 퍼즐 게임. 매일 새로운 데일리 챌린지, 글로벌 리더보드, 스프린트 모드.'
              : 'A free neon block-stacking game in your browser. Daily challenges, global leaderboard, sprint mode — no download needed.'}
          </p>
        </div>
        <a
          href="https://glowtris.com"
          target="_blank"
          rel="noopener noreferrer"
          className="glowtris-cta-btn"
        >
          {isKo ? '지금 플레이 →' : 'Play now →'}
        </a>
      </div>
    </div>
  )
}
