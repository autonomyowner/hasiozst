import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCurrentUser } from "./useCurrentUser";

export interface SellerProfileStats {
  completionRate: number;
  ordersLast30Days: number;
  responseTimeMinutes: number;
  revenueThisMonth: number;
}

export function useSellerStats(): SellerProfileStats & { isLoading: boolean } {
  const { isAuthenticated } = useCurrentUser();
  const stats = useQuery(api.orders.getSellerStats, !isAuthenticated ? "skip" as const : undefined);
  const isLoading = isAuthenticated && stats === undefined;

  return {
    completionRate: stats
      ? Math.min(100, Math.round(((stats.deliveredOrders ?? 0) / Math.max(stats.totalOrders, 1)) * 100))
      : 0,
    ordersLast30Days: stats?.totalOrders ?? 0,
    responseTimeMinutes: 0,
    revenueThisMonth: stats?.totalRevenue ?? 0,
    isLoading,
  };
}
