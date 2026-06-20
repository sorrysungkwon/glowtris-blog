import type { Viewport } from 'next'

export const viewport: Viewport = {

}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Admin has its own header — the blog GNB/footer steal vertical space
          and the sticky GNB overlaps the editor toolbar on mobile. */}
      <style>{`.site-header, .site-footer { display: none; }`}</style>
      {children}
    </>
  )
}
