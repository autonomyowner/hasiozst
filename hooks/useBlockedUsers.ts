import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Returns a Set of user IDs the current user has blocked. Empty set when
 * loading or when the user is unauthenticated. Use to filter UGC feeds and
 * comment lists client-side.
 */
export function useBlockedUsers(): Set<Id<"users">> {
  const blocked = useQuery(api.blocks.listBlockedIds);
  return useMemo(() => new Set(blocked ?? []), [blocked]);
}
