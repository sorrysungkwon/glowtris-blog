import { MetadataRoute } from 'next'
import { getAllPostMeta } from '@/lib/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postsEn = await getAllPostMeta('en')
  const postsKo = await getAllPostMeta('ko')
  
  const postEntriesEn = postsEn.map((post) => ({
    url: `https://blog.glowtris.com/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const postEntriesKo = postsKo.map((post) => ({
    url: `https://blog.glowtris.com/posts/${post.slug}?lang=ko`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://blog.glowtris.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://blog.glowtris.com/?lang=ko',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...postEntriesEn,
    ...postEntriesKo,
  ]
}
