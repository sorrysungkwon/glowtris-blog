import AdminClient from '@/components/AdminClient'
import { getAllPostMeta } from '@/lib/posts'

export default async function AdminDashboard() {
  const posts = await getAllPostMeta()

  return <AdminClient posts={posts} />
}
