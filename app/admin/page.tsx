import AdminClient from '@/components/AdminClient'
import { getAllPostMeta } from '@/lib/posts'

export default function AdminDashboard() {
  const posts = getAllPostMeta()

  return <AdminClient posts={posts} />
}
