# Glowtris Blog TODO

## Current Phase: Phase 4 — SEO & Growth Hacking 🚀

---

### 🚀 Phase 4 — SEO & Growth Hacking (Fusion Panel Plan)
- [x] **1. Clean up Hreflang (Game):** Remove the invalid `hreflang="ko"` tag from `index.html` in the game codebase since it causes duplicate content penalties.
- [x] **2. Dwell Time Exploit (Game Embed):**
  - *General Pattern:* Upgrade `<GlowtrisCTA />` at the end of every post to embed the actual playable game `<iframe>` to capture users who finish reading.
  - *Special Pattern:* Create a `<GameEmbed />` MDX component to insert into the *middle* of highly relevant posts (e.g., UI devlogs) to catch early drop-offs and artificially inflate Dwell Time to 10+ minutes.
- [x] **3. Advanced Schema (Blog):** Inject `FAQPage` JSON-LD schema and a 50-word TL;DR (Featured Snippet bait) block at the top of tutorial/devlog posts.
- [x] **4. Programmatic SEO (Game):** Create 4 separate landing pages (e.g., `/sprint.html`, `/play/unblocked`) pointing to the same game engine but optimized for high-volume, low-competition keywords.
- [ ] **5. High-DA Backlinks:** Submit the game to aggregators (~~itch.io~~ (Done), CrazyGames, Poki) and open-source a small technical module on GitHub for powerful backlink juice.

---

### ✅ Phase 3 Completed (Session 2026-06-20)
- [x] Create dynamic `sitemap.xml` with bilingual `alternates`/`hreflang` routes for SEO.
- [x] Create automated `rss.xml` feed endpoint pulling all blog posts.
- [x] Implement dynamic OpenGraph thumbnail generation (`/og`) via `@vercel/og` matching the blog's design system.
- [x] Map OpenGraph thumbnails to all blog posts globally.
- [x] Build `<ShareButton>` component using native Web Share API (with clipboard fallback) and insert it perfectly into the post metadata row.

---

### ✅ Completed (Session 2026-06-19)

#### 1. Giscus Comments Integration & Polish
- [x] Integrate `@giscus/react` for GitHub discussions-based comments on posts.
- [x] Design custom Giscus themes (`giscus-dark.css`, `giscus-light.css`) using native blog CSS variables to match the design system.
- [x] Implement Twitter-style continuous vertical thread lines for comment replies with absolute positioning and center alignment.
- [x] Create a Skeleton UI loader (`SkeletonUI`) using pure CSS animations to prevent Layout Shift.
- [x] Use CSS Grid (`.giscus-grid`) to overlap Skeleton and iframe for seamless fading transitions without footer jumping.
- [x] Optimize loading trigger by bypassing GitHub's native loading spinner and waiting specifically for the `discussion` metadata payload from the iframe message.
- [x] Refine mobile typography and alignment: left-align 'powered by giscus' footer.
- [x] Restructure mobile header hierarchy with CSS Grid (`[Count] [Sort]` top row, `[Reactions]` bottom row) for flawless responsive UI.

---

### ✅ Completed (Session 2026-06-12)

#### 1. Bilingual Image Modal (ImageUploadModal + MarkdownToolbar + admin editor)
- [x] `ImageUploadModal.tsx`: rename `alt`→`altEn`, `caption`→`captionEn`, add `altKo`+`captionKo`, `credit` shared
  - Props: `onInsert(url, en: {alt, caption}, ko: {alt, caption}, credit)`
  - UI: EN section (cyan accent) + KO section (amber accent) + shared credit field
- [x] `MarkdownToolbar.tsx`: add `onImageInsert?` optional prop
  - If provided → pass all EN/KO fields up to parent; if not → insert EN-only snippet (backwards compat)
- [x] `admin/[slug]/page.tsx`: add `onImageInsert` handler
  - Active language: insert snippet at cursor position
  - Inactive language: append snippet to end of that content
  - `buildSnippet(url, alt, caption, credit)` helper

#### 2. Image Manager Admin Tab
- [x] `app/api/admin/images/route.ts`: GET = list `public/images/` via GitHub API; DELETE = delete a file
- [x] `components/AdminImageManager.tsx`: grid of uploaded images, scan which posts reference each, delete unused
- [x] `components/AdminClient.tsx`: add "Images" tab alongside Published / Drafts

#### 3. UI Polishing & Bug Fixes
- [x] Global icon vertical alignment: `.material-icons-round` vertical-align and transform adjusted.
- [x] Fix icon-text spacing: Wrapped post-author emoji and text in spans in `PostCard.tsx` and `posts/[slug]/page.tsx` so flex gap applies correctly.
- [x] Google Translate React crash fix: Added monkeypatch in `<head>` for `removeChild` and `insertBefore` to prevent client-side exception crashes.
- [x] Mobile nav-play-icon alignment: Vertically centered mobile header icon and removed translateY transform.

---

### ✅ Phase 2 Completed — Content & Discovery

- [x] **Admin Editor UI Fix**: Split `Title` and `Description` input fields into separate EN/KO versions (currently they share state and overwrite each other upon saving).
- [x] Blog posts: write initial posts for launch (EN + KO) - 5 posts launched
- [x] Search UI: wire `lib/search.ts` into a frontend search component
- [x] Recommendation system: show related posts by category at bottom of post page
- [x] hreflang EN/KO tags on blog (and game site)


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
