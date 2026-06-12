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


  return (
    <>
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
      </div>
    </>
  )
}
