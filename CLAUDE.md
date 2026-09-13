# HASIO — Saudi hotel & service booking app

**Read this section before touching anything. The inherited documentation starts
below the `---` and describes an app we are actively replacing.**

## What we are building

**Hasio** — the best hotel and service booking app in Saudi Arabia.

Guests discover and book hotels, stays and travel services. **Hotel owners and
service providers publish their own listings from inside the app**, in two
formats that already exist in this codebase:

- **Cards** — the static listing (photos, price, details) — inherited from the product card system.
- **Reels** — short vertical video of the property or service — inherited from the reels system.

Both already work end to end (create screen → Convex storage upload → feed). They
get re-skinned to the travel domain, not rebuilt.

## How we work on it: one change at a time

This repo is a **fork of AI TRIDI**, a working Algerian B2B/B2C marketplace. It is
not a greenfield project and must not be treated as one.

**The method is incremental migration.** Each step takes one slice of the
marketplace and converts it to the booking domain, keeping the app running and
type-clean (`npx tsc --noEmit`) at every step. Do not attempt a big-bang rewrite,
do not delete subsystems wholesale because they "look like marketplace code", and
do not scaffold new modules when an inherited one can be renamed and reshaped.

Before building anything new, **check what the existing structure already gives
you.** The upload pipeline, media gallery, auth, roles, favorites, notifications,
search, pagination and dashboards are all built and working.

When you complete a step, add a dated entry under **Migration log** below.

## Domain mapping — marketplace → booking

The inherited concept on the left is the thing to reshape; don't invent the right
column from scratch.

| Inherited | Becomes | Notes |
|---|---|---|
| `products` (cards) | Hotel / room / service **listings** | Keep the multi-image gallery + `videoUrl` auto-reel behaviour |
| `reels` | Property & service **reels** | Already owner-uploaded; needs travel-domain metadata |
| `freelanceServices` | **Services** (tours, transport, guides, events) | Closest existing fit; already has `images[]` + search index |
| `orders` | **Bookings** | Per-seller grouping becomes per-property grouping; status timeline becomes booking lifecycle |
| `cart` + `checkout` | **Booking flow** | Dates/guests replace quantity; see open questions |
| `offers` + `bids` | **Quote requests** for group/event bookings | Or removed — decision pending |
| `demandRequests` | Guest **trip requests** | Or removed — decision pending |
| `promotions` + subscription plans | **Featured / promoted listings** | Reusable close to as-is |
| `favorites` | Saved stays | Reusable as-is |
| `notifications` + push | Booking notifications | Reusable as-is |

### Roles

Current effective roles (`lib/types.ts` → `getEffectiveRole()`) are
`customer | fournisseur | importateur | grossiste | freelancer`, split across two
tab groups `(main)` (B2C) and `(grociste)` (B2B).

Target is far simpler: **guest**, **hotel owner**, **service provider**. The
two-tab-group split and the `(grociste)` naming are almost certainly more
structure than a booking app needs — but collapsing roles touches routing, every
layout, and server-side authorization, so it is **its own migration step**, not a
side effect of another one.

## Saudi localization — required, not cosmetic

The inherited app is Algeria/French. Every one of these is a migration step:

| Area | Now | Target |
|---|---|---|
| Geography | `lib/algeriaData.ts` — 58 wilayas + communes (93 lines, used by checkout) | Saudi regions & cities (Riyadh, Makkah, Madinah, Jeddah, Dammam, AlUla, NEOM …) |
| Currency | `formatPrice()` → `fr-DZ` + `"DA"` | **SAR** (`ar-SA`, ﷼) |
| Dates | `formatDate()` → `fr-FR` | `ar-SA`; booking flows also need **Hijri** awareness |
| UI language | English/French strings inline in components | **Arabic-first** |
| Layout | LTR only | **RTL** — this is structural. NativeWind/RN need `I18nManager` + logical properties; retrofitting it late is expensive, so decide early |

Seed data (`convex/seed.ts`) is inherited Algerian marketplace mock content and
should be replaced wholesale with Saudi hotel/service data rather than patched.

## Open decisions — ask the owner, don't guess

- Real domain name (`hasio.com` is a **placeholder** in `app/privacy-policy.tsx`,
  `app/terms-of-service.tsx`, `hooks/useReels.ts`, `convex/auth.ts`, `convex/http.ts`).
- Arabic-first vs bilingual AR/EN, and whether RTL lands before or after the domain rework.
- Booking model: instant-book vs request-to-book; does the cart survive as a
  multi-item basket, or does each booking stand alone?
- Payments: the inherited subscription screens render payment methods but process
  nothing real.
- Whether `offers`/`bids`/`demandRequests` become group-booking quotes or get removed.

## Migration log

Newest last. One entry per completed step.

- **2026-09-13** — Forked from AI TRIDI. Severed all original-app infrastructure
  (see table below), rebranded identity strings to HASIO, removed hardcoded AI
  TRIDI storage URLs. App structure otherwise untouched.

---

# Infrastructure isolation — keep it this way

This repo is `https://github.com/autonomyowner/hasiozst.git`. It shares **no**
git history, backend, or store listing with AI TRIDI.

