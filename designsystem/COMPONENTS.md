# Glowtris Blog — Reusable UI Components (Material 3 Mapping)

This document catalogs the reusable UI component patterns in the Glowtris Blog codebase, mapping them to **Google Material Design 3 (M3)** component specs. All components reference design tokens from `app/globals.css` — never hardcode values.

---

## ✦ Material 3 Component Mapping Table

| M3 Component | Blog Implementation | File | CSS Classes | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Navigation Bar** | Site Header | `app/layout.tsx` | `.site-header` `.header-inner` | Sticky nav with logo, lang toggle, theme toggle |
| **Segmented Button** | Language Toggle | `components/LangToggle.tsx` | `.lang-toggle` `.lang-toggle button` | EN/KO switcher with active pill state |
| **Icon Button** | Theme Toggle | `components/ThemeToggle.tsx` | `.theme-toggle` | Dark/light mode icon button |
| **Cards** | Post Card | `components/PostCard.tsx` | `.post-card` `.post-body` | Blog post list card with hover lift |
| **Cards (featured)** | Featured Post Card | `components/PostCard.tsx` | `.post-card.featured` | Full-width editorial layout card |
| **Chips / Filter** | Category Filter | `app/page.tsx` | `.filter-btn` `.filter-btn.active` | Pill-shaped category filter buttons |
| **Search** | Search Input | `app/page.tsx` | `.search-input` `.search-input-wrapper` | Full-width search with clear button |
| **Buttons** | Admin Primary Button | `app/globals.css` | `.admin-btn.admin-btn-primary` | Primary action: save, deploy |
| | Admin Secondary Button | `app/globals.css` | `.admin-btn.admin-btn-secondary` | Secondary action: cancel, back |
| | Admin Danger Button | `app/globals.css` | `.admin-btn.admin-btn-danger` | Destructive: delete |
| | Admin Warning Button | `app/globals.css` | `.admin-btn.admin-btn-warning` | Caution: unpublish |
| **Text Fields** | Admin Input | `app/globals.css` | `.admin-input` | Form inputs with cyan focus ring |
| **Badges** | Draft Badge | `app/globals.css` | `.editor-draft-badge` | Pulsing amber draft indicator |
| | Admin Card Badge | `app/globals.css` | `.admin-card-badge` | Post status chip (EN/KO/DRAFT) |
| | Category Badge | `app/globals.css` | `.post-category` | Cover overlay category label |
| **Dialogs** | Delete Confirm Modal | `components/AdminClient.tsx` | `.admin-modal` `.admin-modal-backdrop` | Blur backdrop + slide-up dialog |
| | Image Upload Modal | `components/ImageUploadModal.tsx` | `.admin-modal` | Media upload dialog |
| | Draft History Modal | `components/AdminClient.tsx` | `.draft-history-list` | Restore draft dialog |
| **Snackbars** | Editor Notify Bar | `app/globals.css` | `.editor-notify.success` `.editor-notify.error` | Inline success/error feedback bar |
| **Toolbars** | Markdown Toolbar | `components/MarkdownToolbar.tsx` | `.markdown-toolbar` `.markdown-toolbar-btn` | Bold/italic/link/etc. editor controls |
| **Tabs** | Editor Lang Tabs | `app/globals.css` | `.editor-lang-toggle` `.editor-lang-btn` | EN/KO editor pane switcher |
| | Mobile Editor Tabs | `app/globals.css` | `.editor-tabs` `.editor-tab` | Write/Preview tab on mobile |
| **CTA Block** | Glowtris CTA | `components/GlowtrisCTA.tsx` | `.glowtris-cta` `.glowtris-cta-btn` | Post-bottom game promotion block |
| **Material Icon** | Icon Wrapper | `components/MI.tsx` | `.material-icons-round` | Google Material Icons normalized wrapper |

---

## 1. Site Header (M3 Navigation Bar)

Sticky header with glassmorphic blur. Contains logo, nav links, lang toggle, and theme toggle grouped by Gestalt *similarity*.

```tsx
// app/layout.tsx pattern
<header className="site-header">
  <div className="container header-inner">
    <a href="/" className="header-logo">GLOWTRIS</a>
    <nav className="header-nav">
      <a href="https://glowtris.com" className="nav-link">
        <span className="nav-play-text">Play Game</span>
      </a>
    </nav>
    <div className="header-controls">
      <LangToggle />
      <div className="header-divider" />
      <ThemeToggle />
    </div>
  </div>
</header>
```

---

## 2. Language Toggle (M3 Segmented Button)

```tsx
// components/LangToggle.tsx
<div className="lang-toggle">
  <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
  <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
</div>
```

States: default `color: --text-faint`, active `background: --surface; color: --text-primary; box-shadow: --shadow-xs`.

---

## 3. Post Card (M3 Outlined Card)

Common Fate: all elements (title, emoji, border) animate as one unit on hover.

```tsx
// components/PostCard.tsx
<article className={`post-card ${featured ? 'featured' : ''}`}>
  <div className="post-cover" style={{ background: gradient }}>
    <span className="post-cover-emoji">{emoji}</span>
    <span className="post-category">{category}</span>
  </div>
  <div className="post-body">
    <h2 className="post-title">{title}</h2>
    <p className="post-desc">{description}</p>
    <footer className="post-footer">
      <span className="post-author">{author}</span>
      <span className="post-meta-chips">{date} · {readTime}</span>
    </footer>
  </div>
</article>
```

Hover: `translateY(-5px)` + cyan border + `box-shadow: 0 12px 32px rgba(0,200,255,0.12)`.

---

## 4. Filter Buttons (M3 Chips)

