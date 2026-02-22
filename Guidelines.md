# BottomUP — Brand Guidelines

> Single source of truth for the BottomUP visual identity.
> For machine-readable tokens: `/brand/tokens.json`
> For logo as React component: `/brand/Logo.tsx`

---

## 1. Brand Identity

**Name:** BottomUP
**Website:** bottomup.app
**Social:** @bottomupsocial
**Slogan:** *"Rise together."*

**Slogan rule:** The word **together.** is always rendered in Violet (`#7B5CF5`). The period is part of the slogan. Never alter, split, or translate it.

**What BottomUP does:** A trading performance platform that tracks and ranks traders by net return. Community-focused, data-driven, transparent.

**Brand voice:** Direct · Confident · Data-driven · Community-focused
**Language:** English only in all UI and communications.

---

## 2. Color System v1.1

### Primary

| Token | Hex | Role |
|---|---|---|
| **Violet** | `#7B5CF5` | Primary brand color. CTA buttons, active states, slogan emphasis, key UI accents. |
| **Cobalt** | `#3B5BF5` | AI / Intelligence layer. Gradients paired with Violet, data indicators. |

### Accent

| Token | Hex | Role |
|---|---|---|
| **Ember** | `#F97316` | Momentum / LIVE badge. Animated indicators, yesterday labels, hero accents. |
| **Jade** | `#2DC771` | Positive / profit. All positive net returns, win rates, success states. |
| **Danger** | `#EF4444` | Negative / loss / alert. All negative returns, errors, stop-outs. |
| **Gold** | `#F5C842` | #1 rank accent only. Medal color for first place. |

### Background & Surface

| Token | Value | Usage |
|---|---|---|
| **Base** | `#0B0C14` | Page background — not pure black, not gray |
| **Surface** | `rgba(255,255,255,0.04)` | Card / panel default |
| **Surface Hover** | `rgba(255,255,255,0.07)` | Interactive surface hover |
| **Border** | `rgba(255,255,255,0.08)` | Default border |
| **Border Strong** | `rgba(255,255,255,0.14)` | Emphasized border |
| **Text Muted** | `rgba(255,255,255,0.40)` | Labels, secondary text |
| **Text Faint** | `rgba(255,255,255,0.25)` | Placeholder, disabled-adjacent |

### Gradients

```
Brand accent bar:  linear-gradient(90deg, #3B5BF5, #7B5CF5 50%, #F97316)
Avatar default:    linear-gradient(135deg, #3B5BF5, #7B5CF5)
Hero card bg:      linear-gradient(135deg, rgba(249,115,22,0.10), rgba(59,91,245,0.06))
BG ambient left:   radial-gradient(ellipse, rgba(249,115,22,0.12), transparent 60%)
BG ambient right:  radial-gradient(ellipse, rgba(123,92,245,0.10), transparent 60%)
```

---

## 3. Typography

### Font Families

| Role | Font | Fallback | Usage |
|---|---|---|---|
| **Display / Hero** | Noe Display | Georgia, serif | Large headlines, brand statements, editorial moments |
| **UI / Body** | Satoshi | DM Sans, Inter, sans-serif | All interface text, labels, body copy, navigation |
| **Numbers / Data** | Space Mono | monospace | ALL numeric values — non-negotiable |
| **Editorial** | Charter | Georgia, serif | Long-form content, blog posts |
| **Alternate** | Marat Sans | DM Sans, sans-serif | Campaign-specific contexts |

### Rules

- **Any percentage, price, count, ratio, or numeric value must be in Space Mono Bold.** This is not optional — it creates visual distinction between data and copy.
- Labels: `UPPERCASE · letter-spacing: 0.10–0.16em · font-size: 9–12px · opacity 40–55%`
- Never use Satoshi or any sans-serif for numerical data.

### Server-side / Image Rendering (Satori, OG, Email)

When custom fonts cannot be loaded:
- Use **DM Sans** as Satoshi substitute
- Use **Space Mono** (available on Google Fonts)
- Load via: `fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Space+Mono:wght@700`

---

## 4. Logo

### Variants

| Variant | Usage |
|---|---|
| **Color** (default) | Dark backgrounds — `Bottom` in Violet, `UP` in white |
| **White** | Colored or photographic backgrounds — all white |
| **Dark** | Light / white backgrounds — `Bottom` in `#0B0C14`, `UP` in Cobalt |

### Icon Mark

- Shape: square with rounded corners (~22% border-radius of size)
- Background: `linear-gradient(135deg, #3B5BF5, #7B5CF5)`
- Content: stylized white B-mark / up-arrow motif
- Minimum size: 24px