| Link | Status |
|---|---|
| Git remote | `autonomyowner/hasiozst` only. AI TRIDI's repo is NOT a remote here. |
| EAS project id / owner / OTA `updates.url` | **Removed** from `app.json`. Run `eas init` to create a *new* project before any build. |
| Convex deployments (`secret-toad-401` prod, `silent-chipmunk-103` dev) | **Removed.** `.env.local` is blank — run `npx convex dev` and pick **create a new project**. Never point this repo at those deployments. |
| Sentry (org `autonomy-em`, project `react-native`/`aitridi`) | **Removed** from `app.json` + `eas.json`. `lib/sentry.ts` no-ops without a DSN. |
| Bundle id | `com.hasio.app` (was `com.aitridi.app`) — a separate Play Store / App Store app. |
| Deep-link scheme | `hasio://` (was `ai-tridi://`) |
| Legacy storage URLs | Behind `LEGACY_STORAGE_BASE`, empty by default. Do not hardcode another project's storage. |
| Old builds in `aab appstore/` | Gitignored. Belong to AI TRIDI — do not upload or submit them. |

**Everything below this line is inherited AI TRIDI documentation.** It still
describes the *code* accurately — the codebase is unchanged apart from branding —
so it remains the best map of how the app works. But **every AI TRIDI project id,
Convex URL, EAS build id, Sentry token and Play Store instruction in it is stale
and must not be acted on.** In particular, do NOT follow the "OTA workflow"
section's instruction to write `secret-toad-401` into `.env.local` — that is the
*original* app's production backend.

As each subsystem is migrated, update the inherited section below to describe the
Hasio behaviour instead of appending contradictory notes.

---

# Inherited AI TRIDI documentation

Accurate as a map of how the code works. Stale wherever it names a project id,
deployment, build or store listing. Migrate sections here as you migrate the code.

## Commands

```bash
npx expo start          # Start dev server (press a for Android, i for iOS, w for web)
npx convex dev          # Start Convex dev server (generates types + deploys functions)
npx convex run seed:clearAll  # Clear all database tables
npx convex run seed:seed      # Seed database with mock data
npx tsc --noEmit        # Type-check without emitting
```

On Windows, Convex may OOM during deploy. Fix: `set NODE_OPTIONS=--max-old-space-size=4096 && npx convex dev --once`

No test framework is configured. No linter is configured.

## Critical Gotchas

- **`npm install` requires `--legacy-peer-deps`** — Expo has react-dom peer conflicts
- **`convex/_generated/` doesn't exist until `npx convex dev` runs** — type errors before first run are expected
- **`getAuthenticatedAppUser()` throws when unauthenticated** — must always wrap in try-catch, it does NOT return null
- **`baseURL` in `lib/auth-client.ts` must point to `EXPO_PUBLIC_CONVEX_SITE_URL`** — React Native has no same-origin; omitting baseURL breaks auth
- **Categories use `slug` field for identification, not `_id`** — queries filter by slug
- **`useQuery` returns `undefined` while loading** — handle with `?? []` or loading states
- **NativeWind v4 requires both babel AND metro config** — `babel.config.js` sets `jsxImportSource: "nativewind"` + `nativewind/babel` preset; `metro.config.js` wraps with `withNativeWind` AND `getSentryExpoConfig` (Sentry must wrap the base config FIRST, NativeWind on top)
- **`freelanceServices.images` is required** — always pass an `images` array (even single-item) when creating; `imageUrl` is auto-set to `images[0]`
- **Bump `versionCode` for every native build** — Sentry uses `<package>@<version>+<versionCode>` as the release ID and source maps are uploaded against that exact string. Skipping the bump means the new build inherits the previous release's symbols.
- **`SENTRY_AUTH_TOKEN` must be an EAS secret** — `eas secret:create --name SENTRY_AUTH_TOKEN --value <token>` (one-time). Without it, source maps fail to upload silently and crash reports stay minified. Token: https://sentry.io/settings/account/api/auth-tokens/ (scope: `project:releases`)

## Architecture

**AI TRIDI** — a React Native marketplace app built with Expo SDK 54, Expo Router, NativeWind v4, Convex real-time backend, and Better-Auth (`@convex-dev/better-auth`) for authentication.

### Backend (Convex)

Schema in `convex/schema.ts`. Key modules:
- `products.ts` — CRUD + queries (list, search, freshPicks, supplierSpecials, getById with seller join). Auto-creates a reel when a product has `videoUrl`.
- `cart.ts` — cart with product joins (get, addItem, removeItem, updateQuantity, clear)
- `orders.ts` — atomic order creation (reads cart, groups by seller, creates per-seller orders, clears cart, notifies)
- `offers.ts` + `bids.ts` — B2B auction (bid acceptance auto-rejects others + closes offer)
- `notifications.ts` — server-side notifications via internal `createNotification` helper + `sendPushNotification` internal action (Expo Push API)
- `demandRequests.ts` — B2B buyer demand requests
- `clientRequests.ts` — freelancer client requests (listForFreelancer, countNew, accept, decline, complete)
- `freelanceServices.ts` — freelancer service listings with multi-image gallery (`images` array) + optional `videoUrl`
- `reels.ts` — video reel content
- `storage.ts` — Convex built-in file storage (`generateUploadUrl` auth-gated, `getUrl` query, `resolveUrl` auth-gated mutation)
- `promotions.ts` — seller promotion CRUD (list, listByCreator, create, remove)
- `http.ts` — HTTP routes (auth only — no R2/CORS)
- `seed.ts` — seed data + `clearAll` + `clearContent` (preserves users/orders/notifications)
- `users.ts` — `viewer` (self, includes email), `getById` (public, strips email), `updateProfile`, `savePushToken`/`clearPushToken`

### Authorization Pattern

