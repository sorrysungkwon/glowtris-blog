# Glowtris Blog TODO

## Current Phase: Engine Complete ✅

### 🔲 Next (Phase 2 — Content & Discovery)
- [ ] Blog posts: write initial posts for launch
- [ ] Search UI: integrate lib/search.ts into frontend component
- [ ] Recommendation system: show related posts based on category

## ✅ Completed (Session 2026-06-07)

### Core Features
- [x] **Error Handling** (2026-06-07): Comprehensive validation in lib/posts.ts, graceful fallback behavior
- [x] **Cache Invalidation** (2026-06-07): Multi-path ISR revalidation on post save/delete
- [x] **Token-Based Authentication** (2026-06-07): HMAC-SHA256 signed tokens, 30-day expiration
- [x] **Multi-Device Support** (2026-06-07): Separate sessions iPad/phone, automatic logout with token invalidation
- [x] **Post Validation** (2026-06-07): scripts/validate-posts.ts checks EN/KO synchronization
- [x] **Search Backend** (2026-06-07): lib/search.ts with searchPosts, filterByCategory, getCategories, highlightMatch

### Previous (Session 2026-06-06)
- [x] Blog post search bar with dynamic filters: EN/KO search utilities
- [x] Sync editor preview language: EN edit → EN preview, KO edit → KO preview
- [x] Markdown rendering in read-only preview
- [x] Editor max-width constraint 1280px
- [x] Glowtris workflow applied (direct push + Moshi notifications)

