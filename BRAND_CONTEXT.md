# BottomUP — Brand Context for AI Agents

> **How to use this file:**
> Paste the relevant sections into any AI agent's context window before asking it to generate UI, copy, images, or code. The agent will then understand and correctly apply the BottomUP brand without further explanation.
>
> Machine-readable token file: `/brand/tokens.json`
> Logo as React code: `/brand/Logo.tsx`

---

## 1. Brand Identity

**Name:** BottomUP
**Website:** bottomup.app
**Social:** @bottomupsocial
**Slogan:** *"Rise together."*
**Slogan rule:** The word **together.** is always rendered in Violet (`#7B5CF5`). The period is part of the slogan. Never alter or split it.

**What BottomUP does:** A trading performance platform that tracks and ranks traders by net return. Community-focused, data-driven, transparent.

**Brand voice:** Direct, confident, data-driven, community-focused. English only in all UI.

---

## 2. Color System (v1.1)

| Token | Hex | Role |
|---|---|---|
| **Violet** | `#7B5CF5` | Primary brand, CTA, slogan accent |
| **Cobalt** | `#3B5BF5` | AI / Intelligence layer, gradient pairs |
| **Ember** | `#F97316` | Momentum, LIVE badge, yesterday label |
| **Jade** | `#2DC771` | Positive returns, wins, profit |
| **Danger** | `#EF4444` | Negative returns, losses, errors |
| **Gold** | `#F5C842` | #1 rank accent only |
| **Background** | `#0B0C14` | Base dark background |