All mutations that modify owned resources verify ownership:

```typescript
handler: async (ctx, args) => {
  const user = await getAuthenticatedAppUser(ctx);
  if (!user) throw new Error("Not authenticated");
  const resource = await ctx.db.get(args.id);
  if (!resource) throw new Error("Resource not found");
  if (resource.ownerId !== user._id) throw new Error("Not authorized");
};
```

Enforced in: `products.ts` (sellerId), `bids.ts` (offer.creatorId), `offers.ts` (creatorId), `orders.ts` (sellerId), `demandRequests.ts` (userId), `freelanceServices.ts` (freelancerId).

### Input Validation

Server-side bounds: Products (`price > 0 && <= 100M`, `name <= 200 chars`, `description <= 5000 chars`), Bids (`amount > 0`, `>= minPrice`, `message <= 1000 chars`), Offers (`title <= 200`, `description <= 2000`, `minPrice > 0`, `quantity > 0`), Promotions (`title <= 200`, `priceLow >= 0`, `priceHigh >= priceLow`).

### Authentication

Uses `@convex-dev/better-auth` with email/password + Google OAuth:
- `convex/auth.ts` — `createAuth()` instance + `getAuthenticatedAppUser()` helper. `SITE_URL` defaults to `http://localhost:8081`. Trusted origins: `ai-tridi://`, `exp://`, `http://localhost:8081`, `http://localhost:19006`.
- `lib/auth-client.ts` — client-side auth with `baseURL` set to Convex site URL
- `providers/AppProviders.tsx` — wraps app in `GestureHandlerRootView` > `ConvexBetterAuthProvider` > `GuestProvider`

### Guest Mode

`providers/GuestProvider.tsx` provides session-scoped guest browsing (resets on app restart). All listing queries are public. Auth-required mutations throw for guests.

### Image Storage & Uploads

**Convex built-in storage** (sole upload method): `convex/storage.ts` exposes `generateUploadUrl` (auth-gated mutation) + `getUrl` (public query) + `resolveUrl` (auth-gated mutation, used after upload). All upload screens use `generateUploadUrl` → POST file → `resolveUrl` flow. R2 is not used — `http.ts` has no upload routes. URLs are permanent, never expire.

`AppImage` component accepts `source: string` (always URL, never local assets). Shows gray placeholder while loading, fallback icon on error, fade-in via Reanimated on load.

### Push Notifications

`hooks/usePushNotifications.ts` — registers Expo push token on physical devices, saves to `users.expoPushToken`. Handles foreground/background/cold-start notification routing. `app/_layout.tsx` includes `<PushRegistration />` for cold-start deep linking. `notifications.sendPushNotification` calls Expo Push API; auto-clears stale `DeviceNotRegistered` tokens.

### Role System

5 effective roles derived from `UserRole` + `SellerType` (`lib/types.ts` → `getEffectiveRole()`):

| EffectiveRole | UserRole + SellerType | Route Group | Visible Tabs |
|---|---|---|---|
| customer | customer | `(main)` | Home, Reels, Cart, Dashboard, Profile |
| fournisseur | seller + fournisseur | `(grociste)` | Home, Demandes, Ads, Dashboard, Profile |
| freelancer | freelancer | `(main)` | Home, Reels, Dashboard, Profile |
| importateur | seller + importateur | `(grociste)` | Home, Demandes, Ads, Dashboard, Profile |
| grossiste | seller + grossiste | `(grociste)` | Home, Demandes, Ads, Dashboard, Profile |

`app/index.tsx` redirects to correct route group. Tab visibility controlled by conditional rendering in layout files.

**Dev role panel**: `components/dev/DevRolePanel.tsx` — `__DEV__` only, tap the role indicator 5 times within 2 seconds to toggle. `useUserRole().setDevRole()` overrides the effective role and navigates to the correct route group.

### Routing

Two tab groups under `app/`:
- `(main)/` — B2C tabs (Home, Reels, Cart, Dashboard, Profile)
- `(grociste)/` — B2B tabs (Home, Demandes, Ads, Seller-Dashboard, Profile)

Stack screens: `product/[id]`, `search`, `checkout`, `order-confirmation`, `order/[id]`, `offer/[id]`, `create-offer`, `create-demand`, `create-reel`, `create-service`, `create-product`, `edit-product`, `create-post`, `notifications`, `my-orders`, `my-products`, `favorites`, `edit-profile`, `sign-in`, `sign-up`, `onboarding`, `client-requests`, `subscription-plan`, `subscription-payment`.

### Tab Navigation

Tabs use `@react-navigation/material-top-tabs` via `components/layout/MaterialTopTabs.ts` (wraps `createMaterialTopTabNavigator` with `withLayoutContext` for Expo Router). Swipe between tabs is powered by `react-native-pager-view`. Both layouts use `tabBarPosition="bottom"` with a custom `CustomTabBar` component. Settings: `offscreenPageLimit={1}`, `lazy: true`, `lazyPreloadDistance: 1`, `pagerStyle: { backgroundColor: "#000" }`.

### Onboarding Flow

`app/onboarding.tsx` — 3-slide carousel. `@react-native-async-storage/async-storage` key `hasSeenOnboarding`. `app/index.tsx` redirects first-time unauthenticated users to `/onboarding`.

### Product Detail Variants

