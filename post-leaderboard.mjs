/**
 * BottomUP — Daily Leaderboard Auto-Poster
 *
 * Akış:
 *  1. API'den yesterday verisini çek
 *  2. resolveLayout() ile kaç trader var, hangi layout → belirle
 *  3. Satori ile Twitter PNG (1200×675) üret
 *  4. Satori ile Instagram Story PNG (1080×1920) üret
 *  5. Twitter/X'e tweet at
 *  6. ImgBB'ye yükle → Instagram Story olarak yayınla
 *
 * GitHub Secrets:
 *   TWITTER_API_KEY · TWITTER_API_SECRET
 *   TWITTER_ACCESS_TOKEN · TWITTER_ACCESS_SECRET
 *   INSTAGRAM_USER_ID · INSTAGRAM_ACCESS_TOKEN
 *   IMGBB_API_KEY  (ücretsiz: imgbb.com)
 */

import satori      from 'satori'
import sharp       from 'sharp'
import { TwitterApi } from 'twitter-api-v2'

/* ─── Brand tokens ───────────────────────────────────────────── */
const C = {
  violet:  '#7B5CF5',
  cobalt:  '#3B5BF5',
  ember:   '#F97316',
  jade:    '#2DC771',
  danger:  '#EF4444',
  gold:    '#F5C842',
  bg:      '#0B0C14',
  surface: 'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  muted:   'rgba(255,255,255,0.40)',
  faint:   'rgba(255,255,255,0.05)',
}

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt      = (n, d = 2) => Math.abs(n).toFixed(d)
const sign     = n => n >= 0 ? '+' : '−'
const rc       = n => n >= 0 ? C.jade : C.danger
const initials = name => name.split(/[\s_-]/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)

const MEDAL     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const MEDAL_CLR = { 1: '#F5C842', 2: '#C0C0C0', 3: '#CD7F32' }

function getYesterdayLabel() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return {
    label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    sub:   d.toLocaleDateString('en-US', { weekday: 'long' }),
  }
}

function resolveLayout(traders) {
  const pos    = traders.filter(t => t.netReturn > 0).sort((a, b) => b.netReturn - a.netReturn)
  const above1 = pos.filter(t => t.netReturn > 1)
  if (pos.length === 0)   return { mode: 'empty', display: [] }
  if (above1.length >= 3) return { mode: 'list',  display: above1.slice(0, 5) }
  if (pos.length >= 2)    return { mode: 'duo',   display: pos.slice(0, 2) }
  return                         { mode: 'solo',  display: [pos[0]] }
}

/* ─── Satori element helper ──────────────────────────────────── */
// h('div', { style: {...} }, ...children)
const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children:
      children.length === 0 ? undefined
      : children.length === 1 ? children[0]
      : children.flat().filter(c => c !== null && c !== undefined && c !== false),
  },
})

/* ─── API ────────────────────────────────────────────────────── */
const API_BASE = 'https://bottomup-trader-api-production.up.railway.app'

function normalise(raw) {
  const arr = Array.isArray(raw) ? raw
    : Array.isArray(raw?.data)        ? raw.data
    : Array.isArray(raw?.traders)     ? raw.traders
    : Array.isArray(raw?.leaderboard) ? raw.leaderboard
    : Array.isArray(raw?.results)     ? raw.results : []

  return arr.map((r, i) => ({
    rank:        r.rank ?? r.position ?? i + 1,
    displayName: String(r.analysts ?? r.display_name ?? r.displayName ?? r.username ?? r.name ?? `Trader ${i + 1}`),
    netReturn:   Number(r.net_r ?? r.netReturn ?? r.net_return ?? r.roi ?? 0),
    winRate:     r.winrate != null ? Number(r.winrate) : undefined,
    trades:      r.total_trades ?? r.trades,
    success:     r.success ?? r.wins,
    stopped:     r.stopped ?? r.losses,
  }))
}

