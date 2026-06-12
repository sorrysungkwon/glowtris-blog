import { getAllPostMeta } from '@/lib/posts'
import PostGrid from '@/components/PostGrid'
import HeroNodes from '@/components/HeroNodes'

interface Props {
  searchParams: Promise<{ lang?: string }>
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
              <span className="material-icons-round" style={{ fontSize: '18px', verticalAlign: 'middle' }}>bolt</span> Play Glowtris
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
