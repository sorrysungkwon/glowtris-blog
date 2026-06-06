# Glowtris Blog TODO

## 🔲 Next
- [ ] Editor preview 언어 동기화: EN 편집 시 EN 프리뷰, KO 편집 시 KO 프리뷰로 변경
  - File: `/app/admin/[slug]/page.tsx` line 203
  - Change: `lang === 'en' ? data.content_ko : data.content_en` → `lang === 'en' ? data.content_en : data.content_ko`

## ✅ Completed
- [x] Markdown rendering in read-only preview (2026-06-06)
- [x] Editor max-width constraint 1280px (2026-06-06)
- [x] Glowtris workflow applied (direct push + Moshi)
