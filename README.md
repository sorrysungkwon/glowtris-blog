# Glowtris Blog

Modern tech blog platform for glowtris.com with bilingual (EN/KO) support and web-based admin editor.

## Features

- 🌍 **Bilingual**: English and Korean posts with language toggle
- ✏️ **Web Editor**: Live markdown editing with split-pane preview, draft history
- 🎨 **Modern Design**: Tech blog aesthetic, light/dark mode toggle
- 🚀 **Auto-Deploy**: Git-based workflow, instant Vercel deployment
- 🔐 **Admin Auth**: Token-based authentication (30-day expiration, multi-device support)
- 🔍 **Search & Validation**: searchPosts utility, automatic EN/KO sync validation
- 📱 **Multi-Device**: Separate sessions on iPad/phone, automatic logout on token invalidation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Content**: MDX with marked markdown rendering
- **Styling**: CSS custom properties (light/dark theme)
- **Deployment**: Vercel with Git auto-deploy
- **Admin**: React client component with token-based auth
- **Search**: searchPosts utility with case-insensitive matching
- **Validation**: scripts/validate-posts.ts for EN/KO sync checks

## Access

### Admin Editor
1. Navigate to `/admin`
2. Enter password (set via `ADMIN_PASSWORD` environment variable)
3. Receive HMAC-SHA256 signed token (30-day expiration)
4. Select post to edit, toggle EN/KO language
5. Edit markdown with live preview
6. Click "Save & Deploy" to publish both versions

### Authentication
- **Token-Based**: Each login generates a cryptographically signed token
- **Multi-Device**: Separate tokens for iPad, phone, browser — all work simultaneously
- **Automatic Logout**: Token invalidation on logout, prevents token reuse
- **Expiration**: 30-day sliding window (can adjust based on usage patterns)
- **Security**: HMAC-SHA256 signature validation, no localStorage-only storage

### Deployment
- All changes push directly to main branch
- Vercel auto-deploys immediately
- No local development environment required
- ISR cache invalidation on post save (multiple paths revalidated)

## Project Structure

```
app/
├── admin/page.tsx               # Admin dashboard
├── admin/[slug]/page.tsx        # Post editor UI
├── posts/[slug]/page.tsx        # Post read page
└── api/admin/
    ├── auth/route.ts            # Token generation endpoint
    ├── logout/route.ts          # Token invalidation endpoint
    └── posts/[slug]/route.ts    # Save/delete endpoints

components/
├── AdminClient.tsx              # Editor dashboard & auth UI
├── PostCard.tsx                 # Post preview card
└── ...

posts/                           # English posts (MDX)
posts/ko/                        # Korean posts (MDX)

lib/
├── posts.ts                     # Server-only post loading with error handling
├── auth.ts                      # Token validation utilities
├── search.ts                    # Post search & filtering
└── utils.ts                     # Utility functions

scripts/
└── validate-posts.ts            # EN/KO sync validation tool
```

## Post Format

Posts are MDX files with YAML frontmatter:

```mdx
---
title: My Post
title_ko: 나의 포스트
description: Brief description
description_ko: 간단한 설명
date: 2026-06-06
category: DEV
author: sorrysungkwon
authorEmoji: 👨‍💻
readingTime: 5
coverGradient: linear-gradient(...)
coverEmoji: 🎨
featured: false
---

# Content here in markdown

This will be rendered as MDX.
```

## Deployment

- Push to main branch triggers Vercel auto-deployment
- No PR workflow required
- Editor auto-commits with message: `edit: update {slug} (EN/KO) via admin editor`

## Documentation

Session start order (ALWAYS):
1. **robot.md** — Universal rules for all agents (READ FIRST)
2. **CLAUDE.md** — Claude-specific context
3. **AGENTS.md** — Other agents' collaboration rules  
4. **TODO.md** — Task tracking and next items

See robot.md for complete workflow and universal rules.
