import { NextResponse } from 'next/server'
import { getAllPostMeta } from '@/lib/posts'

const BASE_URL = 'https://blog.glowtris.com'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = await getAllPostMeta()

  const items = posts
    .map(post => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${BASE_URL}/posts/${post.slug}</link>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <guid isPermaLink="true">${BASE_URL}/posts/${post.slug}</guid>
    <category>${escapeXml(post.category)}</category>
  </item>`)
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Glowtris Blog</title>
    <link>${BASE_URL}</link>
    <description>Dev logs, updates, and game tips from the Glowtris team.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
