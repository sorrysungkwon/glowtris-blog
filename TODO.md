# Glowtris Blog TODO

## 🔲 Next
- [ ] Sync editor preview language: show EN preview when editing EN, KO preview when editing KO
  - File: `/app/admin/[slug]/page.tsx` line 203
  - Change: `lang === 'en' ? data.content_ko : data.content_en` → `lang === 'en' ? data.content_en : data.content_ko`

## ✅ Completed
- [x] Markdown rendering in read-only preview (2026-06-06)
- [x] Editor max-width constraint 1280px (2026-06-06)
- [x] Glowtris workflow applied (direct push + Moshi)