async function fetchTraders() {
  const endpoints = [
    `${API_BASE}/traders/top?period=yesterday&limit=5&sort=net_r`,
    `${API_BASE}/leaderboard?period=yesterday&limit=5&sort=net_r`,
    `${API_BASE}/traders/performance?period=yesterday&limit=5&sort=net_r`,
  ]
  for (const url of endpoints) {
    try {
      const text = await fetch(url, { headers: { Accept: 'application/json' } }).then(r => r.text())
      if (!text || text.trimStart().startsWith('<')) continue
      const rows = normalise(JSON.parse(text))
      if (rows.length > 0) { console.log(`✅ Data fetched from: ${url}`); return rows }
    } catch (e) { console.warn(`  ⚠️  ${url} failed:`, e.message) }
  }
  throw new Error('All API endpoints failed — no trader data available.')
}

/* ─── Fonts ──────────────────────────────────────────────────── */
async function loadFonts() {
  const fetchFont = async (family, weight) => {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' } }
    ).then(r => r.text())
    const url = css.match(/src: url\(([^)]+)\)/)?.[1]
    if (!url) throw new Error(`Font URL not found: ${family} ${weight}`)
    return fetch(url).then(r => r.arrayBuffer())
  }

  console.log('🔤 Loading fonts from Google Fonts...')
  const [sans400, sans700, mono700] = await Promise.all([
    fetchFont('DM Sans',    400),
    fetchFont('DM Sans',    700),
    fetchFont('Space Mono', 700),
  ])
  return [
    { name: 'DM Sans',    data: sans400, weight: 400, style: 'normal' },
    { name: 'DM Sans',    data: sans700, weight: 700, style: 'normal' },
    { name: 'Space Mono', data: mono700, weight: 700, style: 'normal' },
  ]
}

/* ─── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name, size, medalClr }) {
  return h('div', {
    style: {
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${C.cobalt}, ${C.violet})`,
      border: `2px solid ${medalClr ? medalClr + '66' : C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
  },
    h('span', { style: { fontSize: size * 0.33, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } },
      initials(name)
    )
  )
}

/* ══════════════════════════════════════════════════════════════
   TWITTER TEMPLATE  —  1200 × 675
══════════════════════════════════════════════════════════════ */

function buildTwitterTree(traders, mode) {
  const date = getYesterdayLabel()
  if (mode === 'empty') return buildTwitterEmpty(date)
  if (mode === 'solo')  return buildTwitterSolo(traders[0], date)
  if (mode === 'duo')   return buildTwitterDuo(traders, date)
  return buildTwitterList(traders, date)
}

