import { BACKEND_ENABLED } from "./backend";

/**
 * Substitutes bundled demo content while no backend is configured.
 *
 * With `BACKEND_ENABLED` false every Convex query resolves to `undefined`
 * (see `lib/convex.ts`), which would leave the whole app empty. Wrapping a query
 * result here swaps in the matching fixture from `lib/demoContent.ts` so the MVP
 * is demoable, and becomes a pass-through the moment a real deployment exists.
 *
 * Not a hook — no hook rules apply — but named `useDemo` because it reads
 * naturally at the call sites, which are all inside components.
 */
export function useDemo<T>(live: T | undefined, demo: T): T | undefined {
  return BACKEND_ENABLED ? live : demo;
}
