# CLAUDE.md — Glowtris Blog Rules

## Project Overview
Lightweight blog platform for glowtris.com with bilingual EN/KO support, admin editor, and automatic Git deployment.

## Workflow Rules

### 1. Documentation Language
- **All project documentation must be in English**
- Korean text only when unavoidable, with English comment explaining it
- Examples: TODO.md, CLAUDE.md, AGENTS.md, commit messages, code comments

### 2. Deployment Strategy
- **Direct push to main** — No PR requirement
- No pre-commit hooks, no branch protection
- Vercel auto-deploys on push
- Lightweight and fast

### 3. Task Completion Notification
- Send Moshi webhook notification when major tasks complete
- Use curl command (do NOT use PushNotification tool):
```bash
curl -X POST https://api.getmoshi.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"token": "<MOSHI_WEBHOOK_TOKEN>", "title": "Done", "message": "Brief task summary"}'
```

### 4. Admin Authentication
- Password protected via `ADMIN_PASSWORD` environment variable
- Admin editor: `/admin` path
- Simultaneous EN/KO editing with single save/deploy
- Do NOT commit password to docs or code

## File Structure
```
glowtris-blog/
├── posts/              # English posts (MDX)
├── posts/ko/           # Korean posts (MDX)
├── app/
│   ├── admin/[slug]/   # Editor UI (edit both EN/KO)
│   ├── posts/[slug]/   # Post page (language toggle via ?lang=ko)
│   └── api/admin/      # Auth + save endpoints
├── components/         # AdminClient, PostCard, etc.
├── lib/posts.ts        # Server-only post loading
├── TODO.md             # Task tracking (English)
└── CLAUDE.md           # This file
```

## Key Features
- **Bilingual**: EN + KO with language toggle
- **Admin editor**: Full markdown editing with split-pane preview
- **Auto-render**: Markdown preview on right pane (same language as editing)
- **Max-width**: Editor constrained to 1280px
- **Auto-deploy**: Git push triggers Vercel

## Important Constraints
- Read-only preview must match edited language (not opposite)
- All commits must push directly to main
- No documentation in Korean unless unavoidable
- Use Moshi webhook, never PushNotification tool

## Session Start Protocol
On session start, read in order:
1. **robot.md** (FIRST - universal rules for all agents)
2. **CLAUDE.md** (this file - Claude-specific context)
3. **TODO.md** (next tasks and current work)
4. Run: `git log --oneline -5` (recent changes)
5. Check: `git status` (uncommitted work)

Then report to user: current branch, what changed, next task from TODO.md

See robot.md for complete sync protocol and universal rules.
