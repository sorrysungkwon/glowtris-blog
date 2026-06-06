import { getAllPostMeta } from '@/lib/posts'
import PostGrid from '@/components/PostGrid'

interface Props {
  searchParams: Promise<{ lang?: string }>
}

export default async function Home({ searchParams }: Props) {
  const { lang = 'en' } = await searchParams
  const posts = getAllPostMeta()

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">GLOWTRIS · BLOG</p>
          <h1 className="hero-title">Behind the blocks</h1>
          <p className="hero-sub">
            Dev logs, architecture decisions, and the honest story<br />of building a browser Tetris from scratch.
          </p>
          <a
            href="https://glowtris.com"
            className="hero-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⚡ Play Glowtris
          </a>
        </div>
      </section>

      <div className="container">
        <PostGrid posts={posts} lang={lang} />
      </div>
    </>
  )
}
