import type { PostMeta } from './posts'

export interface SearchResult extends PostMeta {
  matchType: 'title' | 'description' | 'category' | 'author'
  matchText: string
}

/**
 * Search posts by title, description, category, or author
 * Case-insensitive, returns matches with context
 */
export function searchPosts(posts: PostMeta[], query: string): SearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const post of posts) {
    // Title match (highest priority)
    if (post.title.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'title',
          matchText: post.title,
        })
        seen.add(post.slug)
      }
      continue
    }

    // Description match
    if (post.description.toLowerCase().includes(q)) {
      if (!seen.has(post.slug)) {
        results.push({
          ...post,
          matchType: 'description',
          matchText: post.description,
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