### React Component Usage

```tsx
import { LogoFull, Logo, LogoMark } from '../brand/Logo'

<LogoFull variant="color" size="md" />   // mark + wordmark (default)
<Logo variant="white" size="lg" />       // wordmark only
<LogoMark size={32} />                   // icon mark only
```

Available sizes: `sm` · `md` · `lg` · `xl`

### Code-only Pattern (no file imports)

```js
// Icon mark
h('div', { style: {
  width: 28, height: 28, borderRadius: 6,
  background: 'linear-gradient(135deg, #3B5BF5, #7B5CF5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}},
  h('span', { style: { fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' }}, 'B')
)

// Wordmark
h('span', { style: { fontSize: 16, fontWeight: 700, fontFamily: 'DM Sans', letterSpacing: '-0.02em' }},
  h('span', { style: { color: '#7B5CF5' }}, 'Bottom'),
  h('span', { style: { color: '#ffffff' }}, 'UP')
)
```

### Logo Don'ts

- Do not recolor the logo outside of the three approved variants
- Do not stretch, skew, or rotate the logo
- Do not place the color variant on light backgrounds
- Do not alter the `BottomUP` word spacing or letter casing
- Do not use the wordmark below 14px font size
- Do not use the icon mark below 24px

---

## 5. Component Patterns

### Accent Bar

Always present at the top of any full-width card, template, or section header.

```css
height: 3px–4px;
background: linear-gradient(90deg, #3B5BF5, #7B5CF5 50%, #F97316);
border-radius: top corners only when inside a card
```

### Badge

Used for LIVE indicators, status labels, time-period labels (YESTERDAY, TODAY, etc.).

```
background:    rgba(249,115,22,0.10)
border:        1px solid rgba(249,115,22,0.28)
dot:           5px circle, #F97316
text:          #F97316 · 10px · weight 700 · UPPERCASE · letter-spacing: 0.12em
border-radius: 9999px (pill)
padding:       3–4px 10–12px
```

Cobalt variant (for AI/data labels):
```
background:    rgba(59,91,245,0.10)
border:        1px solid rgba(59,91,245,0.28)
dot:           #3B5BF5
text:          #3B5BF5
```

### Card

```
Default:
  background:    rgba(255,255,255,0.04)
  border:        1px solid rgba(255,255,255,0.08)
  border-radius: 16px

Hero (#1 rank):
  background:    linear-gradient(135deg, rgba(249,115,22,0.10), rgba(59,91,245,0.06))
  border:        1px solid rgba(249,115,22,0.22)
  border-radius: 24px
  top accent:    2px bar — linear-gradient(90deg, #F5C842, #F97316, #F5C842)
```

### Avatar (no image)

```
Shape:      circle
Background: linear-gradient(135deg, #3B5BF5, #7B5CF5)
Border:     2px solid {medal-color}55  or  rgba(255,255,255,0.08)
Content:    2-letter initials · white · bold · Space Mono or DM Sans
```

### Rank Medals

```
#1  →  🥇  →  #F5C842  (Gold)
#2  →  🥈  →  #C0C0C0  (Silver)
#3  →  🥉  →  #CD7F32  (Bronze)
#4+ →  #N  →  rgba(255,255,255,0.35)
```

---

## 6. Data Display Rules

All numerical data follows strict formatting. No exceptions.

```
Positive return:  color #2DC771 (Jade)   · prefix "+"
Negative return:  color #EF4444 (Danger) · prefix "−" (unicode minus U+2212, not hyphen)
Format:           ±XX.XX%  (always 2 decimal places)
Font:             Space Mono Bold — always

Win rate:         color #2DC771 · format "XX.X%"
W/L ratio:        color rgba(255,255,255,0.65) · format "W/L"
Trade count:      color rgba(255,255,255,0.65)
```

---

## 7. Quick Reference Checklist

When building any BottomUP UI, verify:

- [ ] Background is `#0B0C14` — not pure black, not gray
- [ ] All numbers in **Space Mono Bold** — never sans-serif
- [ ] Positive = Jade `#2DC771` · Negative = Danger `#EF4444`
- [ ] Primary accent = Violet `#7B5CF5`
- [ ] Ember `#F97316` for LIVE / badges / momentum only
- [ ] Accent bar (Cobalt→Violet→Ember) at top of cards and templates
- [ ] "Rise together." → *together.* always in Violet, period included
- [ ] Logo without files: gradient square + "BottomUP" text pattern
- [ ] All UI text in English
- [ ] Site: `bottomup.app` · Handle: `@bottomupsocial`
