# Glowtris Blog TODO

## Current Phase: Image System Complete ✅ — Next: Bilingual Image Modal

---

### 🔲 Immediate Next (Session 2026-06-12 — WIP)

#### 1. Bilingual Image Modal (ImageUploadModal + MarkdownToolbar + admin editor)
- [ ] `ImageUploadModal.tsx`: rename `alt`→`altEn`, `caption`→`captionEn`, add `altKo`+`captionKo`, `credit` shared
  - Props: `onInsert(url, en: {alt, caption}, ko: {alt, caption}, credit)`
  - UI: EN section (cyan accent) + KO section (amber accent) + shared credit field
- [ ] `MarkdownToolbar.tsx`: add `onImageInsert?` optional prop
  - If provided → pass all EN/KO fields up to parent; if not → insert EN-only snippet (backwards compat)
- [ ] `admin/[slug]/page.tsx`: add `onImageInsert` handler
  - Active language: insert snippet at cursor position
  - Inactive language: append snippet to end of that content
  - `buildSnippet(url, alt, caption, credit)` helper

#### 2. Image Manager Admin Tab
- [ ] `app/api/admin/images/route.ts`: GET = list `public/images/` via GitHub API; DELETE = delete a file
- [ ] `components/AdminImages.tsx`: grid of uploaded images, scan which posts reference each, delete unused
- [ ] `components/AdminClient.tsx`: add "Images" tab alongside Published / Drafts

---

### 🔲 Phase 2 — Content & Discovery

- [ ] Blog posts: write initial posts for launch (EN + KO, see post guidelines in memory)
- [ ] Search UI: wire `lib/search.ts` into a frontend search component
- [ ] Recommendation system: show related posts by category at bottom of post page
- [ ] hreflang EN/KO tags on blog (and game site)

---

## ✅ Completed (Session 2026-06-12)

- [x] **MDX className fix** (d9fab37): `class="figcredit"` → `className="figcredit"` in MarkdownToolbar
  - MDX v3 (next-mdx-remote v6) treats all HTML as JSX — `class=` is invalid, must be `className=`

---

## ✅ Completed (Session 2026-06-08)

### Image System
- [x] **Image Upload Modal**: drag-drop zone, file browser, Escape/backdrop close
- [x] **WebP Compression**: client-side canvas compression (max 1920px, 0.85 quality, falls back if larger)
- [x] **Upload Progress Bar**: XHR onprogress, phases: idle → compressing → ready → uploading
- [x] **Image Captions**: figure/figcaption with optional credit (`<span className="figcredit">`)
- [x] **GitHub Raw URL**: production uploads return `raw.githubusercontent.com` URL (accessible immediately, no rebuild)
- [x] **Material Icons Round**: all system UI emojis replaced with Google Material Icons Round

### Editor UX
- [x] **Description ellipsis**: fixed `.post-desc` flex/line-clamp conflict
- [x] **Editor scroll freeze**: `autoResize()` saves/restores scrollTop to prevent cursor-jump on typing

### Drafts Branch Architecture
- [x] **Save Draft → drafts branch only**: no Vercel deployment triggered
- [x] **Deploy → main branch**: Vercel builds only on main push
- [x] **Auto-create drafts branch**: ensureBranchExists() forks from main if missing
- [x] **GET reads drafts first**: editor loads drafts branch content, falls back to main
- [x] **Admin dashboard split**: Published tab from main, Drafts tab from drafts branch
- [x] **Delete from both branches**: deletes drafts + main so post fully disappears
- [x] **iOS Safari zoom fix**: admin/layout.tsx sets maximum-scale=1, no font-size change

---

## ✅ Completed (Session 2026-06-07)

### Admin Editor
- [x] **Draft Mode**: Tab-based Published / Drafts UI, status pill in header
- [x] **Image Upload**: GitHub upload in production, local filesystem in dev, max 5MB
- [x] **Markdown Toolbar**: H1/H2/H3, bold, italic, strikethrough, underline, quote, code, list, link, image, hr
- [x] **Image Width**: MDX images force 100% post width

### Core Features
- [x] **Error Handling**: Comprehensive validation in lib/posts.ts
- [x] **Cache Invalidation**: Multi-path ISR revalidation on post save/delete
- [x] **Token-Based Auth**: HMAC-SHA256 signed tokens, 30-day expiration, no in-memory whitelist
- [x] **Multi-Device Support**: Separate sessions iPad/phone
- [x] **Post Validation**: scripts/validate-posts.ts checks EN/KO synchronization
- [x] **Search Backend**: lib/search.ts with searchPosts, filterByCategory, getCategories, highlightMatch