**Surface layers (on top of #0B0C14):**
```
Surface:       rgba(255,255,255,0.04)
Surface hover: rgba(255,255,255,0.07)
Border:        rgba(255,255,255,0.08)
Border strong: rgba(255,255,255,0.14)
Text muted:    rgba(255,255,255,0.40)
Text faint:    rgba(255,255,255,0.25)
```

**Key gradients:**
```
Brand accent bar: linear-gradient(90deg, #3B5BF5, #7B5CF5 50%, #F97316)
Avatar default:   linear-gradient(135deg, #3B5BF5, #7B5CF5)
Hero card bg:     linear-gradient(135deg, rgba(249,115,22,0.10), rgba(59,91,245,0.06))
BG glow left:     radial-gradient(ellipse, rgba(249,115,22,0.12), transparent 60%)
BG glow right:    radial-gradient(ellipse, rgba(123,92,245,0.10), transparent 60%)
```

---

## 3. Typography

| Role | Font | Fallback | Notes |
|---|---|---|---|
| Display / Hero | **Noe Display** | Georgia, serif | Large headlines, brand statements |
| UI / Body | **Satoshi** | DM Sans, Inter | All interface text |
| Numbers / Data | **Space Mono** | monospace | ALL numeric values — non-negotiable |
| Editorial | **Charter** | Georgia, serif | Long-form, blog content |
| Alternate | **Marat Sans** | DM Sans | Campaign-specific |

**Critical rule:** Any percentage, price, count, ratio, or numeric value must be in **Space Mono Bold**. This creates visual distinction between data and copy.

**Label style:** `UPPERCASE · letter-spacing: 0.10–0.16em · font-size: 9–12px · opacity 40–55%`

**In server-side / image rendering contexts** (Satori, OG images, email):
- Use **DM Sans** as Satoshi substitute
- Use **Space Mono** (available on Google Fonts)
- Load via: `fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Space+Mono:wght@700`

---

## 4. Logo

### When image files are available
Three wordmark variants: **color** (default), **dark** (light bg), **white** (colored/photo bg)
Icon mark: square with ~22% border-radius, Cobalt→Violet gradient background, white B-mark

### When image files are NOT available (code-only contexts)

**React component** (`/brand/Logo.tsx`):
```tsx
import { LogoFull, Logo, LogoMark } from '../brand/Logo'

<LogoFull variant="color" size="md" />   // mark + wordmark
<Logo variant="white" size="lg" />       // text wordmark only
<LogoMark size={32} />                   // icon mark only
```

**Inline Satori/image pattern** (no file imports):
```js
// Icon mark
h('div', { style: { width: 28, height: 28, borderRadius: 6,
  background: 'linear-gradient(135deg, #3B5BF5, #7B5CF5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center' }},
  h('span', { style: { fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' }}, 'B')
)

// Wordmark
h('span', { style: { fontSize: 16, fontWeight: 700, fontFamily: 'DM Sans', letterSpacing: '-0.02em' }},
  h('span', { style: { color: '#7B5CF5' }}, 'Bottom'),
  h('span', { style: { color: '#ffffff' }}, 'UP')
)
```

---

## 5. Component Patterns

### Accent Bar
Always present at the top of any full-width template, social card, or section header:
```css
height: 3-4px;
background: linear-gradient(90deg, #3B5BF5, #7B5CF5 50%, #F97316);
```

### Badge (LIVE / YESTERDAY)
```
background: rgba(249,115,22,0.10)
border:     1px solid rgba(249,115,22,0.28)
dot:        5px circle, #F97316
text:       #F97316, 10px, 700, UPPERCASE, letter-spacing: 0.12em
border-radius: 9999px
padding: 3-4px 10-12px
```

### Card
```
Default:  bg rgba(255,255,255,0.04) · border rgba(255,255,255,0.08) · radius 16px
Hero #1:  bg linear-gradient(135deg, rgba(249,115,22,0.10), rgba(59,91,245,0.06))
          border 1px solid rgba(249,115,22,0.22) · radius 24px
          top accent: 2px bar with Gold→Ember gradient
```

### Avatar (no image)
```
Shape:   circle
BG:      linear-gradient(135deg, #3B5BF5, #7B5CF5)
Border:  2px solid {medal-color}55 (or rgba(255,255,255,0.08))
Content: 2-letter initials, white, bold
```

### Rank medals
```
#1 → 🥇 → #F5C842 (Gold)
#2 → 🥈 → #C0C0C0 (Silver)
#3 → 🥉 → #CD7F32 (Bronze)
#4+ → #4, #5... → rgba(255,255,255,0.35)
```

---

## 6. Data Display Rules

```
Positive return:  color #2DC771 (Jade),  prefix "+"
Negative return:  color #EF4444 (Danger), prefix "−" (unicode minus, not hyphen)
Format:           ±XX.XX%  (always 2 decimal places)
Font:             Space Mono Bold, always

Win rate:         color #2DC771, format "XX.X%"
W/L:              color rgba(255,255,255,0.65), format "W/L"
Trade count:      color rgba(255,255,255,0.65)
```

---

## 7. API Reference

```
Base URL: https://bottomup-trader-api-production.up.railway.app

Endpoints:
  GET /leaderboard
  GET /traders/top?period={period}&limit={limit}&sort=net_r

Periods: today | yesterday | week | month

Response fields:
  analysts      → trader display name
  avatar        → avatar URL (may be null)
  success       → winning trades count
  stopped       → losing trades count
  total_trades  → total trades
  winrate       → win rate 0–100
  r             → R-multiple
  net_r         → net return % (primary metric, use for sorting)
```

---

## 8. Social Media Templates

### Layout decision logic (leaderboard)
```
0 positive traders             → empty state (no post)
1 positive trader              → SOLO layout (full hero)
2 positive traders             → DUO layout (side by side)
3+ traders with net_r > 1%    → LIST layout (table, up to 5)
```

### Dimensions
```
Twitter/X post:     1200 × 675px   (16:9)
Instagram Story:    1080 × 1920px  (9:16)
Instagram Post:     1080 × 1080px  (1:1)
```

### Template anatomy (LIST layout)
```
[3px accent bar — Cobalt→Violet→Ember]
LEFT COLUMN (brand):
  Logo mark + wordmark
  Badge: "YESTERDAY'S LEADERS" (Ember)
  "Daily Top" (white) + "Performers" (Ember) — large
  Date label (muted, uppercase)
  #1 stat mini-card (net return)
  Footer: bottomup.app · @bottomupsocial

RIGHT COLUMN (data table):
  Header row: Trader / Net Return / Win Rate / W/L
  Rows: medal · avatar · name · +XX.XX% · XX.X% · W/L
  Row #1: highlighted with Ember-tinted bg
  Footer right: "Rise together." (italic, together. in Violet)
```

---

## 9. Automation Pipeline

**File:** `/scripts/post-leaderboard.mjs`
**Scheduler:** `.github/workflows/daily-leaderboard.yml` (Mon–Fri 10:00 TR)

```
GitHub Actions cron
  → fetch /traders/top?period=yesterday
  → resolveLayout() → empty | solo | duo | list
  → Satori render → Twitter PNG (1200×675)
  → Satori render → Story PNG (1080×1920)
  → twitter-api-v2 → tweet with image
  → ImgBB upload → Meta Graph API → Instagram Story
```

**Required secrets:** `TWITTER_API_KEY` · `TWITTER_API_SECRET` · `TWITTER_ACCESS_TOKEN` · `TWITTER_ACCESS_SECRET` · `INSTAGRAM_USER_ID` · `INSTAGRAM_ACCESS_TOKEN` · `IMGBB_API_KEY`

---

## 10. Quick Reference for Agents

When asked to build any BottomUP UI, check these first:

- [ ] Background is `#0B0C14` (not pure black, not gray)
- [ ] Numbers use **Space Mono Bold** (never sans-serif)
- [ ] Positive = Jade `#2DC771`, Negative = Danger `#EF4444`
- [ ] Primary accent = Violet `#7B5CF5`, not purple, not blue
- [ ] Ember `#F97316` for LIVE/badges/momentum only
- [ ] Accent bar (Cobalt→Violet→Ember gradient) at top of cards/templates
- [ ] "Rise together." → *together.* always in Violet
- [ ] Logo without file: use gradient square + "BottomUP" text pattern
- [ ] All UI text in English
- [ ] handle: @bottomupsocial · site: bottomup.app
