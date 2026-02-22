# BottomUP Brand Kit

Visual identity and design system assets for [BottomUP](https://bottomup.app) — a trading performance platform that tracks and ranks traders by net return.

---

## Files

| File | Description |
|---|---|
| `BRAND_CONTEXT.md` | Full brand context for AI agents. Paste into any LLM before generating UI or copy. |
| `Guidelines.md` | Visual identity rules — colors, typography, logo, components. |
| `tokens.json` | Machine-readable design tokens (colors, gradients, spacing, typography). |
| `Logo.tsx` | React logo component — `LogoFull`, `Logo`, `LogoMark` variants. |

---

## Quick Start

### Using the logo in React

```tsx
import { LogoFull, Logo, LogoMark } from './Logo'

<LogoFull variant="color" size="md" />  // mark + wordmark
<Logo variant="white" size="lg" />      // wordmark only
<LogoMark size={32} />                  // icon mark only
Core colors
const brand = {
  violet:  '#7B5CF5',  // primary
  cobalt:  '#3B5BF5',  // AI / intelligence
  ember:   '#F97316',  // LIVE / momentum
  jade:    '#2DC771',  // positive / profit
  danger:  '#EF4444',  // negative / loss
  gold:    '#F5C842',  // #1 rank only
  bg:      '#0B0C14',  // base background
}
Slogan rule
"Rise together."

The word together. (including the period) is always rendered in Violet #7B5CF5. Never alter or split it.

Using with AI agents
Paste BRAND_CONTEXT.md into the context window of any AI agent before asking it to generate UI, copy, or code. The agent will correctly apply colors, typography, component patterns, and tone without further explanation.

Contact
Site: bottomup.app
Social: @bottomupsocial

