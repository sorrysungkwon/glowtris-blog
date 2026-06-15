# AGENTS.md — Glowtris Blog Collaboration Rules

## CAVEMAN MODE (HIGHEST PRIORITY — APPLY BEFORE ANYTHING ELSE)

Read `/home/ubuntu/.claude/projects/-home-ubuntu/memory/feedback-caveman-mode.md` on session start.

Key rules:
- All responses: drop articles/filler/pleasantries/hedging. Fragments OK.
- Simple confirmations: "ㅇ" or "ㅇㅋ" only.
- Extreme compression. Efficiency first.
- Code/commits/security: write normal.

---

## 🔐 CREDENTIALS SECURITY (CRITICAL - READ FIRST)

**NEVER put credentials in GitHub:**
- ❌ NO passwords, tokens, API keys in any tracked file (README, robot.md, AGENTS.md, CLAUDE.md, TODO.md)
- ✅ CREDENTIALS.md ONLY (git-ignored, server-only)
- ✅ USE PLACEHOLDERS: `<ADMIN_PASSWORD>`, `<MOSHI_TOKEN>` → "see CREDENTIALS.md"
- ✅ PRE-COMMIT CHECK: search for `password=`, `token=`, `secret=` before staging

If you see plaintext credentials:
1. Remove immediately
2. Replace with: `<CREDENTIAL_NAME>`
3. Commit: "security: remove plaintext credentials"

---

## For Other AI Agents (Antigravity, etc.)

This document establishes shared rules for any agents working on glowtris-blog alongside Claude.

## Shared Constraints

### Documentation Language
- **English only** for all project documentation
- No Korean in docs, TODOs, or comments
- This includes CLAUDE.md, AGENTS.md, TODO.md, code comments

### Deployment Protocol
- Push directly to main branch
- No PR workflow
- No protection rules enforced
- Vercel auto-deploys immediately on push

### Task Completion Signal
All agents must send Moshi notification on task completion:
```bash
curl -X POST https://api.getmoshi.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"token": "<MOSHI_WEBHOOK_TOKEN>", "title": "Done", "message": "Task description", "unified": true}'
```

### Code Changes
- File edits must preserve existing patterns
- Markdown rendering must match edited language (EN editing → EN preview, KO editing → KO preview)
- Admin editor constrained to 1280px max-width
- All API changes must maintain backward compatibility

## Session Start Protocol
On EVERY session start, read in order:
0. **feedback-caveman-mode.md** — `/home/ubuntu/.claude/projects/-home-ubuntu/memory/feedback-caveman-mode.md` (FIRST)
1. **robot.md** — universal rules for all agents
2. **AGENTS.md** (this file - agent collaboration rules)
3. **TODO.md** (next tasks)
4. Run: `git log --oneline -5` (recent work)
5. Run: `git status` (uncommitted changes)

Then report to user: current state, recent changes, next task

See robot.md for complete rules and universal constraints.

## Contact Protocol
If sync issues occur between Claude and other agents:
1. Check TODO.md for current tasks
2. Check git log for recent commits
3. Verify no conflicting uncommitted changes
4. Report discrepancies in commit message

## Emergency Rules
- Never force-push to main
- Never delete branches without confirmation
- Never modify environment variables without explicit request
- Git operations logged for audit trail

---
**Last Updated**: 2026-06-06  
**Maintained By**: Claude  
**Sync with**: CLAUDE.md for Claude-specific rules
