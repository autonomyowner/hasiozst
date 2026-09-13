import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useGuest } from "@/providers/GuestProvider";
import { useToast } from "@/providers/ToastProvider";

export function useFavorites() {
  const { isGuest, exitGuestMode } = useGuest();
  const favoriteIds = useQuery(api.favorites.list, isGuest ? "skip" as const : undefined) ?? [];
  const toggleMutation = useMutation(api.favorites.toggle);
  const router = useRouter();
  const { showInfo, showError } = useToast();

  const toggleFavorite = useCallback(async (productId: Id<"products">) => {
    if (isGuest) {
      showInfo("Sign in to save your favorites");
      setTimeout(() => {
        exitGuestMode();
        router.push("/sign-in");
      }, 1500);
      return;
    }
    try {
      await toggleMutation({ productId });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update favorite");
    }
  }, [isGuest, showInfo, exitGuestMode, router, toggleMutation, showError]);

  const isFavorite = useCallback(
    (productId: Id<"products">) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  return useMemo(() => ({
    favoriteIds,
    toggleFavorite,
    isFavorite,
  }), [favoriteIds, toggleFavorite, isFavorite]);
}
