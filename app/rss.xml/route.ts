import { getAllPostMeta } from '@/lib/posts'
import { NextResponse } from 'next/server'

const BASE_URL = 'https://blog.glowtris.com'

function generateRss(posts: any[]) {
  const items = posts
    .map((post) => {
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${BASE_URL}/posts/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${post.category}]]></category>
    </item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Glowtris Blog</title>
    <link>${BASE_URL}</link>
    <description>Glowtris Blog - AI, Development, Design, and Updates.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`
}

export async function GET() {
  const posts = await getAllPostMeta()
  const rss = generateRss(posts)

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
