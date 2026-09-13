# Claude Design — setup form answers

Copy each block into the matching field.

---

## Company name and blurb

AI TRIDI: an Algerian marketplace platform with a React Native mobile app
(Expo) and a Next.js web app on a shared backend. It serves both B2C shoppers
and B2B trade — wholesalers, importers, local suppliers and freelancers — with
product listings, short-video reels, cart and COD checkout, wholesale catalogs,
and a B2B offer/bid auction system. Interface is dark-mode-only: pure black with
a single gold accent, Montserrat throughout, photography-led cards. Prices in
Algerian Dinar; the web surface is Arabic-first / RTL.

---

## Link code from your computer  ← use this, not GitHub

Both repos are private, so the GitHub field will fail unless you authorize it.
Select a frontend-focused subfolder instead. Best selection, in priority order:

    zst-app/tailwind.config.js      ← the token source of truth
    zst-app/lib/constants.ts        ← Colors / Spacing / BorderRadius
    zst-app/lib/formatters.ts       ← DA price, fr-FR dates
    zst-app/components/             ← ui/, cards/, layout/, product/, sections/
    zst-app/app/                    ← real screens using the system
    zst-app/DESIGN-SYSTEM.md        ← the written spec

If it only takes one folder, pick `zst-app/components/` — it contains Button,
Badge, TextInput, SearchBar, CategoryPill, SectionHeader, EmptyState,
ConfirmModal, Toast and ProductCard, which is the whole system in practice.

---

## Upload a .fig file

Source file: https://www.figma.com/design/XZvvee3bk05zr9IEzb9NFM/test
In Figma: File → Save local copy… → produces the .fig to drop in.

Key screens if you'd rather export selected frames as PNGs instead:
Home 29:53 · Reels 29:324 · Cart 29:381 · Dashboard 29:990 · Profile 29:834 ·
Grociste Home 29:2203 · Checkout 29:1228 · Sign In 29:1477 · Onboarding 29:1407

---

## Add fonts, logos and assets

Fonts — do not upload files; specify Google Fonts Montserrat, weights
200 / 300 / 400 / 500 / 600 / 700.

Assets to upload from `zst-app/assets/`:

    assets/images/logo-tridi.png          ← wordmark
    assets/icon.png                       ← app icon
    assets/adaptive-icon.png              ← Android adaptive icon
    assets/splash-icon.png                ← splash
    assets/images/profile-cover-gold.jpg  ← gold silk texture, profile covers

---

## Any other notes?

Dark mode only — there is no light theme. Never generate one.

COLOR — the entire palette:
  #FFD400 primary gold · #000000 background · #0C0C0C card ·
  #111111 surface/sheets · #333333 border hairlines · #FFFFFF text ·
  #898989 secondary text and placeholders · #22C55E success · #EF4444 error ·
  #2866ED "new" badge only · rgba(217,217,217,0.08) inactive pill.
Gold is the ONLY accent — never add a second brand hue. Text on gold is always
black, never white. Depth comes from lightness (#000 → #0C0C0C → #111111), not
shadows; the single exception is a gold glow on an active category pill
(#FFD400, 40% opacity, 8px radius). Image scrim is always
linear-gradient(transparent 35%, rgba(0,0,0,0.85) 100%).

TYPE — Montserrat only. 700 for buttons, prices and screen titles; 600 for
section titles, card titles and badges; 500 for labels and pills; 400 for body,
inputs and placeholders; 300/200 for long secondary copy and oversized numerals.
Sizes: 24 section headers, 20 screen titles, 16 large buttons, 14 body/inputs,
12 captions/badges. No custom letter-spacing.

SPACING & RADIUS — scale 4 / 8 / 12 / 16 / 20 / 24 / 32; 16px is the screen
gutter, 12px the gap between cards. Radius 16 is the default for anything
rectangular (cards, inputs, buttons, search bar); 8 for inner image frames,
9999 for pills and avatars.

COMPONENTS — Buttons: primary = gold fill, black bold label; secondary = #0C0C0C
fill, white semibold; outline = 1px gold border, gold label; ghost = gold medium
label. All radius 16, disabled at 50% opacity. Inputs and search bars are
#0C0C0C fill, radius 16, 16×12 padding, #898989 placeholder, gold outline icon;
errors add a 1px red border and a 12px red message. Badges are pills at 8×2 with
12px semibold text. Cards are #0C0C0C, radius 16, image on top, no border.
Product cards are 141×196 with the image inset 6px at radius 10 — and ALL text
sits on top of the image inside the gradient overlay, never in a text block
below it. Section pattern is always a header row (24px semibold title, optional
12px grey subtitle, optional gold action link) followed by a horizontal list.

ICONS — Ionicons, outline style, monochrome only: white, #898989, or gold.
Filled variants exist only for an active tab bar item.

HARD RULES — never a charcoal or gradient background; never a second accent
color; never colored or filled decorative icons; never decorative icons inside
screen bodies or cards (centered empty states are the only exception); never
text overlaid on banner carousels; never system alert dialogs — use the branded
toast or the ConfirmModal; images are always remote URLs, never bundled
illustrations.

FORMATTING — prices render as "12 500 DA" (fr-DZ grouping + " DA"); counts
compact to 1.2K / 3.4M; dates are fr-FR short form, "12 janv. 2026".

NAVIGATION — bottom tab bar, swipeable, tab set varies by user role:
B2C = Home / Reels / Cart / Dashboard / Profile;
B2B = Home / Demandes / Ads / Dashboard / Profile;
guest = Home / Reels / Profile.

VOICE — direct and transactional, not playful. Short labels. Mixed French and
Arabic vocabulary in the B2B area ("Demandes", "Grociste", "Fournisseur").