`app/product/[id].tsx` renders 3 layouts based on `productType` field:
- **Express**: Image carousel + supplier info + rating + price + description + quantity + "Order Now"
- **Grocery**: Same + 2x2 info grid (Stock/Price/Expiration/Storage) + "Organic" badge
- **Importer**: Same + 2x2 spec grid (Power/Capacity/Warranty/Material) + "Imported" badge + "Request Quote"

Shared components in `components/product/`: `ImageCarousel`, `ProductInfoGrid`, `QuantitySelector`, `OrderSummaryTable`, `SupplierInfo`.

### Subscription & Promotion

`lib/subscriptionPlans.ts` defines 3 plans. Screens: `(grociste)/ads.tsx`, `subscription-plan.tsx`, `create-post.tsx`, `subscription-payment.tsx`. Payment methods render but don't process real payments. Promotion CRUD (create/delete posts) has a real Convex backend in `convex/promotions.ts`.

### Styling

- NativeWind v4 with `className` prop on all RN components
- Dark theme: background `#000`, surface `#111`, card `#0C0C0C`, primary `#FFD400`
- Font: Montserrat (6 weights) via `@expo-google-fonts/montserrat`
- Tailwind tokens: `bg-card`, `bg-surface`, `bg-pill-inactive`, `text-primary`, `text-text-secondary`, `rounded-card`, `rounded-pill`
- Font classes: `font-mont`, `font-mont-light`, `font-mont-extralight`, `font-mont-medium`, `font-mont-semibold`, `font-mont-bold`
- Color tokens: `success` (#22C55E), `error` (#EF4444), `badge-new` (#2866ED)
- `lib/constants.ts` exports `Colors` (includes `border: "#333333"`), `Spacing` (xs–xxxl: 4–32), `BorderRadius` (card/pill/sm/md/lg)

### State Management

Hooks in `hooks/` wrap Convex `useQuery`/`useMutation`: `useCurrentUser()`, `useUserRole()`, `useCart()`, `useFavorites()`, `useOrders()`, `useOffers()`, `useNotifications()`, `useClientRequests()`, `useSellerStats()`, `useFreelanceServices()`, `usePromotions()`.

Composite hooks: `useOrderActions()`, `useOfferActions()`.

### Component Patterns

- `ScreenContainer` wraps every tab screen (safe area + black background, configurable `edges` prop, default `["top"]`)
- `SectionHeader` + horizontal `FlatList` = standard home section
- `ProductCard`: 141px wide, all text inside image gradient overlay
- Cards: dark `bg-card`, `rounded-card`, image on top

### Formatting

Currency: Algerian Dinar — `formatPrice()` uses `fr-DZ` locale + "DA". Dates: `fr-FR` locale. `formatCompactNumber()` for "1.2M" style. All in `lib/formatters.ts`.

### Import Alias

`@/*` maps to project root (configured in `tsconfig.json`).

### B2C Order Flow

Cart → `/checkout` (Wilaya/Commune dropdowns from `lib/algeriaData.ts`, Home/Office delivery radio) → `/order-confirmation` → `/order/[id]` (status timeline). Atomic server-side creation groups cart items by seller into separate orders.

### B2B Offer/Auction System

Demandes screen tab switcher: "Demandes" | "Offers". `/offer/[id]` shows bids — creators accept/reject, others submit. Accepting auto-rejects other bids and closes offer atomically.

### Pagination

`.take(N)` limits: `products.list()` configurable (default 50), `notifications.listForUser()` capped at 50, `demandRequests` capped at 50.

### Environment Variables

- `.env.local`: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL`, `CONVEX_DEPLOYMENT` (see `.env.example`)
- Convex Dashboard: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SITE_URL`

### Expo Config

`app.json`: scheme `ai-tridi`, `newArchEnabled: true`, `userInterfaceStyle: "dark"`, `android.edgeToEdgeEnabled: true`, push notification color `#FFD400` with `defaultChannel: "default"`.

### Figma Design Source

Figma file: `https://www.figma.com/design/XZvvee3bk05zr9IEzb9NFM/test`

Key screen node IDs (use `29:*` prefix): Home (`29:53`), Reels (`29:324`), Cart (`29:381`), Dashboard (`29:990`), Profile (`29:834`), Grociste Home (`29:2203`), Grociste Demandes (`29:603`), Seller Profile (`29:4027`), Checkout (`29:1228`), Sign In (`29:1477`), Sign Up (`29:1520`), Onboarding (`29:1407`), Edit Profile (`29:924`), Ads/Promote (`29:3532`), Client Requests (`29:3144`), Grocery Product (`29:2495`), Importer Product (`29:2640`).

## Guest Mode

- `GuestProvider` persists guest state in `AsyncStorage` (survives reload)
- Sign-in page has "Continue as Guest" — calls `authClient.signOut()` first to clear any session, then `enterGuestMode()`
- Guests see only **Home**, **Reels**, **Profile** tabs (no Cart, no Dashboard)
- Tab visibility is controlled in `CustomTabBar` by filtering `state.routes` — all screens stay registered in `MaterialTopTabs` (Expo Router requires it)
- Profile tab shows sign-in prompt for guests (not the real profile)
- Guest actions (favorite, add to cart) show a toast then redirect to sign-in after 1.5s
- `exitGuestMode()` clears `AsyncStorage` flag — called when guest taps Sign In/Sign Up

## Reels Video Player

- `ReelCard` receives `height` from parent (measured via `onLayout`) — never use `Dimensions.get("window").height`
- Player initializes **muted** (`muted: true`) — only unmuted when `isActive` is true
- When inactive: player is both **paused AND muted** to prevent audio bleed
- `useIsFocused()` from `@react-navigation/native` gates `isActive` in `reels.tsx` — videos pause when tab loses focus
- Cleanup effect mutes+pauses on unmount
- `offscreenPageLimit={1}` keeps adjacent tabs mounted — muting is essential, not just pausing

## Design Rules

- Tab bar icons: Ionicons outline style — standard navigation UX
- Do not add decorative icons inside screen content or cards
- Do not use colored/filled icon variants
- Banner carousel: images only, no text overlay
- ProductCard: all content inside image gradient overlay (Figma pattern)
- Home header: "AI TRIDI" logo text + search + cart icons (46px circles)
- **Never use `Alert.alert`** — all success/error/info messages must use the branded toast (`useToast` from `@/providers/ToastProvider`). For destructive confirmations (delete, remove), use `ConfirmModal` from `@/components/ui/ConfirmModal` (supports `danger`/`warning`/`info` variants with spring animation)
- **Never disable swipe navigation** — `swipeEnabled: true` must always stay on for MaterialTopTabs. Swipe between tabs is a core UX feature.

## Production Readiness (March 2026)

### Build & Config
- **`eas.json`** — EAS Build profiles: development (internal, simulator), preview (internal), production (store). All profiles include Convex env vars.
- **`.env.example`** — Documents all client-side + Convex Dashboard environment variables.

### Backend Sync (mobile ← web)
- **`convex/storage.ts`** — Synced: `generateUploadUrl` now requires auth, `getUrl` changed from mutation→query, added `resolveUrl` auth-gated mutation. All 6 upload screens (`create-product`, `create-reel`, `create-service`, `edit-product`, `edit-profile`, `create-post`) updated to use `resolveUrl`.
- **`convex/seed.ts`** — Added `clearContent` mutation (clears products/services/reels, preserves users/orders/notifications).
- **`convex/http.ts`** — Removed dead R2 `/upload-url` route + CORS helper. File now only registers better-auth routes. R2 is not used anywhere in the mobile app.

### Auth Validation
- **`sign-in.tsx`** — Email format validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **`sign-up.tsx`** — Email format validation + phone validation: `/^0[5-7][0-9]{8}$/` with error display

### Error Handling
- **`useCart.ts`** — All 4 mutations (`addItem`, `removeItem`, `updateQuantity`, `clearCart`) wrapped in try-catch with `showError()` toast
- **`useOrderActions.ts`** — `placeOrder` + `advanceOrderStatus` wrapped in try-catch with `showError()` toast
- **`useFavorites.ts`** — `toggleFavorite` wrapped in try-catch with `showError()` toast
- **`CommentSheet.tsx`** — `addComment` wrapped in try-catch with `showError()` toast

### AppImage Improvements
- Loading: gray placeholder shown while image loads
- Error: fallback icon (`image-outline`) on failed load
- Animation: fade-in via `react-native-reanimated` `FadeIn` on successful load

### UX Fixes
- **`notifications.tsx`** — Added null check on `relatedId` (prevents crash when notification has no related entity)
- **Pull-to-refresh** — Added `RefreshControl` to home, cart, favorites, notifications screens (visual only — Convex auto-refreshes)

### Performance
- **FlatList optimizations** — `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews` on favorites grid + ProductRow horizontal lists

### Asset Cleanup
- Deleted 8 unused `unknown-*.png` files + unused `company-logo-global-import.png` (~434KB saved)

### Fournisseur B2B/B2C Hybrid Flow (April 2026)

Fournisseur (local supplier) moved from `(main)` to `(grociste)` route group, giving them the same B2B/B2C switching experience as grossiste/importateur via `useViewMode`.

**Routing changes:**
- `app/index.tsx` — fournisseur redirects to `/(grociste)/home`
- `app/(grociste)/_layout.tsx` — fournisseur allowed in grociste zone
- `app/(main)/_layout.tsx` — fournisseur redirected out, removed from tab visibility
- `app/cart.tsx` — **new standalone cart screen** (stack screen with back button) to avoid redirect loop when fournisseur accesses cart from B2C mode
- `components/sections/B2CHomeContent.tsx` — cart icon navigates to `/cart` instead of `/(main)/cart`

**Backend role expansion (both `zst-app/convex/` and `AItridiv0/convex/`):**
- `offers.ts` (`getById`, `listOpen`), `bids.ts` (`listByOffer`), `demandRequests.ts` (`list`, `listByStatus`, `getById`) — added `"fournisseur"` to read-access role checks
- No create/mutation changes — fournisseur **cannot** create offers, bids, or demand requests (server-side enforcement unchanged)

**UI restrictions for fournisseur:**
- `app/(grociste)/demandes.tsx` — "Post Demand", "Submit Offer", "Create Offer" buttons hidden; empty state CTA adjusted
- `app/offer/[id].tsx` — "Place a Bid" form hidden (`canBid` check excludes fournisseur)
- `app/(grociste)/seller-dashboard.tsx` — shows "Retailer Panel" subtitle
- `app/(grociste)/profile.tsx` — "Favorites" menu item added
- `app/(main)/dashboard.tsx` — fournisseur branch removed (no longer reaches this screen)

**Fournisseur capabilities summary:**

| Feature | Browse | Create | Notes |
|---------|--------|--------|-------|
| Wholesale Products | Yes | No | Already allowed in backend |
| Demand Requests | Yes | No | Can respond via `demandResponses` |
| Offers | Yes | No | Importateur-only creation |
| Bids | Yes | No | Grossiste-only creation |
| B2C Products | Yes (B2C mode) | Yes | Via create-product |
| Cart | Yes (via `/cart`) | — | Standalone stack screen |
| Promotions/Ads | Yes | Yes | No role restriction |
| Reels | Yes (B2C mode) | Yes | Via B2C mode toggle |

### OTA Updates — EAS Update (April 2026)

- **`expo-updates`** installed and configured for over-the-air JS updates
- **`app.json`**: `runtimeVersion` uses `appVersion` policy (tied to `version` field), `updates.url` points to EAS project `20890a58-5f13-4430-b8aa-7adc7cb73dfc`
- **`eas.json`**: channels configured — `development`, `preview`, `production` (one per build profile)
- **`fallbackToCacheTimeout: 0`** — app launches immediately with cached bundle, downloads update in background for next launch

**OTA workflow — CRITICAL, read before every `eas update`:**

Unlike `eas build` (which reads `eas.json` env), `eas update` runs `expo export` locally and bakes whatever `zst-app/.env.local` says into the JS bundle. `.env.local` in this repo points at **dev** Convex (`silent-chipmunk-103`). If you run `eas update` without intervention, the OTA ships JS pointed at dev Convex — prod users then hit "could not find public function for blocks:..." because the new functions only exist on prod (`secret-toad-401`). The failure looks like a missing function, but it's a wrong-deployment bug.

Even worse: Metro caches the first env value it sees (`node_modules/.cache`, `.expo`, `dist`). Just rewriting `.env.local` is not enough — the cache keeps serving the old value. You must explicitly clear it.

**Safe workflow:**
```bash
cd zst-app

# 1. Back up and rewrite .env.local to prod URLs
cp .env.local .env.local.DEVBAK
cat > .env.local <<'EOF'
EXPO_PUBLIC_CONVEX_URL=https://secret-toad-401.eu-west-1.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://secret-toad-401.eu-west-1.convex.site
CONVEX_DEPLOYMENT=prod:secret-toad-401
EXPO_PUBLIC_SENTRY_DSN=https://b82c1e64feacebcb5a3cc25619820685@o4509829729746944.ingest.de.sentry.io/4511163853176912
EOF

# 2. Nuke Metro cache (otherwise the dev URL persists)
rm -rf dist .expo node_modules/.cache

# 3. Verify the bundle BEFORE publishing
NODE_OPTIONS=--max-old-space-size=8192 npx expo export --platform android --output-dir dist --clear
node -e "const fs=require('fs'),p=require('child_process').execSync('ls dist/_expo/static/js/android/*.hbc').toString().trim(),d=fs.readFileSync(p);for(const t of ['silent-chipmunk','secret-toad']){let i=0,c=0;while(true){const j=d.indexOf(t,i);if(j<0)break;c++;i=j+1;}console.log(t,c);}"
# Expected: silent-chipmunk 0, secret-toad > 0. If silent-chipmunk > 0, DO NOT PUBLISH — the cache is still dirty.

# 4. Publish
NODE_OPTIONS=--max-old-space-size=8192 npx eas update --channel <preview|production> --message "..." --non-interactive --clear-cache

# 5. Restore .env.local so local `npx convex dev` still points at dev
cp .env.local.DEVBAK .env.local && rm .env.local.DEVBAK
```

**Also:**
- `NODE_OPTIONS=--max-old-space-size=8192` required — Hermes OOMs on Windows with the default heap.
- After publishing, users must force-stop the app and reopen **twice** (launch 1 downloads, launch 2 applies — `fallbackToCacheTimeout: 0`).
- **Channel mismatch gotcha:** The APK on a phone only pulls OTAs from its build-time channel. A `preview` APK won't see updates pushed to `production` and vice-versa. Check `eas build:list` to confirm the channel before pushing.
- If a bad OTA ships, recover with `npx eas update:roll-back-to-embedded --channel <ch> --runtime-version 1.0.0 --platform all --non-interactive --message "rollback"`. This restores the APK's original embedded JS, but wipes out every legitimate OTA since the build — you'll have to re-publish them.
- **Verify a published bundle:** download `launchAsset.url` from `https://u.expo.dev/20890a58-5f13-4430-b8aa-7adc7cb73dfc` (with `expo-platform`, `expo-runtime-version`, `expo-channel-name`, `expo-protocol-version: 1`, `accept: multipart/mixed` headers) and grep the `.hbc` for `silent-chipmunk` — must be 0.

**What can go OTA:** JS code, UI, styling, assets, bug fixes (~90% of changes)
**What needs a new build:** native libraries, permissions, Expo SDK upgrades, app icon/splash

**Important:**
- Any APK built **before** `expo-updates` was added (pre-April 2026) cannot receive OTA updates — must rebuild and redistribute
- When adding native dependencies, bump `version` in `app.json` → rebuild → then OTA updates resume for the new version

### Services Infinite Scroll + Search (April 2026)

- **`freelanceServices` schema**: added `.searchIndex("search_title", { searchField: "title", filterFields: ["category"] })`
- **`convex/freelanceServices.ts`**: added `listPaginated` (paginated query with optional category filter) + `search` (server-side full-text search on title, returns up to 50)
- **`app/services.tsx`**: rewritten with `usePaginatedQuery` (10 items per page), `onEndReached` auto-loads more, server-side search replaces client-side filtering when search text is active
- **FlatList perf props**: `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews`, `initialNumToRender={6}`, `onEndReachedThreshold={0.5}`
- **Home page (`B2CHomeContent.tsx`)**: removed manual "Load More" button, increased auto-load threshold from 300px→600px, reduced `scrollEventThrottle` from 400ms→100ms for seamless infinite scroll
- Synced `schema.ts` + `freelanceServices.ts` to `AItridiv0/convex/`

### APK Build & Update Workflow (April 2026)

**Current preview APK (OTA-enabled):**
- Build: `320e1c79-f19f-4393-a350-3ce267a8ad8b`
- Link: `https://expo.dev/accounts/autonomy.owner/projects/zst-app/builds/320e1c79-f19f-4393-a350-3ce267a8ad8b`
- Channel: `preview`

**Pushing OTA updates (no rebuild needed):**
```bash
cd zst-app
eas update --channel preview --message "description of what changed"
```
- Updates download in background, apply on next app launch
- Works for: JS code, UI, styling, assets, bug fixes (~90% of changes)
- Does NOT work for: new native libraries, permissions, SDK upgrades, app icon changes
- Rollback: `eas update:rollback` to instantly revert a bad update

**When you need a new APK build:**
```bash
# 1. Bump version if adding native deps
# Edit app.json: increment "version" and "versionCode"
# 2. Build
eas build --platform android --profile preview --non-interactive
# 3. Distribute the new APK link to testers
```

**Play Store Submission (not yet done — step-by-step guide):**

1. **Google Play Console** — create developer account ($25 one-time fee) at https://play.google.com/console
2. **Create app** — fill in app name "AI TRIDI", default language Arabic, app type, free/paid
3. **Build production AAB:**
   ```bash
   # Increment versionCode in app.json (must be higher than previous upload)
   eas build --platform android --profile production --non-interactive
   # This produces an .aab file (not .apk) — required by Play Store
   ```
4. **Store listing** (required before first release):
   - App name: "AI TRIDI"
   - Short description (80 chars max, Arabic)
   - Full description (4000 chars max, Arabic)
   - App icon: 512x512 (auto-generated from `assets/icon.png`)
   - Feature graphic: 1024x500 banner (**needs creation**)
   - Screenshots: at least 2 phone screenshots per supported device type
   - Privacy Policy URL: `https://www.aitridi.com/privacy-policy`
5. **Content rating** — fill out the questionnaire (asks about violence, ads, etc.)
6. **Data safety** — declare what data the app collects (email, name, phone, photos)
7. **Target audience** — select age group
8. **Release track** — start with "Internal testing" (up to 100 testers), then "Open testing", then "Production"
9. **Upload AAB** — go to Release > Production > Create new release > Upload the `.aab` file
10. **Review** — Google reviews the app (can take 1-7 days for first submission)

**After Play Store launch — OTA for production:**
```bash
eas update --channel production --message "description"
```

**Version bumping rules:**
- OTA update (JS only): no version change needed
- New native build: increment `versionCode` in `app.json` (Play Store rejects same versionCode)
- Major release: also bump `version` (e.g., "1.0.0" → "1.1.0")

### Dashboard Clear Orders + Production Bug Fixes (April 2026)

**Clear orders features:**
- **Customer dashboard** (`app/(main)/dashboard.tsx`): trash icon in header → `ConfirmModal` (danger) → `orders.clearAllAsBuyer` mutation deletes all buyer's own orders
- **Seller dashboard** (`app/(grociste)/seller-dashboard.tsx`): red "Clear Delivered (N)" pill next to "My Orders" → `orders.clearDeliveredAsSeller` mutation deletes only `delivered` orders where user is seller, returns count
- Both mutations auth-gated via `getAuthenticatedAppUser`; synced to both `zst-app/convex/orders.ts` and `AItridiv0/convex/orders.ts`

**Production bug fixes (found via `npx convex logs --prod --history 1000 --jsonl`):**
1. **`orders:create` "العنوان يجب أن يكون بين 3 و 500 حرف"** — Client/server validation mismatch: `checkout.tsx` only checked non-empty, server required address 3–500 chars. Fix: tightened client validation (name 2–100, address 3–500, city 2–100 to match server), removed generic "Failed to place order" catch override (let `useOrderActions` show the real error toast), made server error messages bilingual EN/AR in `orders.create` + `orders.createWholesaleOrder`
2. **`reels:listComments` "Object is missing the required field paginationOpts"** — Older APK builds calling without paginationOpts. Fix: wrapped validator in `v.optional(paginationOptsValidator)`, added fallback `.take(50)` branch returning `{ page, isDone: true, continueCursor: "" }` shape
3. **`users:clearPushToken` "Not authenticated"** — Sign-out race condition: profile screens called `clearPushToken` during sign-out but session was already cleared. Fix: changed from `throw` to silent `return` when `getAuthenticatedAppUser` returns null

All three fixes synced to both mobile + web convex folders and deployed to production.

### Sentry Release & Source Map Workflow (April 2026)

**Why this matters:** Sentry crash reports from a release with no source maps are useless minified Hermes positions like `app:///index.android.bundle:1:1156403`. Source map upload happens automatically at build time but ONLY if all four pieces below are in place.

**One-time setup (already done):**
1. `metro.config.js` wraps with `getSentryExpoConfig` from `@sentry/react-native/metro` BEFORE `withNativeWind`
2. `app.json` includes the `@sentry/react-native/expo` plugin with `organization` + `project`
3. `eas.json` does NOT set `SENTRY_DISABLE_AUTO_UPLOAD=true` on `preview` or `production`
4. `EXPO_PUBLIC_SENTRY_DSN` is set in every `eas.json` build profile (so the DSN is embedded at build time, not just `.env.local`)

**Per-developer setup (you must do this once):**
```bash
# Create the Sentry auth token: https://sentry.io/settings/account/api/auth-tokens/
# Required scopes: project:releases, project:write
eas secret:create --name SENTRY_AUTH_TOKEN --value <token>
```

**Per-release workflow (you must do this every time):**
1. **Bump `android.versionCode`** in `app.json` (e.g. 2 → 3). Sentry tags releases as `<package>@<version>+<versionCode>`; reusing a versionCode means the new build inherits the previous release's symbols.
2. **Build:** `eas build --platform android --profile production --non-interactive`
3. **Watch the build logs** for `Source maps uploaded successfully` from the Sentry plugin. If missing, the most common cause is a missing or expired `SENTRY_AUTH_TOKEN` EAS secret.
4. **Verify in Sentry:** Settings → Projects → react-native → Source Maps → look for the new release ID with uploaded artifacts.

**Diagnostic guard (`lib/fetchGuard.ts`):** Currently active. Monkey-patches `global.fetch` and `global.URL` so any call with `null`/`undefined`/empty/non-http(s) input captures a named `fetch_guard` / `url_guard` error in Sentry with the real call site BEFORE the underlying URL parser throws. No-op in `__DEV__`. **Remove after the root cause is found and patched** (planned follow-up after 7 days clean on Sentry).

**Hardened runtime config (`lib/sentry.ts`):**
- `release` and `dist` derived from `expo-constants` (`<package>@<version>+<versionCode>`)
- `reactNavigationIntegration` registered in `app/_layout.tsx` via `useNavigationContainerRef` so crashes carry breadcrumbs of the screen the user was on
- `ignoreErrors` filters `Invalid URL: undefined` noise (the `fetchGuard` event still fires *before* this filter, so we keep diagnostic visibility)
- `beforeSend` strips PII from breadcrumb URLs (auth tokens in query strings)
- `tracesSampleRate` lowered to `0.05` in production to fit free Sentry quota
- `Sentry.setUser({ id, email })` called from `hooks/useCurrentUser.ts` on auth resolve, cleared on sign-out

### Grossiste Wholesale Management + Bid Form Fix (April 2026)

**New screens:**
- `app/my-wholesale-products.tsx` — grossiste's own wholesale listings with edit + delete (ConfirmModal danger). Uses `api.wholesaleProducts.listBySupplier` + `remove`.
- `app/edit-wholesale-product.tsx` — mirrors `edit-product.tsx` pattern: `existingImageUrls` vs `newImageUris` split, video picker (existing vs new), `hasLoaded` ref guards pre-fill against requery. Ownership enforced server-side via `wholesaleProducts.update`.

**Dashboard wiring:**
- `app/(grociste)/seller-dashboard.tsx` — Quick Actions show "My Wholesale" for grossistes (replaces "My Products" tile for that role only).
- `app/_layout.tsx` — both new screens registered as stack screens.

**Schema change — wholesaleProducts got `videoUrl`:**
- Before: only `hasVideo: v.optional(v.boolean())` — `create-product.tsx` grossiste flow set the boolean but dropped the actual URL, so videos appeared to upload but never played anywhere.
- Fix: added `videoUrl: v.optional(v.string())` to `wholesaleProducts` in **both** `zst-app/convex/schema.ts` and `AItridiv0/convex/schema.ts`. `create` + `update` mutations in both backends accept `videoUrl`; `hasVideo` auto-set when `videoUrl` is present.
- `app/create-product.tsx` grossiste branch now passes `videoUrl: uploadedVideoUrl`.
- `app/wholesale-product/[id].tsx` passes `videoUrl={product.videoUrl}` to `ImageCarousel` so the detail page plays it.
- **Migration note:** wholesale products created before this fix have no persisted `videoUrl` — re-upload via edit screen to restore.

**Bid form visibility fix:**
- `app/offer/[id].tsx:73` — `canBid` now requires `effectiveRole === "grossiste"` (was `!== "fournisseur"`). Importateurs and customers no longer see the bid form on offer detail; only grossistes do. Backend (`convex/bids.ts:36`) was already grossiste-only — this aligns UI with server rule. Offer creators' own management view (bids list + accept/reject) is gated separately by `isOwnOffer` and is unaffected.

### Importateur Role — Capability Matrix (April 2026)

| Action | Allowed? | Enforced |
|---|---|---|
| Create offer | ✅ | `offers.ts` role check |
| Create demand request | ✅ (importateur or grossiste) | `demandRequests.ts` |
| Respond to demand | ✅ | `demandResponses.ts` |
| Bid on offer | ❌ grossiste-only | `bids.ts:36` + UI hidden |
| Create wholesale product | ❌ grossiste-only | `wholesaleProducts.ts:93` |
| Create B2C product | ✅ | `products.ts` |
| Browse wholesale catalog | ✅ (all B2B roles) | `wholesaleProducts.ts` read guards |

**Outstanding importateur gaps (not blockers, but open):**
- No demand-response → order conversion flow; creator accepts a response, coordination off-platform.
- Some notifications mixed EN/AR (`demandResponses.ts:79` Arabic, others English).
- No importateur-specific dashboard (seller-dashboard is built around order revenue which doesn't apply).
