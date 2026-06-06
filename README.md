# Glowtris Blog

Modern tech blog platform for glowtris.com with bilingual (EN/KO) support and web-based admin editor.

## Features

- 🌍 **Bilingual**: English and Korean posts with language toggle
- ✏️ **Web Editor**: Live markdown editing with split-pane preview
- 🎨 **Modern Design**: Tech blog aesthetic, light/dark mode toggle
- 🚀 **Auto-Deploy**: Git-based workflow, instant Vercel deployment
- 🔐 **Admin Auth**: Password-protected editor access

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Content**: MDX with marked markdown rendering
- **Styling**: CSS custom properties (light/dark theme)
- **Deployment**: Vercel with Git auto-deploy
- **Admin**: React client component with localStorage auth

## Quick Start

### Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Admin Editor
1. Navigate to `/admin`
2. Enter password: `<ADMIN_PASSWORD>`
3. Select post to edit
4. Toggle EN/KO language, edit markdown
5. Click "Save & Deploy" to publish

## Project Structure

```
app/
├── admin/[slug]/page.tsx       # Post editor UI
├── posts/[slug]/page.tsx        # Post read page
└── api/admin/                   # Auth & save endpoints

components/
├── AdminClient.tsx              # Editor dashboard
├── PostCard.tsx                 # Post preview card
└── ...

posts/                           # English posts (MDX)
posts/ko/                        # Korean posts (MDX)

lib/posts.ts                     # Server-only post utilities
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

- **CLAUDE.md** — Rules and guidelines for Claude agent
- **AGENTS.md** — Collaboration rules for other AI agents
- **TODO.md** — Task tracking and next items

See CLAUDE.md for complete workflow and rules.
