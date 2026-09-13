import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useProducts(category?: string) {
  const products = useQuery(api.products.list, category ? { category } : {}) ?? [];
  return products;
}

export function useFreshPicks() {
  return useQuery(api.products.freshPicks) ?? [];
}

export function useSupplierSpecials() {
  return useQuery(api.products.supplierSpecials) ?? [];
}

export function useProduct(id: string) {
  return useQuery(api.products.getById, { id: id as Id<"products"> });
}

export function useWholesaleProduct(id: string) {
  return useQuery(api.wholesaleProducts.getById, { id: id as Id<"wholesaleProducts"> });
}
