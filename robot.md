# robots.md — Universal Rules for All Agents

**READ THIS FIRST ON EVERY SESSION START**

This document contains all rules that apply to every AI agent working on glowtris-blog (Claude, Antigravity, etc.). After reading this, read your agent-specific document (CLAUDE.md or AGENTS.md), then check TODO.md.

---

## 🔐 RULE 0: CREDENTIALS MUST NEVER BE IN GITHUB

**ABSOLUTE REQUIREMENT:**
- **All sensitive information** (passwords, API tokens, webhook tokens) MUST ONLY be stored in **CREDENTIALS.md** (git-ignored, server-only)
- **NO plaintext credentials in: README.md, robot.md, CLAUDE.md, AGENTS.md, TODO.md, or any code files**
- If you must reference a credential in docs, use **PLACEHOLDER ONLY**: `<ADMIN_PASSWORD>`, `<MOSHI_TOKEN>` with note: "see CREDENTIALS.md"
- **NEVER commit**: passwords, tokens, API keys, .env files
- **CHECK BEFORE COMMIT**: Search for `password=`, `token=`, `secret=` in all staged files

✅ **CORRECT** (in docs):
```
curl -X POST api.example.com/webhook \
  -d '{"token": "<WEBHOOK_TOKEN>"}' # see CREDENTIALS.md
```

❌ **WRONG** (never do this):
```
curl -X POST api.example.com/webhook \
  -d '{"token": "abc123xyz789"}' # EXPOSED!
```

---

## Rule 1: English Documentation Only

- **All project documentation must be in English**
- Korean text only when unavoidable (e.g., in blog post content)
- When Korean is necessary, always add English comment explaining it
- Applies to: code comments, commit messages, docs, TODO items

Examples ✅:
```
// User authentication for admin editor
async function handleLogin() { ... }

# Header title (English)
```

Examples ❌:
```
// 어드민 에디터 사용자 인증 (NO - Korean without comment)
```

---

## Rule 2: Direct Push to Main

- **No PR workflow required**
- All commits push directly to main branch
- No pre-commit hooks, no branch protection
- Vercel auto-deploys immediately on push
- Git operations are fast and lightweight

---

## Rule 3: Moshi Notifications on Task Completion

When a major task completes, send notification via Moshi webhook:
```bash
curl -X POST https://api.getmoshi.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"token": "<MOSHI_WEBHOOK_TOKEN>", "title": "Done", "message": "Brief task summary", "unified": true}'
```

- Use curl command (NOT PushNotification tool)
- Token stored in CREDENTIALS.md (server-only)
- Send on: bug fixes, features, documentation, deployment tasks
- Keep message concise (under 50 chars)

---

## Rule 4: Admin Editor Preview Language Sync

The preview pane shows the **same language** being edited:
- Editing EN → Shows EN preview
- Editing KO → Shows KO preview

✅ Already implemented: `const content = lang === 'en' ? data.content_en : data.content_ko`  
File: `app/admin/[slug]/page.tsx`

---

## Rule 5: Editor Max-Width Constraint

Editor container must not expand beyond 1280px:
- Header: centered with max-width 1280px
- Messages: centered with max-width 1280px
- Editor grid: max-width 1280px, width 100%
- Purpose: focused editing experience on wide screens

---

## Rule 6: Admin Authentication

- Configured via `ADMIN_PASSWORD` environment variable
- Admin editor path: `/admin`
- Purpose: Password-protected editor access (no database needed)
- Do NOT include password in code, docs, or commits

---

## Rule 7: Bilingual Post Structure

Posts are stored in separate directories with shared frontmatter:

```
posts/
├── {slug}.mdx              # English post
└── ko/
    └── {slug}.mdx          # Korean post (optional)
```

Both files use same frontmatter (title, date, category, etc.)  
Content differs: content_en vs content_ko  
Frontmatter shared: don't duplicate between EN/KO files

---

## Rule 8: Session Start Protocol

On EVERY session start, read in this order:

1. **robots.md** (THIS FILE) — Universal rules for all agents
2. **CLAUDE.md** (if Claude) OR **AGENTS.md** (if other agent) — Agent-specific details
3. **TODO.md** — Current tasks and next items
4. Run: `git log --oneline -5` — See recent work
5. Run: `git status` — Check uncommitted changes

Then report to user:
- Current branch + latest commit
- What changed since last session
- Next task from TODO.md

---

## Rule 9: No Destructive Operations

❌ Never without explicit user permission:
- Force-push (`--force`, `--force-with-lease`)
- Hard reset (`git reset --hard`)
- Branch deletion (`git branch -D`)
- Environment variable changes
- File deletion

✅ Safe operations (do freely):
- Editing code/docs
- Creating commits
- Pushing to main
- Running tests/builds

---

## Rule 10: Git Commit Message Format

- Start with type: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep under 50 chars first line
- Use English only
- Examples:
  - `feat: add markdown preview to admin editor`
  - `fix: sync editor preview language with edit mode`
  - `docs: update CLAUDE.md with new rules`

---

## Agent-Specific Details

After reading this file, read your role-specific document:

- **Claude**: Read `CLAUDE.md` for Claude-specific context and workflow
- **Other Agents**: Read `AGENTS.md` for collaboration rules and sync protocol
- **Both**: Then read `TODO.md` for current task list

---

## Questions or Conflicts?

If rules conflict or are unclear:
1. Check git log for recent context
2. Check TODO.md for current work
3. Report conflict in next commit message or to user

---

**Last Updated**: 2026-06-12  
**Scope**: glowtris-blog (all agents)  
**Parent Document**: Sync protocol defined in glowtris memory system
