import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

export function useOrders() {
  const { isAuthenticated } = useCurrentUser();
  const skip = !isAuthenticated ? "skip" as const : undefined;
  const rawBuyer = useQuery(api.orders.listByBuyer, skip);
  const rawSeller = useQuery(api.orders.listBySeller, skip);
  const buyerOrders = rawBuyer ?? [];
  const sellerOrders = rawSeller ?? [];

  return {
    buyerOrders,
    sellerOrders,
    isLoading: isAuthenticated && (rawBuyer === undefined || rawSeller === undefined),
    getOrderById: (id: string) => {
      return [...buyerOrders, ...sellerOrders].find((o) => o._id === id);
    },
    getOrdersByBuyer: () => buyerOrders,
    getOrdersBySeller: () => sellerOrders,
  };
}

export function useOrder(id: string) {
  return useQuery(api.orders.getById, { id: id as Id<"orders"> });
}
