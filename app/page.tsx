import { getAllPostMeta } from '@/lib/posts'
import PostGrid from '@/components/PostGrid'
import HeroNodes from '@/components/HeroNodes'
import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang = 'en' } = await searchParams
  return {
    title: lang === 'ko' ? '글로트리스 블로그' : 'Glowtris Blog',
    description: lang === 'ko'
      ? '블록 게임 글로트리스의 개발 로그, 아키텍처 의사결정, 그리고 바닥부터 브라우저 테트리스를 개발한 솔직한 이야기.'
      : 'Dev logs, architecture decisions, and the honest story of building a browser Tetris from scratch.',
    alternates: {
      canonical: lang === 'ko' ? 'https://blog.glowtris.com/?lang=ko' : 'https://blog.glowtris.com/',
      languages: {
        'en': 'https://blog.glowtris.com/',
        'ko': 'https://blog.glowtris.com/?lang=ko',
        'x-default': 'https://blog.glowtris.com/',
      },
    },
  }
}

export default async function Home({ searchParams }: Props) {
  const { lang = 'en' } = await searchParams
  const posts = await getAllPostMeta(lang)

  const rootFaqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: lang === 'ko' ? '글로우트리스 블로그는 어떤 곳인가요?' : 'What is the Glowtris Blog?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: lang === 'ko' ? '무료 웹 브라우저 블록 퍼즐 게임인 글로우트리스(Glowtris)의 개발 과정, 아키텍처 의사결정, 프론트엔드 최적화 등 인디 게임 개발의 여정을 기록하는 공간입니다.' : 'It is a space where we record the journey of indie game development, including Glowtris development processes, architecture decisions, and frontend optimizations.'
        }
      },
      {
        '@type': 'Question',
        name: lang === 'ko' ? '글로우트리스 게임은 어떻게 플레이하나요?' : 'How do I play Glowtris?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: lang === 'ko' ? '다운로드나 설치, 회원가입 없이 PC나 모바일 웹 브라우저에서 glowtris.com 에 접속하시면 곧바로 무료로 플레이하실 수 있습니다.' : 'You can play for free immediately by visiting glowtris.com in your web browser, with no downloads, installations, or sign-ups required.'
        }
      }
    ]
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://blog.glowtris.com/posts/${post.slug}${lang === 'ko' ? '?lang=ko' : ''}`
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(rootFaqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* Hero — Gestalt: continuity, figure-ground */}
      <section className="hero">
        <HeroNodes />
        <div className="container">
          <div className="hero-inner">
            <p className="hero-eyebrow">
              <span>✦</span>
              GLOWTRIS · BLOG
            </p>
            <h1 className="hero-title">
              <span className="hero-title-text">Behind the blocks</span>
            </h1>
            <p className="hero-sub">
              Dev logs, architecture decisions, and the honest story
              of building a browser Tetris from scratch.
            </p>
            <a
              href="https://glowtris.com"
              className="hero-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-icons-round" style={{ fontSize: '18px' }}>bolt</span>
              <span>Play Glowtris</span>
            </a>
          </div>
        </div>
      </section>

      <div className="container">
        <PostGrid posts={posts} lang={lang} />
        
        {/* Visible FAQ Section for Google Rich Results validation */}
        <section className="faq-section" style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', opacity: 0.3 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text)' }}>
            {lang === 'ko' ? '자주 묻는 질문 (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h2>
          <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ fontWeight: '600', color: 'var(--text-strong)' }}>
              {lang === 'ko' ? '글로우트리스 블로그는 어떤 곳인가요?' : 'What is the Glowtris Blog?'}
            </summary>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {lang === 'ko' 
                ? '무료 웹 브라우저 블록 퍼즐 게임인 글로우트리스(Glowtris)의 개발 과정, 아키텍처 의사결정, 프론트엔드 최적화 등 인디 게임 개발의 여정을 기록하는 공간입니다.' 
                : 'It is a space where we record the journey of indie game development, including Glowtris development processes, architecture decisions, and frontend optimizations.'}
            </p>
          </details>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: '600', color: 'var(--text-strong)' }}>
              {lang === 'ko' ? '글로우트리스 게임은 어떻게 플레이하나요?' : 'How do I play Glowtris?'}
            </summary>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {lang === 'ko' 
                ? '다운로드나 설치, 회원가입 없이 PC나 모바일 웹 브라우저에서 glowtris.com 에 접속하시면 곧바로 무료로 플레이하실 수 있습니다.' 
                : 'You can play for free immediately by visiting glowtris.com in your web browser, with no downloads, installations, or sign-ups required.'}
            </p>
          </details>
        </section>
      </div>
    </>
  )
}