/* ─ Twitter shared background ─ */
function TwBG() {
  return [
    h('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(59,91,245,0.16) 0%, transparent 45%, rgba(123,92,245,0.10) 100%)' } }),
    h('div', { style: { position: 'absolute', top: '-20%', left: '-5%', width: '45%', height: '140%', background: `radial-gradient(ellipse, rgba(249,115,22,0.12), transparent 60%)` } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.cobalt}, ${C.violet} 50%, ${C.ember})` } }),
  ]
}

/* ─ Twitter branding col ─ */
function TwBrandCol({ width, date, showHero, hero }) {
  return h('div', {
    style: {
      width, flexShrink: 0,
      padding: '36px 28px',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      borderRight: `1px solid ${C.border}`,
      position: 'relative', zIndex: 1,
    }
  },
    // Logo
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      h('div', { style: { width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${C.cobalt}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, 'B')
      ),
      h('span', { style: { fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans', letterSpacing: '-0.01em' } }, 'BottomUP'),
    ),

    // Badge + heading + date
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      // Badge
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 20, padding: '3px 10px', alignSelf: 'flex-start' } },
        h('div', { style: { width: 5, height: 5, borderRadius: '50%', background: C.ember } }),
        h('span', { style: { fontSize: 9, fontWeight: 700, color: C.ember, letterSpacing: '0.12em', fontFamily: 'DM Sans' } }, "YESTERDAY'S LEADERS"),
      ),
      // Heading
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { fontSize: 30, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans', lineHeight: 1.1 } }, 'Daily Top'),
        h('span', { style: { fontSize: 30, fontWeight: 700, color: C.ember, fontFamily: 'DM Sans', lineHeight: 1.1 } }, 'Performers'),
      ),
      // Date
      h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } },
        `${date.sub} · ${date.label}`
      ),
    ),

    // #1 stat card (optional)
    showHero && hero && h('div', {
      style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }
    },
      h('span', { style: { fontSize: 9, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase', display: 'block', marginBottom: 6 } }, '#1 Net Return'),
      h('span', { style: { fontSize: 26, fontWeight: 700, color: rc(hero.netReturn), fontFamily: 'Space Mono', lineHeight: 1 } },
        `${sign(hero.netReturn)}${fmt(hero.netReturn)}%`
      ),
      h('span', { style: { fontSize: 12, color: '#fff', fontWeight: 600, fontFamily: 'DM Sans', display: 'block', marginTop: 6 } },
        hero.displayName
      ),
    ),

    // Site tag
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 5 } },
      h('div', { style: { width: 4, height: 4, borderRadius: '50%', background: C.jade } }),
      h('span', { style: { fontSize: 10, color: 'rgba(255,255,255,0.32)', fontFamily: 'DM Sans' } }, 'bottomup.app · @bottomupsocial'),
    ),
  )
}

/* ─ Twitter: Empty ─ */
function buildTwitterEmpty(date) {
  return h('div', { style: { width: 1200, height: 675, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: 'DM Sans' } },
    ...TwBG(),
    h('div', { style: { position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 } },
      h('span', { style: { fontSize: 13, color: C.ember, letterSpacing: '0.12em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, "YESTERDAY'S LEADERS"),
      h('span', { style: { fontSize: 42, fontWeight: 700, color: 'rgba(255,255,255,0.22)', fontFamily: 'DM Sans' } }, 'No qualifying performers'),
      h('span', { style: { fontSize: 16, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' } }, 'All net returns are negative or below threshold'),
      h('span', { style: { fontSize: 11, color: C.muted, fontFamily: 'DM Sans' } }, `${date.sub} · ${date.label}`),
    )
  )
}

/* ─ Twitter: Solo (1 trader) ─ */
function buildTwitterSolo(t, date) {
  return h('div', { style: { width: 1200, height: 675, background: C.bg, display: 'flex', position: 'relative', fontFamily: 'DM Sans' } },
    ...TwBG(),
    TwBrandCol({ width: 380, date, showHero: false }),

    // Hero panel
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 1 } },
      h('div', { style: { position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', background: `radial-gradient(ellipse, rgba(249,115,22,0.18), transparent 60%)` } }),
      Avatar({ name: t.displayName, size: 88, medalClr: C.gold }),
      h('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 } },
        h('span', { style: { fontSize: 10, color: C.ember, letterSpacing: '0.2em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'SOLE CHAMPION'),
        h('span', { style: { fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, t.displayName),
      ),
      h('span', { style: { fontSize: 80, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono', lineHeight: 1, letterSpacing: '-0.03em' } },
        `${sign(t.netReturn)}${fmt(t.netReturn)}%`
      ),
      h('span', { style: { fontSize: 11, color: C.muted, letterSpacing: '0.18em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'NET RETURN'),
      h('div', { style: { display: 'flex', gap: 24 } },
        t.winRate  != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } },
          h('span', { style: { fontSize: 9, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'Win Rate'),
          h('span', { style: { fontSize: 16, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${fmt(t.winRate, 1)}%`),
        ),
        t.trades   != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } },
          h('span', { style: { fontSize: 9, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'Trades'),
          h('span', { style: { fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Mono' } }, String(t.trades)),
        ),
        t.success  != null && t.stopped != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } },
          h('span', { style: { fontSize: 9, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'W / L'),
          h('span', { style: { fontSize: 16, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${t.success}/${t.stopped}`),
        ),
      ),
    ),
  )
}

/* ─ Twitter: Duo (2 traders) ─ */
function buildTwitterDuo(traders, date) {
  const [a, b] = traders
  return h('div', { style: { width: 1200, height: 675, background: C.bg, display: 'flex', position: 'relative', fontFamily: 'DM Sans' } },
    ...TwBG(),
    TwBrandCol({ width: 280, date, showHero: false }),

    ...[a, b].map((t, i) =>
      h('div', {
        key: String(t.rank),
        style: {
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, position: 'relative', zIndex: 1, padding: '32px 24px',
          borderLeft: `1px solid ${C.border}`,
          background: i === 0 ? 'rgba(249,115,22,0.05)' : 'transparent',
        }
      },
        i === 0 && h('div', { style: { position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%', background: `radial-gradient(ellipse, rgba(249,115,22,0.12), transparent 60%)` } }),
        h('span', { style: { fontSize: i === 0 ? 28 : 22 } }, MEDAL[t.rank]),
        Avatar({ name: t.displayName, size: i === 0 ? 72 : 60, medalClr: MEDAL_CLR[t.rank] }),
        h('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3 } },
          h('span', { style: { fontSize: 9, color: MEDAL_CLR[t.rank], letterSpacing: '0.12em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, `#${t.rank} TRADER`),
          h('span', { style: { fontSize: i === 0 ? 18 : 15, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, t.displayName),
        ),
        h('span', { style: { fontSize: i === 0 ? 52 : 42, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono', lineHeight: 1, letterSpacing: '-0.02em' } },
          `${sign(t.netReturn)}${fmt(t.netReturn)}%`
        ),
        h('span', { style: { fontSize: 9, color: C.muted, letterSpacing: '0.14em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'NET RETURN'),
        t.winRate != null && h('span', { style: { fontSize: 13, color: C.jade, fontFamily: 'Space Mono' } }, `${fmt(t.winRate, 1)}% win rate`),
      )
    ),
  )
}

/* ─ Twitter: List (3-5 traders) ─ */
function buildTwitterList(traders, date) {
  const hero = traders[0]
  return h('div', { style: { width: 1200, height: 675, background: C.bg, display: 'flex', position: 'relative', fontFamily: 'DM Sans' } },
    ...TwBG(),
    TwBrandCol({ width: 400, date, showHero: true, hero }),

    // Right: table
    h('div', { style: { flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, position: 'relative', zIndex: 1 } },
      // Header
      h('div', { style: { display: 'flex', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${C.faint}`, marginBottom: 4 } },
        h('span', { style: { flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase', paddingLeft: 48 } }, 'Trader'),
        h('span', { style: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase', minWidth: 100, textAlign: 'right' } }, 'Net Return'),
        h('span', { style: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase', minWidth: 72, textAlign: 'right' } }, 'Win Rate'),
        h('span', { style: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase', minWidth: 52, textAlign: 'right' } }, 'W / L'),
      ),
      // Rows
      ...traders.map((t, i) => {
        const isHero = i === 0
        return h('div', {
          key: String(t.rank),
          style: {
            display: 'flex', alignItems: 'center',
            padding: isHero ? '12px 14px' : '9px 14px',
            borderRadius: isHero ? 10 : 6,
            background: isHero ? `rgba(249,115,22,0.08)` : 'transparent',
            border: isHero ? `1px solid rgba(249,115,22,0.18)` : 'none',
            marginBottom: 2,
          }
        },
          h('span', { style: { fontSize: MEDAL[t.rank] ? 18 : 12, fontWeight: 700, color: MEDAL_CLR[t.rank] ?? 'rgba(255,255,255,0.3)', width: 28, flexShrink: 0, fontFamily: 'DM Sans' } },
            MEDAL[t.rank] ?? `#${t.rank}`
          ),
          Avatar({ name: t.displayName, size: 30, medalClr: MEDAL_CLR[t.rank] }),
          h('span', { style: { flex: 1, fontSize: 14, fontWeight: isHero ? 700 : 400, color: isHero ? '#fff' : 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans', marginLeft: 10, overflow: 'hidden' } },
            t.displayName
          ),
          h('span', { style: { fontSize: 15, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono', minWidth: 100, textAlign: 'right' } },
            `${sign(t.netReturn)}${fmt(t.netReturn)}%`
          ),
          h('span', { style: { fontSize: 13, color: t.winRate != null ? C.jade : 'rgba(255,255,255,0.22)', fontFamily: 'Space Mono', minWidth: 72, textAlign: 'right' } },
            t.winRate != null ? `${fmt(t.winRate, 1)}%` : '—'
          ),
          h('span', { style: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Space Mono', minWidth: 52, textAlign: 'right' } },
            t.success != null && t.stopped != null ? `${t.success}/${t.stopped}` : '—'
          ),
        )
      }),
      // Slogan
      h('div', { style: { marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.faint}`, display: 'flex', justifyContent: 'flex-end' } },
        h('span', { style: { fontSize: 12, color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'Rise '),
        h('span', { style: { fontSize: 12, color: C.violet, fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'together.'),
      ),
    ),
  )
}

/* ══════════════════════════════════════════════════════════════
   STORY TEMPLATE  —  1080 × 1920
══════════════════════════════════════════════════════════════ */

function buildStoryTree(traders, mode) {
  const date = getYesterdayLabel()
  if (mode === 'empty') return buildStoryEmpty(date)
  if (mode === 'solo')  return buildStorySolo(traders[0], date)
  if (mode === 'duo')   return buildStoryDuo(traders, date)
  return buildStoryList(traders, date)
}

/* ─ Story: shared header ─ */
function StHeader({ date }) {
  return [
    // Top accent bar
    h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.cobalt}, ${C.violet} 50%, ${C.ember})` } }),
    // Background glows
    h('div', { style: { position: 'absolute', top: '-8%', left: '5%', width: '90%', height: '35%', background: `radial-gradient(ellipse, rgba(249,115,22,0.12), transparent 60%)` } }),
    h('div', { style: { position: 'absolute', bottom: '5%', right: '-10%', width: '70%', height: '25%', background: `radial-gradient(ellipse, rgba(123,92,245,0.1), transparent 60%)` } }),

    // Logo row
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        h('div', { style: { width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${C.cobalt}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h('span', { style: { fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, 'B')
        ),
        h('span', { style: { fontSize: 19, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, 'BottomUP'),
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 20, padding: '4px 12px' } },
        h('div', { style: { width: 5, height: 5, borderRadius: '50%', background: C.ember } }),
        h('span', { style: { fontSize: 10, fontWeight: 700, color: C.ember, letterSpacing: '0.1em', fontFamily: 'DM Sans' } }, "YESTERDAY"),
      ),
    ),

    // Date
    h('span', { style: { fontSize: 12, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'DM Sans', marginBottom: 8, display: 'block' } },
      `${date.sub} · ${date.label}`
    ),
    // Heading
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: 36 } },
      h('span', { style: { fontSize: 62, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans', lineHeight: 1.05 } }, 'Daily Top'),
      h('span', { style: { fontSize: 62, fontWeight: 700, color: C.ember, fontFamily: 'DM Sans', lineHeight: 1.05 } }, 'Performers'),
    ),
  ]
}

/* ─ Story: Empty ─ */
function buildStoryEmpty(date) {
  return h('div', { style: { width: 1080, height: 1920, background: C.bg, display: 'flex', flexDirection: 'column', padding: '72px 56px', position: 'relative', fontFamily: 'DM Sans' } },
    ...StHeader({ date }),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' } },
      h('span', { style: { fontSize: 52, fontWeight: 700, color: 'rgba(255,255,255,0.22)', fontFamily: 'DM Sans' } }, 'No qualifying'),
      h('span', { style: { fontSize: 52, fontWeight: 700, color: 'rgba(255,255,255,0.22)', fontFamily: 'DM Sans' } }, 'performers'),
      h('span', { style: { fontSize: 18, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' } }, 'All net returns are below threshold'),
    ),
  )
}

/* ─ Story: Solo ─ */
function buildStorySolo(t, date) {
  return h('div', { style: { width: 1080, height: 1920, background: C.bg, display: 'flex', flexDirection: 'column', padding: '72px 56px', position: 'relative', fontFamily: 'DM Sans' } },
    ...StHeader({ date }),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 } },
      h('div', { style: { position: 'absolute', top: '25%', left: '5%', right: '5%', height: '45%', background: `radial-gradient(ellipse, rgba(249,115,22,0.2), transparent 60%)` } }),
      Avatar({ name: t.displayName, size: 120, medalClr: C.gold }),
      h('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 } },
        h('span', { style: { fontSize: 13, color: C.ember, letterSpacing: '0.2em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'SOLE CHAMPION'),
        h('span', { style: { fontSize: 36, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, t.displayName),
      ),
      h('span', { style: { fontSize: 96, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono', lineHeight: 1, letterSpacing: '-0.03em' } },
        `${sign(t.netReturn)}${fmt(t.netReturn)}%`
      ),
      h('span', { style: { fontSize: 14, color: C.muted, letterSpacing: '0.18em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'NET RETURN'),
      h('div', { style: { display: 'flex', gap: 40, marginTop: 8 } },
        t.winRate != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } },
          h('span', { style: { fontSize: 11, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'Win Rate'),
          h('span', { style: { fontSize: 24, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${fmt(t.winRate, 1)}%`),
        ),
        t.trades != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderLeft: `1px solid ${C.border}`, paddingLeft: 40 } },
          h('span', { style: { fontSize: 11, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'Trades'),
          h('span', { style: { fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Mono' } }, String(t.trades)),
        ),
        t.success != null && t.stopped != null && h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderLeft: `1px solid ${C.border}`, paddingLeft: 40 } },
          h('span', { style: { fontSize: 11, color: C.muted, letterSpacing: '0.1em', fontFamily: 'DM Sans', textTransform: 'uppercase' } }, 'W / L'),
          h('span', { style: { fontSize: 24, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${t.success}/${t.stopped}`),
        ),
      ),
    ),
    // Footer
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h('span', { style: { fontSize: 18, color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'Rise '),
      h('span', { style: { fontSize: 18, color: C.violet, fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'together.'),
      h('span', { style: { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' } }, '@bottomupsocial'),
    ),
  )
}

/* ─ Story: Duo ─ */
function buildStoryDuo(traders, date) {
  const [a, b] = traders
  return h('div', { style: { width: 1080, height: 1920, background: C.bg, display: 'flex', flexDirection: 'column', padding: '72px 56px', position: 'relative', fontFamily: 'DM Sans' } },
    ...StHeader({ date }),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' } },
      ...[a, b].map((t, i) =>
        h('div', {
          key: String(t.rank),
          style: {
            background: i === 0 ? `linear-gradient(135deg, rgba(249,115,22,0.1), rgba(59,91,245,0.06))` : C.surface,
            border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.25)' : C.border}`,
            borderRadius: 24, padding: '44px 48px',
            position: 'relative',
            flex: i === 0 ? 1.3 : 1,
            display: 'flex', flexDirection: 'column',
          }
        },
          h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '24px 24px 0 0', background: i === 0 ? `linear-gradient(90deg, ${C.gold}, ${C.ember}, ${C.gold})` : `linear-gradient(90deg, #C0C0C0, #E8E8E8, #C0C0C0)` } }),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
              h('span', { style: { fontSize: i === 0 ? 28 : 22 } }, MEDAL[t.rank]),
              h('div', { style: { display: 'flex', flexDirection: 'column' } },
                h('span', { style: { fontSize: 11, color: MEDAL_CLR[t.rank], letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'DM Sans', marginBottom: 4 } }, `#${t.rank} Trader`),
                h('span', { style: { fontSize: i === 0 ? 26 : 22, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, t.displayName),
              ),
            ),
            Avatar({ name: t.displayName, size: i === 0 ? 52 : 42, medalClr: MEDAL_CLR[t.rank] }),
          ),
          h('span', { style: { fontSize: i === 0 ? 72 : 58, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 16 } },
            `${sign(t.netReturn)}${fmt(t.netReturn)}%`
          ),
          h('div', { style: { display: 'flex', gap: 28 } },
            t.winRate != null && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
              h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' } }, 'Win Rate'),
              h('span', { style: { fontSize: 20, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${fmt(t.winRate, 1)}%`),
            ),
            t.trades != null && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
              h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' } }, 'Trades'),
              h('span', { style: { fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: 'Space Mono' } }, String(t.trades)),
            ),
          ),
        )
      )
    ),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 } },
      h('span', { style: { fontSize: 18, color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'Rise '),
      h('span', { style: { fontSize: 18, color: C.violet, fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'together.'),
      h('span', { style: { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' } }, '@bottomupsocial'),
    ),
  )
}

/* ─ Story: List (3-5 traders) ─ */
function buildStoryList(traders, date) {
  const hero = traders[0]
  const rest = traders.slice(1)
  return h('div', { style: { width: 1080, height: 1920, background: C.bg, display: 'flex', flexDirection: 'column', padding: '72px 56px', position: 'relative', fontFamily: 'DM Sans' } },
    ...StHeader({ date }),

    // Hero card
    h('div', {
      style: {
        background: `linear-gradient(135deg, rgba(249,115,22,0.1), rgba(59,91,245,0.06))`,
        border: `1px solid rgba(249,115,22,0.22)`,
        borderRadius: 24, padding: '40px 44px',
        marginBottom: 20, position: 'relative',
        display: 'flex', flexDirection: 'column',
      }
    },
      h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '24px 24px 0 0', background: `linear-gradient(90deg, ${C.gold}, ${C.ember}, ${C.gold})` } }),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
          h('span', { style: { fontSize: 28 } }, '🏆'),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('span', { style: { fontSize: 12, color: C.violet, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'DM Sans', marginBottom: 4 } }, '#1 Trader'),
            h('span', { style: { fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans' } }, hero.displayName),
          ),
        ),
        Avatar({ name: hero.displayName, size: 52, medalClr: C.gold }),
      ),
      h('span', { style: { fontSize: 76, fontWeight: 700, color: rc(hero.netReturn), fontFamily: 'Space Mono', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 20 } },
        `${sign(hero.netReturn)}${fmt(hero.netReturn)}%`
      ),
      h('div', { style: { display: 'flex', gap: 32 } },
        hero.winRate != null && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
          h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' } }, 'Win Rate'),
          h('span', { style: { fontSize: 20, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${fmt(hero.winRate, 1)}%`),
        ),
        hero.trades != null && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, borderLeft: `1px solid ${C.border}`, paddingLeft: 32 } },
          h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' } }, 'Trades'),
          h('span', { style: { fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: 'Space Mono' } }, String(hero.trades)),
        ),
        hero.success != null && hero.stopped != null && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, borderLeft: `1px solid ${C.border}`, paddingLeft: 32 } },
          h('span', { style: { fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' } }, 'W / L'),
          h('span', { style: { fontSize: 20, fontWeight: 700, color: C.jade, fontFamily: 'Space Mono' } }, `${hero.success}/${hero.stopped}`),
        ),
      ),
    ),

    // Rest: #2-5 list
    h('div', {
      style: {
        flex: 1, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        marginBottom: 32,
      }
    },
      ...rest.map((t, i) =>
        h('div', {
          key: String(t.rank),
          style: {
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '28px 36px', flex: 1,
            borderBottom: i < rest.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none',
          }
        },
          h('span', { style: { fontSize: MEDAL[t.rank] ? 24 : 16, fontWeight: 700, color: MEDAL_CLR[t.rank] ?? 'rgba(255,255,255,0.35)', width: 36, fontFamily: 'DM Sans' } },
            MEDAL[t.rank] ?? `#${t.rank}`
          ),
          Avatar({ name: t.displayName, size: 44, medalClr: MEDAL_CLR[t.rank] }),
          h('span', { style: { flex: 1, fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'DM Sans', overflow: 'hidden' } },
            t.displayName
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
            h('span', { style: { fontSize: 24, fontWeight: 700, color: rc(t.netReturn), fontFamily: 'Space Mono' } },
              `${sign(t.netReturn)}${fmt(t.netReturn)}%`
            ),
            t.winRate != null && h('span', { style: { fontSize: 13, color: 'rgba(255,255,255,0.42)', fontFamily: 'DM Sans', marginTop: 2 } },
              `${fmt(t.winRate, 1)}% win rate`
            ),
          ),
        )
      )
    ),

    // Footer
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { display: 'flex', gap: 2 } },
        h('span', { style: { fontSize: 18, color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'Rise '),
        h('span', { style: { fontSize: 18, color: C.violet, fontFamily: 'DM Sans', fontStyle: 'italic' } }, 'together.'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
        h('span', { style: { fontSize: 14, color: 'rgba(255,255,255,0.42)', fontFamily: 'DM Sans' } }, '@bottomupsocial'),
        h('span', { style: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans' } }, 'bottomup.app'),
      ),
    ),
  )
}

/* ─── SVG → PNG ──────────────────────────────────────────────── */
async function svgToPng(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/* ─── ImgBB upload (Instagram needs public URL) ──────────────── */
async function uploadToImgBB(buffer) {
  const base64 = buffer.toString('base64')
  const body   = new URLSearchParams({ image: base64 })
  const res    = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
    method: 'POST', body,
  })
  const json = await res.json()
  if (!json.success) throw new Error(`ImgBB upload failed: ${JSON.stringify(json)}`)
  console.log('📤 Image uploaded:', json.data.url)
  return json.data.url
}

/* ─── Twitter/X ──────────────────────────────────────────────── */
async function postToTwitter(pngBuffer, traders) {
  const client = new TwitterApi({
    appKey:      process.env.TWITTER_API_KEY,
    appSecret:   process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret:process.env.TWITTER_ACCESS_SECRET,
  })

  const hero = traders[0]
  const date = getYesterdayLabel()

  const lines = [
    `📊 Daily Leaderboard — ${date.label}`,
    ``,
    `🥇 ${hero.displayName} leads with ${sign(hero.netReturn)}${fmt(hero.netReturn)}% net return`,
    hero.winRate != null ? `   Win rate: ${fmt(hero.winRate, 1)}%` : null,
    traders.length > 1 ? `   +${traders.length - 1} more performers` : null,
    ``,
    `bottomup.app | @bottomupsocial`,
  ].filter(l => l !== null)

  const mediaId = await client.v1.uploadMedia(pngBuffer, { mimeType: 'image/png' })
  const tweet   = await client.v2.tweet({ text: lines.join('\n'), media: { media_ids: [mediaId] } })
  console.log('✅ Twitter posted — tweet ID:', tweet.data.id)
  return tweet.data.id
}

/* ─── Instagram Story ────────────────────────────────────────── */
async function postToInstagram(imageUrl) {
  const igUser = process.env.INSTAGRAM_USER_ID
  const token  = process.env.INSTAGRAM_ACCESS_TOKEN
  const base   = 'https://graph.facebook.com/v19.0'

  // 1. Create container
  const createRes = await fetch(
    `${base}/${igUser}/media?image_url=${encodeURIComponent(imageUrl)}&media_type=STORIES&access_token=${token}`,
    { method: 'POST' }
  )
  const createJson = await createRes.json()
  if (!createJson.id) throw new Error(`Instagram container error: ${JSON.stringify(createJson)}`)
  const creationId = createJson.id
  console.log('📦 Instagram container ready:', creationId)

  // 2. Wait for processing
  await new Promise(r => setTimeout(r, 4000))

  // 3. Publish
  const publishRes = await fetch(
    `${base}/${igUser}/media_publish?creation_id=${creationId}&access_token=${token}`,
    { method: 'POST' }
  )
  const publishJson = await publishRes.json()
  if (!publishJson.id) throw new Error(`Instagram publish error: ${JSON.stringify(publishJson)}`)
  console.log('✅ Instagram Story posted — media ID:', publishJson.id)
  return publishJson.id
}

/* ─── Main ───────────────────────────────────────────────────── */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  BottomUP Daily Leaderboard Auto-Poster')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // 1. Fetch
  console.log('\n📡 Fetching yesterday\'s traders...')
  const raw = await fetchTraders()
  const { mode, display: traders } = resolveLayout(raw)

  if (mode === 'empty') {
    console.log('⚠️  No qualifying performers today — skipping post.')
    process.exit(0)
  }

  console.log(`\n📋 Layout: ${mode.toUpperCase()} | Traders: ${traders.length}`)
  traders.forEach(t => console.log(`   ${t.rank}. ${t.displayName} → ${sign(t.netReturn)}${fmt(t.netReturn)}%`))

  // 2. Fonts
  const fonts = await loadFonts()

  // 3. Render Twitter (1200×675)
  console.log('\n🎨 Rendering Twitter template (1200×675)...')
  const twTree  = buildTwitterTree(traders, mode)
  const twSvg   = await satori(twTree, { width: 1200, height: 675,  fonts })
  const twPng   = await svgToPng(twSvg)
  console.log(`   PNG size: ${(twPng.length / 1024).toFixed(0)} KB`)

  // 4. Render Story (1080×1920)
  console.log('🎨 Rendering Story template (1080×1920)...')
  const stTree  = buildStoryTree(traders, mode)
  const stSvg   = await satori(stTree, { width: 1080, height: 1920, fonts })
  const stPng   = await svgToPng(stSvg)
  console.log(`   PNG size: ${(stPng.length / 1024).toFixed(0)} KB`)

  // 5. Twitter
  console.log('\n🐦 Posting to Twitter/X...')
  await postToTwitter(twPng, traders)

  // 6. Instagram Story
  console.log('\n📸 Uploading Story for Instagram...')
  const storyUrl = await uploadToImgBB(stPng)
  await postToInstagram(storyUrl)

  console.log('\n🎉 All done! Both platforms updated.')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
