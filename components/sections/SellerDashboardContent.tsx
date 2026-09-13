import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { QuickActions } from "@/components/sections/QuickActions";
import { ShipOrderSheet } from "@/components/order/ShipOrderSheet";
import type { SellerDashboardStats, FullOrder } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../convex/_generated/dataModel";

interface SellerDashboardContentProps {
  subtitle: string;
  stats: SellerDashboardStats;
  sellerId?: Id<"users">;
}

const statCardStyle = {
  backgroundColor: "rgba(26,75,95,0.14)",
  borderColor: "#5F6E63",
  borderWidth: 1,
  borderRadius: 16,
};

const statusVariant: Record<string, "primary" | "success" | "neutral" | "error"> = {
  pending: "primary",
  processing: "neutral",
  shipped: "success",
  delivered: "neutral",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function SellerDashboardContent({
  subtitle,
  stats,
  sellerId,
}: SellerDashboardContentProps) {
  const router = useRouter();
  const { sellerOrders } = useOrders();
  const deliverySettings = useQuery(api.delivery.getMySettings, {});
  const [shipTarget, setShipTarget] = useState<FullOrder | null>(null);
  const pendingCount = sellerOrders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;
  const hasDeliverySettings = (deliverySettings ?? []).length > 0;
  const processingOrders = sellerOrders.filter((o) => o.status === "processing");

  const quickActions = [
    {
      label: "Add Product",
      description: "List a new product for sale",
      onPress: () => router.push("/create-product"),
    },
    {
      label: "View Orders",
      description: "Check recent orders",
      onPress: () => router.push("/my-orders"),
    },
    {
      label: "My Products",
      description: "Manage your listings",
      onPress: () => router.push("/my-products"),
    },
    {
      label: "My Ads",
      description: "Manage your promotions",
      onPress: () => router.push("/my-ads"),
    },
    {
      label: "My Shipments",
      description: "Track your deliveries",
      onPress: () => router.push("/my-shipments"),
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with yellow underline */}
        <View className="px-4 pt-2 pb-1">
          <Text className="font-mont-bold text-xl text-text-primary">
            My Dashboard
          </Text>
          <View className="mt-1 h-0.5 w-10 bg-primary rounded-full" />
          <Text className="font-mont text-sm text-text-secondary mt-1">
            {subtitle}
          </Text>
        </View>

        {/* Stats Card */}
        <View className="mx-4 mt-3">
          <View className="p-4" style={statCardStyle}>
            <Text className="font-mont text-sm text-text-secondary">
              Total Revenue
            </Text>
            <Text className="mt-1 font-mont-bold text-2xl text-primary">
              {formatPrice(stats.totalRevenue)}
            </Text>
            {stats.growth > 0 && (
              <Text className="mt-0.5 font-mont text-xs text-success">
                +{stats.growth}% this month
              </Text>
            )}
          </View>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 p-4" style={statCardStyle}>
              <Text className="font-mont text-xs text-text-secondary">
                Total Orders
              </Text>
              <Text className="mt-1 font-mont-bold text-xl text-text-primary">
                {stats.totalOrders}
              </Text>
            </View>
            <View className="flex-1 p-4" style={statCardStyle}>
              <Text className="font-mont text-xs text-text-secondary">
                Active Products
              </Text>
              <Text className="mt-1 font-mont-bold text-xl text-text-primary">
                {stats.activeProducts}
              </Text>
            </View>
          </View>
          <View className="mt-3 p-4" style={statCardStyle}>
            <Text className="font-mont text-xs text-text-secondary">
              Pending Orders
            </Text>
            <Text className="mt-1 font-mont-bold text-xl text-primary">
              {sellerId ? pendingCount : stats.pendingOrders}
            </Text>
          </View>
        </View>

        {/* Wholesale Browse Banner */}
        <Pressable
          onPress={() => router.push("/wholesale-browse")}
          className="mx-4 mt-4 rounded-card overflow-hidden active:opacity-80"
          style={{
            backgroundColor: "rgba(26,75,95,0.08)",
            borderWidth: 1,
            borderColor: "rgba(26,75,95,0.2)",
            borderRadius: 16,
          }}
        >
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="font-mont-bold text-base text-text-primary">
                Browse Wholesale
              </Text>
              <Text className="font-mont text-xs text-text-secondary mt-1">
                Discover B2B products from wholesalers and importers
              </Text>
            </View>
            <View
              className="h-10 w-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(26,75,95,0.15)" }}
            >
              <Ionicons name="storefront-outline" size={20} color="#1A4B5F" />
            </View>
          </View>
        </Pressable>

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Recent Orders with Ship Button */}
        {sellerOrders.length > 0 && (
          <View className="mx-4 mt-4">
            <Text className="font-mont-bold text-lg text-text-primary mb-3">
              My Orders
            </Text>
            {sellerOrders.map((order) => (
              <Pressable
                key={order._id}
                onPress={() => router.push(`/order/${order._id}`)}
                className="mb-2 rounded-card bg-card p-3 active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-mont-medium text-sm text-text-primary">
                      {order._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text className="font-mont text-xs text-text-secondary mt-0.5">
                      {formatDate(order.createdAt)} - {order.itemCount} items
                    </Text>
                  </View>
                  <View className="items-end">
                    <Badge
                      label={statusLabel[order.status] ?? order.status}
                      variant={statusVariant[order.status] ?? "neutral"}
                    />
                    <Text className="font-mont-bold text-sm text-primary mt-1">
                      {formatPrice(order.total)}
                    </Text>
                  </View>
                </View>
                {/* Ship button for processing orders */}
                {order.status === "processing" && hasDeliverySettings && !order.trackingNumber && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setShipTarget(order);
                    }}
                    className="mt-2 flex-row items-center justify-center rounded-[12px] bg-primary/15 border border-primary/30 py-2.5"
                  >
                    <Ionicons name="car-outline" size={16} color="#1A4B5F" />
                    <Text className="font-mont-semibold text-sm text-primary ml-2">
                      شحن مع شركة توصيل
                    </Text>
                  </Pressable>
                )}
                {/* Show tracking number if shipped */}
                {order.trackingNumber && (
                  <View className="mt-2 flex-row items-center bg-success/10 rounded-[10px] px-3 py-1.5">
                    <Ionicons name="locate-outline" size={14} color="#1F9D55" />
                    <Text className="font-mont-medium text-xs text-success ml-1.5">
                      {order.trackingNumber}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ship Order Sheet */}
      {shipTarget && (
        <ShipOrderSheet
          visible={!!shipTarget}
          onClose={() => setShipTarget(null)}
          order={shipTarget}
          deliverySettings={deliverySettings ?? []}
        />
      )}
    </ScreenContainer>
  );
}
