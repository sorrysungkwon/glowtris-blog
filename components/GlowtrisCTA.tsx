import GameEmbed from './GameEmbed'

type Props = { lang?: string }

export default function GlowtrisCTA({ lang = 'en' }: Props) {
  const isKo = lang === 'ko'

  return (
    <div className="cta-embed-container">
      <h3 className="cta-embed-title" style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
        {isKo ? '👇 여기서 바로 플레이 해보세요!' : '👇 Play Glowtris right here!'}
      </h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {isKo 
          ? '브라우저에서 무료로 즐기는 네온 블록 퍼즐 게임. 데일리 챌린지에 도전해보세요.' 
          : 'A free neon block-stacking game in your browser. Try the daily challenges!'}
      </p>
      <GameEmbed />
    </div>
  )
}
