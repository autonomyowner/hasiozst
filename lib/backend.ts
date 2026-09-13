/**
 * Backend availability.
 *
 * Hasio is being rebuilt from the inherited AI TRIDI marketplace and is not yet
 * wired to its own Convex deployment. Until it is, the app must still boot and be
 * navigable with no backend at all, so nothing here throws on missing config —
 * the app degrades to a signed-out, data-less shell instead of crashing on import.
 *
 * To turn the backend on, run `npx convex dev` (create a NEW project — never point
 * this repo at the AI TRIDI deployments) and set both variables in `.env.local`.
 */

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "";

export const CONVEX_URL = convexUrl;
export const CONVEX_SITE_URL = convexSiteUrl;

/** True only when both Convex URLs are configured. */
export const BACKEND_ENABLED = convexUrl !== "" && convexSiteUrl !== "";

/**
 * Syntactically valid stand-in so `ConvexReactClient` can still be constructed
 * when no backend is configured. It is never reachable: every `useQuery` simply
 * stays `undefined`, which screens already handle as their loading/empty state.
 */
export const CONVEX_PLACEHOLDER_URL = "https://backend-not-configured.convex.cloud";

/** Shown wherever an action needs a backend that isn't there yet. */
export const BACKEND_DISABLED_MESSAGE =
  "No backend is configured yet — accounts and data are unavailable in this build.";

if (__DEV__ && !BACKEND_ENABLED) {
  console.warn(
    "[hasio] Running without a backend. Sign-in is disabled and all Convex " +
      "queries stay empty. Run `npx convex dev` (create a new project) and fill " +
      "EXPO_PUBLIC_CONVEX_URL / EXPO_PUBLIC_CONVEX_SITE_URL in .env.local."
  );
}
