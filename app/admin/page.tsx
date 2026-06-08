import AdminClient from '@/components/AdminClient'
import { getAllPostMeta, PostMeta } from '@/lib/posts'

export default async function AdminDashboard() {
  const publishedPosts = await getAllPostMeta(undefined, false, 'main')

  let draftPosts: PostMeta[] = []
  try {
    const allFromDrafts = await getAllPostMeta(undefined, true, 'drafts')
    draftPosts = allFromDrafts.filter(p => p.draft)
  } catch {
    // drafts branch doesn't exist yet — no drafts
  }

  return <AdminClient publishedPosts={publishedPosts} draftPosts={draftPosts} />
}
