import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type EventType =
  | "product_view"
  | "reel_view"
  | "reel_watch"
  | "service_view"
  | "search_query"
  | "category_browse"
  | "add_to_cart"
  | "purchase"
  | "favorite_add"
  | "reel_like"
  | "reel_comment"
  | "reel_share"
  | "service_request"
  | "promotion_view"
  | "promotion_click";

interface TrackEventArgs {
  eventType: EventType;
  targetProductId?: Id<"products">;
  targetReelId?: Id<"reels">;
  targetServiceId?: Id<"freelanceServices">;
  category?: string;
  searchQuery?: string;
  durationMs?: number;
  pricePoint?: number;
}

/**
 * Fire-and-forget tracking hook for user behavior events.
 * Safe to call for guests — the backend silently skips unauthenticated users.
 */
export function useTracking() {
  const trackEventMutation = useMutation(api.tracking.trackEvent);

  const trackEvent = useCallback(
    (args: TrackEventArgs) => {
      // Fire-and-forget: don't await, don't block UI
      trackEventMutation(args).catch(() => {
        // Silently ignore — tracking should never break the app
      });
    },
    [trackEventMutation]
  );

  return { trackEvent };
}
