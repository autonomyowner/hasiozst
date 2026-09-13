/**
 * Convex hooks, wrapped so the app works with no backend configured.
 *
 * Import `useQuery` / `usePaginatedQuery` from here rather than from `convex/react`
 * directly. When `BACKEND_ENABLED` is false these pass `"skip"` through to Convex,
 * so no subscription is ever opened and the client never tries to reach a host that
 * isn't there. Screens see `undefined` / empty pages — the loading-and-empty states
 * they already handle — instead of an endless reconnect loop.
 *
 * `useMutation` / `useAction` are re-exported untouched: calling one without a
 * backend rejects, and the call sites already catch and surface that via toast.
 */
import {
  useQuery as useConvexQuery,
  usePaginatedQuery as useConvexPaginatedQuery,
} from "convex/react";
import { BACKEND_ENABLED } from "./backend";

export { useMutation, useAction, useConvex } from "convex/react";
export type { PaginatedQueryReference } from "convex/react";

export const useQuery = ((query: unknown, ...args: unknown[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useConvexQuery as any)(query, ...(BACKEND_ENABLED ? args : ["skip"]))) as typeof useConvexQuery;

export const usePaginatedQuery = ((
  query: unknown,
  args: unknown,
  options: unknown
) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useConvexPaginatedQuery as any)(
    query,
    BACKEND_ENABLED ? args : "skip",
    options
  )) as typeof useConvexPaginatedQuery;
