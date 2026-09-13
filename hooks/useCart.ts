import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@/lib/convex";
import { useRouter } from "expo-router";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useGuest } from "@/providers/GuestProvider";
import { useToast } from "@/providers/ToastProvider";

export function useCart() {
  const { isGuest, exitGuestMode } = useGuest();
  const cartSummary = useQuery(api.cart.getCartSummary, isGuest ? "skip" : undefined);
  const items = cartSummary?.items ?? [];
  const total = cartSummary?.total ?? 0;
  const itemCount = cartSummary?.itemCount ?? 0;
  const addItemMutation = useMutation(api.cart.addItem);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const updateQuantityMutation = useMutation(api.cart.updateQuantity);
  const clearCartMutation = useMutation(api.cart.clear);
  const router = useRouter();
  const { showInfo, showError } = useToast();

  const requireAuth = useCallback((): boolean => {
    if (isGuest) {
      showInfo("Sign in to add items to your cart");
      const timer = setTimeout(() => {
        exitGuestMode();
        router.push("/sign-in");
      }, 1500);
      return false;
    }
    return true;
  }, [isGuest, showInfo, exitGuestMode, router]);

  const addItem = useCallback(async (productId: Id<"products">) => {
    if (!requireAuth()) return;
    try {
      await addItemMutation({ productId });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add item");
    }
  }, [requireAuth, addItemMutation, showError]);

  const removeItem = useCallback(async (productId: Id<"products">) => {
    if (!requireAuth()) return;
    try {
      await removeItemMutation({ productId });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to remove item");
    }
  }, [requireAuth, removeItemMutation, showError]);

  const updateQuantity = useCallback(async (productId: Id<"products">, quantity: number) => {
    if (!requireAuth()) return;
    try {
      await updateQuantityMutation({ productId, quantity });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update quantity");
    }
  }, [requireAuth, updateQuantityMutation, showError]);

  const clearCart = useCallback(async () => {
    if (!requireAuth()) return;
    try {
      await clearCartMutation();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to clear cart");
    }
  }, [requireAuth, clearCartMutation, showError]);

  return useMemo(() => ({
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [items, total, itemCount, addItem, removeItem, updateQuantity, clearCart]);
}