```tsx
// app/page.tsx pattern
<div className="filter-section">
  <span className="filter-label">Category</span>
  {categories.map(c => (
    <button
      key={c}
      className={`filter-btn ${active === c ? 'active' : ''}`}
      onClick={() => setActive(c)}
    >
      {c}
    </button>
  ))}
</div>
```

Active: `background: --text-primary; color: --bg` (light) / `background: --cyan; color: --bg` (dark).

---

## 5. Admin Buttons (M3 Buttons)

All variants share `.admin-btn` base. Pick one variant class.

```tsx
<button className="admin-btn admin-btn-primary">Save & Deploy</button>
<button className="admin-btn admin-btn-secondary">Cancel</button>
<button className="admin-btn admin-btn-danger">Delete</button>
<button className="admin-btn admin-btn-warning">Unpublish</button>
```

Disabled state: `opacity: 0.5; cursor: not-allowed` via `disabled` attribute.

---

## 6. Admin Input (M3 Outlined Text Field)

```tsx
<label className="admin-label">Password</label>
<input
  type="password"
  className="admin-input"
  placeholder="Enter password"
/>
```

Focus: `border-color: --cyan; box-shadow: 0 0 0 3px --border-focus`.

---

## 7. Modal Dialog (M3 Dialog)

Blur backdrop + slide-up animation. Cancel before destructive action.

```tsx
{showModal && (
  <div className="admin-modal-backdrop" onClick={onClose}>
    <div className="admin-modal" onClick={e => e.stopPropagation()}>
      <h2 className="admin-modal-title">Delete Post?</h2>
      <p className="admin-modal-body">This action cannot be undone.</p>
      <div className="admin-modal-actions">
        <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
        <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
)}
```

---

## 8. Editor Notify Bar (M3 Snackbar)

```tsx
{notify && (
  <div className={`editor-notify ${notify.type}`}>
    {notify.message}
  </div>
)}
```

Types: `.success` (green bg) / `.error` (red bg). Auto-dismiss after 3s.

---

## 9. Markdown Toolbar (M3 Toolbar)

```tsx
// components/MarkdownToolbar.tsx
<div className="markdown-toolbar">
  <div className="markdown-toolbar-group">
    <button className="markdown-toolbar-btn" onClick={() => insert('**', '**')}>B</button>
    <button className="markdown-toolbar-btn" onClick={() => insert('*', '*')}>I</button>
  </div>
  <div className="markdown-toolbar-group">
    <button className="markdown-toolbar-btn" onClick={insertLink}>🔗</button>
    <button className="markdown-toolbar-btn" onClick={insertImage}>🖼</button>
  </div>
</div>
```

---

## 10. Glowtris CTA Block (M3 Card)

End-of-post game promotion. Cyan border + `color-mix` tinted background.

```tsx
// components/GlowtrisCTA.tsx
<div className="glowtris-cta">
  <div className="glowtris-cta-inner">
    <div>
      <span className="glowtris-cta-label">Play Now</span>
      <h3 className="glowtris-cta-title">GLOWTRIS</h3>
      <p className="glowtris-cta-desc">Free browser Tetris with neon vibes.</p>
    </div>
    <a href="https://glowtris.com" className="glowtris-cta-btn">Play Free →</a>
  </div>
</div>
```

---

## ✦ Interactive State Specifications (M3 Compliance)

| State | Implementation |
| :--- | :--- |
| **Hover** | `translateY(-Xpx)` lift + border-color → `--cyan` + shadow elevation up |
| **Pressed** | `translateY(0)` / `scale(0.97)` reset |
| **Focus** | `border-color: --cyan; box-shadow: 0 0 0 3px --border-focus` |
| **Disabled** | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |
| **Active (filter/tab)** | `background: --text-primary` (light) / `--cyan` (dark) + `color: --bg` |

All transitions use `--ease-out` at `--t-fast` (120ms) or `--t-mid` (200ms).

---

## 11. Premium Added Components

### 11.1 Command-K Premium Global Search Modal
#### React / HTML Markup
```html
<div class="search-modal-backdrop">
  <div class="search-modal-container">
    <div class="search-modal-header">
      <svg class="search-modal-icon">...</svg>
      <input type="text" class="search-modal-input" placeholder="Search posts..." />
      <span class="search-modal-esc">ESC</span>
    </div>
    <div class="search-modal-body">
      <!-- Active navigation items -->
      <div class="search-modal-item selected">
        <div class="search-modal-item-meta">
          <span class="search-modal-item-category">DEV</span>
        </div>
        <div class="search-modal-item-title">Title with <mark class="search-highlight-mark">match</mark></div>
      </div>
    </div>
  </div>
</div>
```

### 11.2 Copy-to-Clipboard Button
#### HTML Markup
```html
<div class="code-block-wrapper">
  <pre class="language-js"><code>...</code></pre>
  <button class="copy-code-btn" aria-label="Copy code">
    <svg class="copy-icon">...</svg>
</div>
```

### 11.3 Seamless Iframe Skeleton Overlay (Giscus Comments)
**Purpose**: Prevents layout shift (footer jump) and provides a smooth transition when loading asynchronous third-party iframes (like Giscus).
**Strategy**: Use CSS Grid to stack the skeleton and iframe on the exact same grid cell (`grid-area: overlap`).

#### HTML / CSS Pattern
```html
<div class="giscus-grid">
  <div class="skeleton-wrapper" style="opacity: 0;">
    <!-- Fake UI matching the iframe's loaded layout -->
    <div class="skeleton-header">...</div>
    <div class="skeleton-comment">...</div>
  </div>
  <iframe class="giscus-frame" style="opacity: 1;"></iframe>
</div>
```

```css
.giscus-grid {
  display: grid;
  grid-template-areas: "overlap";
}
.skeleton-wrapper, .giscus-frame {
  grid-area: overlap;
  transition: opacity 0.5s ease;
}
```
