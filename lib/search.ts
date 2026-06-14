import type { PostMeta } from './posts'

export interface SearchResult extends PostMeta {
  matchType: 'title' | 'description' | 'category' | 'author' | 'content'
  matchText: string
}

function findContextSnippet(content: string, query: string): string {
  // Clean markdown syntax characters
  const cleanContent = content.replace(/[#*`[\]()_~]/g, '')
  const idx = cleanContent.toLowerCase().indexOf(query)
  if (idx === -1) return ''

  const start = Math.max(0, idx - 40)
  const end = Math.min(cleanContent.length, idx + query.length + 60)
  let snippet = cleanContent.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < cleanContent.length) snippet = snippet + '...'
  return snippet
}

/**
 * Search posts by title, description, category, author, or content body
 * Case-insensitive, returns matches with context
 */
export function searchPosts(posts: PostMeta[], query: string, lang?: string): SearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase()
  const results: SearchResult[] = []
  const seen = new Set<string>()
  const isKo = lang === 'ko'

  for (const post of posts) {
    const title = isKo ? (post.title_ko ?? post.title) : post.title
    const desc = isKo ? (post.description_ko ?? post.description) : post.description

    // Title match (highest priority)
    if (title.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'title',
          matchText: title,
        })
        seen.add(post.slug)
      }
      continue
    }

    // Description match
    if (desc.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'description',
          matchText: desc,
        })
        seen.add(post.slug)
      }
      continue
    }

    // Category match
    if (post.category.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'category',
          matchText: post.category,
        })
        seen.add(post.slug)
      }
      continue
    }

    // Author match
    if (post.author.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'author',
          matchText: post.author,
        })
        seen.add(post.slug)
      }
      continue
    }

    // Content body match (fallback search)
    if (post.content && post.content.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'content',
          matchText: findContextSnippet(post.content, q),
        })
        seen.add(post.slug)
      }
    }
  }

  return results
}

/**
 * Filter posts by category
 */
export function filterByCategory(posts: PostMeta[], category: string): PostMeta[] {
  if (!category) return posts
  return posts.filter(p => p.category === category)
}

/**
 * Get unique categories from posts
 */
export function getCategories(posts: PostMeta[]): string[] {
  const categories = new Set(posts.map(p => p.category))
  return Array.from(categories).sort()
}

/**
 * Highlight matching text (for UI display)
 */
export function highlightMatch(text: string, query: string): string {
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text

  return (
    text.slice(0, idx) +
    `<mark>${text.slice(idx, idx + q.length)}</mark>` +
    text.slice(idx + q.length)
  )
}
