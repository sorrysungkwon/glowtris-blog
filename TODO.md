# Glowtris Blog TODO

## Current Phase: Drafts Branch Architecture Complete ✅

### 🔲 Next (Phase 2 — Content & Discovery)
- [ ] Blog posts: write initial posts for launch
- [ ] Search UI: integrate lib/search.ts into frontend component
- [ ] Recommendation system: show related posts based on category

## ✅ Completed (Session 2026-06-08)

### Drafts Branch Architecture
- [x] **Save Draft → drafts branch only** (2026-06-08): no Vercel deployment triggered
- [x] **Deploy → main branch** (2026-06-08): Vercel builds only on main push
- [x] **Auto-create drafts branch** (2026-06-08): ensureBranchExists() forks from main if missing
- [x] **GET reads drafts first** (2026-06-08): editor loads drafts branch content, falls back to main
- [x] **Admin dashboard split** (2026-06-08): Published tab from main, Drafts tab from drafts branch
- [x] **Delete from both branches** (2026-06-08): deletes drafts + main so post fully disappears
- [x] **iOS Safari zoom fix** (2026-06-08): admin/layout.tsx sets maximum-scale=1, no font-size change

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
