import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useDemo } from "@/lib/useDemo";
import { demoStays } from "@/lib/demoContent";

/**
 * Listings (stays & experiences).
 *
 * Each hook falls back to the bundled demo set while no backend is configured,
 * so a tapped card opens a real detail screen instead of spinning forever.
 * See `lib/useDemo.ts`.
 */

export function useProducts(category?: string) {
  const live = useQuery(api.products.list, category ? { category } : {});
  const demo =
    !category || category === "all"
      ? demoStays
      : demoStays.filter((p) => p.category === category);
  return useDemo(live, demo) ?? [];
}

export function useFreshPicks() {
  return useDemo(useQuery(api.products.freshPicks), demoStays.filter((p) => p.isNew)) ?? [];
}

export function useSupplierSpecials() {
  const topRated = [...demoStays].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6);
  return useDemo(useQuery(api.products.supplierSpecials), topRated) ?? [];
}

export function useProduct(id: string) {
  const live = useQuery(api.products.getById, { id: id as Id<"products"> });
  // `getById` joins the host onto the row, so the demo record has to match that
  // shape. `null` (not `undefined`) so the detail screen shows "not found"
  // rather than an endless spinner when a demo id does not exist.
  const found = demoStays.find((p) => p._id === id);
  const demo = found ? { ...found, supplierAvatar: found.imageUrl } : null;
  return useDemo(live, demo);
}

export function useWholesaleProduct(id: string) {
  return useQuery(api.wholesaleProducts.getById, { id: id as Id<"wholesaleProducts"> });
}
