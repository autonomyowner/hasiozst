# AI TRIDI — Design System

Paste this whole file as context when asking Claude Design (or any design tool) to
produce screens, mockups, or marketing pages for AI TRIDI. Every value below is
taken from the live app (`tailwind.config.js`, `lib/constants.ts`, `components/`).

---

## 1. Brand identity

- **Name:** AI TRIDI — a marketplace app for Algeria (B2C + B2B wholesale).
- **Feel:** dark, premium, high-contrast. Gold on black. Photography does the
  talking; chrome stays out of the way.
- **Market:** Algeria. Prices in Algerian Dinar (`DA`), `fr-DZ` number locale,
  `fr-FR` dates. Web surfaces are Arabic-first / RTL; the mobile app is LTR.

---

## 2. Color

### Core palette (the only colors that exist)

| Token | Hex | Use |
|---|---|---|
| `primary` | `#FFD400` | Brand gold. CTAs, active states, prices, icons, links. |
| `background` | `#000000` | Screen background. Always pure black. |
| `card` | `#0C0C0C` | Cards, inputs, search bars, secondary buttons. |
| `surface` | `#111111` | Sheets, modals, elevated panels. |
| `border` | `#333333` | Hairlines and dividers only. |
| `text-primary` | `#FFFFFF` | Headings and body text. |
| `text-secondary` | `#898989` | Captions, placeholders, metadata. |
| `success` | `#22C55E` | Delivered / confirmed / positive. |
| `error` | `#EF4444` | Errors, destructive actions, input error borders. |
| `badge-new` | `#2866ED` | "New" badge only. |
| `pill-inactive` | `rgba(217,217,217,0.08)` | Unselected category pills. |

### Rules

- **Gold is the only accent.** Never introduce a second brand hue.
- **On gold, text is black** (`#000`), never white.
- Elevation is expressed by lightness: `#000` → `#0C0C0C` → `#111111`. No drop
  shadows for depth — the one exception is the gold glow on an active pill
  (`shadowColor #FFD400`, opacity `0.4`, radius `8`).
- **No colored icons.** Icons are white, `#898989`, or gold. Never multicolor,
  never filled-decorative.
- The scrim over imagery is `linear-gradient(transparent 35%, rgba(0,0,0,0.85) 100%)`.

---

## 3. Typography

**Montserrat**, six weights. Nothing else.

| Class | Weight | Use |
|---|---|---|
| `font-mont-extralight` | 200 | Rare, oversized display numerals |
| `font-mont-light` | 300 | Long-form secondary copy |
| `font-mont` | 400 | Body, inputs, placeholders |
| `font-mont-medium` | 500 | Labels, pill text, inline actions |
| `font-mont-semibold` | 600 | Section titles, badges, card titles |
| `font-mont-bold` | 700 | Primary button labels, prices, screen titles |

### Scale (as used in the app)

| Size | px | Applied to |
|---|---|---|
| `text-2xl` | 24 | Section headers (`SectionHeader` title) |
| `text-xl` | 20 | Screen titles |
| `text-base` | 16 | Large button label, product title on detail |
| `text-sm` | 14 | Body, inputs, medium buttons, pill labels |
| `text-xs` | 12 | Captions, badges, small buttons, metadata |

Line height is default; letter-spacing is never customized.

---

## 4. Spacing & radius

**Spacing scale (px):** `4 · 8 · 12 · 16 · 20 · 24 · 32`
(`xs sm md lg xl xxl xxxl`). 16 is the standard screen gutter (`px-4`);
12 is the standard gap between cards in a row.

**Radius:**

| Token | px | Use |
|---|---|---|
| `sm` | 8 | Inner image frames |
| `md` | 12 | Small tiles |
| `card` / `lg` | 16 | Cards, inputs, buttons, search bar — the default |
| `pill` | 9999 | Badges, chips, avatar circles |

Active category pills use `35`, inactive use `19` — a deliberate Figma quirk,
keep it.

---

## 5. Components

### Button
Radius 16, centered label.

| Variant | Container | Label |
|---|---|---|
| `primary` | `bg-primary` | black, bold |
| `secondary` | `bg-card` | white, semibold |
| `outline` | transparent + 1px gold border | gold, semibold |
| `ghost` | transparent | gold, medium |

Sizes: `sm` `px-12 py-8` / text 12 · `md` `px-20 py-12` / text 14 ·
`lg` `px-24 py-16` / text 16. Disabled = `opacity 0.5`. Loading swaps the label
for a spinner (black on primary, gold elsewhere).

### Card
`bg-card` (`#0C0C0C`), radius 16, image on top, no border.

### ProductCard
141×196 px (or full-width in grids). Image is full-bleed inside a 6px inset with
radius 10. **All text sits on top of the image inside the gradient overlay** —
never in a separate text block below. Favorite heart floats top-right; a
7×7 semi-transparent circle with a play glyph marks video items.

### Input (`TextInput`)
Label above (`text-sm`, medium, white, 6px gap). Field: `bg-card`, radius 16,
`px-16 py-12`, `text-sm` regular white, placeholder `#898989`. Error state adds a
1px `error` border plus a 12px error message below. Password fields get an
`eye-outline` toggle inset 14px right.

### SearchBar
`bg-card`, radius 16, `px-16 py-12`, 10px gap, gold `search-outline` at 18px,
placeholder `#898989`. Optional gold `funnel` at 16px on the right.

### CategoryPill
Active: `bg-primary`, black medium text, radius 35, gold glow.
Inactive: `bg-pill-inactive`, white medium text, radius 19.

### Badge
Pill, `px-8 py-2`, `text-xs` semibold.
`primary` gold/black · `success` green/white · `error` red/white ·
`neutral` card/white · `new` `#2866ED`/white.

### SectionHeader
`px-16`, `pt-16 pb-8`. Title `text-2xl` semibold white; optional 12px
`#898989` subtitle; optional gold `text-sm` medium action with a chevron.
Standard home section = `SectionHeader` + a horizontal `FlatList`.

### Header
"AI TRIDI" wordmark left; search and cart icons right as 46px circles.

### Feedback
Toasts are the branded `useToast` component — **never a system alert**.
Destructive confirmations use `ConfirmModal` (`danger` / `warning` / `info`)
with a spring animation.

### Empty states
Centered: single monochrome outline icon, `text-sm` white line, `text-xs`
`#898989` line, optional primary button. This is the *only* place an icon
appears decoratively in a screen body.

---

## 6. Iconography

Ionicons, **outline** style. Monochrome: white, `#898989`, or gold.
Sizes 14 / 16 / 18 / 20 / 24. Filled variants only for a tab bar's active state.

---

## 7. Layout patterns

- Every screen sits in `ScreenContainer`: black background + safe-area top.
- Screen gutter 16px; content max width = full bleed on mobile.
- Bottom tab bar, swipeable between tabs. Tab sets differ by role:
  - **B2C** — Home · Reels · Cart · Dashboard · Profile
  - **B2B** — Home · Demandes · Ads · Dashboard · Profile
  - **Guest** — Home · Reels · Profile
- Vertical rhythm: section header → horizontal list → 16–24px gap → next section.
- Banner carousels are image-only, no text overlay.

---

## 8. Content formatting

- **Price:** `12 500 DA` — `toLocaleString("fr-DZ")` + `" DA"`.
- **Compact counts:** `1.2K`, `3.4M`.
- **Dates:** `12 janv. 2026` (`fr-FR`, day numeric / month short / year numeric).

---

## 9. Hard rules (do not violate)

1. Pure black background — never charcoal, never a gradient.
2. Gold `#FFD400` is the sole accent; black text on gold.
3. No colored or filled decorative icons.
4. No decorative icons inside screen bodies or cards (empty states excepted).
5. Images are always remote URLs, never bundled illustrations.
6. Product card text lives inside the image gradient overlay.
7. No system alerts — branded toast or `ConfirmModal` only.
8. Montserrat only.
9. Radius 16 is the default for anything rectangular.
10. Banner carousels carry no text.
