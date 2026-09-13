import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { QuickActions } from "@/components/sections/QuickActions";
import { OfferCard } from "@/components/cards/OfferCard";
import { ShipOrderSheet } from "@/components/order/ShipOrderSheet";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrders } from "@/hooks/useOrders";
import { useOffers } from "@/hooks/useOffers";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/providers/ToastProvider";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { FullOrder } from "@/lib/types";

const statCardStyle = {
  backgroundColor: "rgba(169,169,169,0.18)",
  borderColor: "#666",
  borderWidth: 1,
  borderRadius: 16,
};

const statusVariant: Record<string, "primary" | "success" | "neutral" | "error"> = {
  pending: "primary",
  processing: "neutral",
  shipped: "success",
  delivered: "neutral",
};

const statusLabelMap: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function GrocisteSellerDashboardScreen() {
  const { effectiveRole } = useUserRole();
  const { sellerOrders } = useOrders();
  const { myOffers } = useOffers();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [shipTarget, setShipTarget] = useState<FullOrder | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const clearDelivered = useMutation(api.orders.clearDeliveredAsSeller);
  const { showSuccess, showError } = useToast();

  const deliveredCount = sellerOrders.filter((o) => o.status === "delivered").length;

  const handleClearDelivered = async () => {
    setShowClearModal(false);
    try {
      const count = await clearDelivered();
      showSuccess(`Cleared ${count} delivered order${count !== 1 ? "s" : ""}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to clear orders");
    }
  };

  const sellerStats = useQuery(api.orders.getSellerStats);
  const activeProducts = useQuery(api.products.countBySeller);
  const deliverySettings = useQuery(api.delivery.getMySettings, {});
  const hasDeliverySettings = (deliverySettings ?? []).length > 0;

  if (sellerStats === undefined || activeProducts === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  const subtitle =
    effectiveRole === "grossiste" ? "Wholesaler Panel" : effectiveRole === "fournisseur" ? "Retailer Panel" : "Importer Panel";

  const activeOffers = myOffers.filter((o) => o.status === "open");
  const totalBids = myOffers.reduce((sum, o) => sum + o.bidCount, 0);
  const pendingCount = sellerOrders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;

  const totalRevenue = sellerStats?.totalRevenue ?? 0;
  const totalOrders = sellerStats?.totalOrders ?? 0;

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
    ...(effectiveRole === "grossiste"
      ? [
          {
            label: "My Wholesale",
            description: "Manage wholesale listings",
            onPress: () => router.push("/my-wholesale-products"),
          },
        ]
      : [
          {
            label: "My Products",
            description: "Manage your listings",
            onPress: () => router.push("/my-products"),
          },
        ]),
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
          <Text className="font-mont-bold text-xl text-white">
            My Dashboard
          </Text>
          <View className="mt-1 h-0.5 w-10 bg-primary rounded-full" />
          <Text className="font-mont text-sm text-text-secondary mt-1">
            {subtitle}
          </Text>
        </View>

        {/* Opportunity banner */}
        <View
          className="mx-4 mt-3 rounded-card p-4"
          style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
        >
          <Text className="font-mont-semibold text-sm text-white">
            Ready for Your Next Opportunity?
          </Text>
          <Pressable
            onPress={() => router.push("/(grociste)/demandes")}
            className="mt-2 self-start rounded-pill border border-primary px-4 py-1.5"
          >
            <Text className="font-mont-semibold text-xs text-primary">
              Voir Offre
            </Text>
          </Pressable>
        </View>

        {/* Revenue Stats */}
        <View className="mx-4 mt-3">
          <View className="p-4" style={statCardStyle}>
            <Text className="font-mont text-sm text-text-secondary">
              Total Revenue
            </Text>
            <Text className="mt-1 font-mont-bold text-2xl text-primary">
              {formatPrice(totalRevenue)}
            </Text>
          </View>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 p-4" style={statCardStyle}>
              <Text className="font-mont text-xs text-text-secondary">
                Total Orders
              </Text>
              <Text className="mt-1 font-mont-bold text-xl text-white">
                {totalOrders}
              </Text>
            </View>
            <View className="flex-1 p-4" style={statCardStyle}>
              <Text className="font-mont text-xs text-text-secondary">
                Pending Orders
              </Text>
              <Text className="mt-1 font-mont-bold text-xl text-primary">
                {pendingCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Offer Stats */}
        <View className="mx-4 mt-3 flex-row gap-3">
          <View className="flex-1 p-4" style={statCardStyle}>
            <Text className="font-mont text-xs text-text-secondary">
              Active Offers
            </Text>
            <Text className="mt-1 font-mont-bold text-xl text-primary">
              {activeOffers.length}
            </Text>
          </View>
          <View className="flex-1 p-4" style={statCardStyle}>
            <Text className="font-mont text-xs text-text-secondary">
              Total Bids
            </Text>
            <Text className="mt-1 font-mont-bold text-xl text-white">
              {totalBids}
            </Text>
          </View>
        </View>

        {/* Notifications link */}
        <Pressable
          onPress={() => router.push("/notifications")}
          className="mx-4 mt-3 rounded-card p-4 flex-row items-center justify-between"
          style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
        >
          <Text className="font-mont-medium text-sm text-white">
            Notifications
          </Text>
          <View className="flex-row items-center">
            {unreadCount > 0 && (
              <View className="bg-primary rounded-full px-2 py-0.5 mr-2">
                <Text className="font-mont-bold text-xs text-black">
                  {unreadCount}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="#898989" />
          </View>
        </Pressable>

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* My Offers */}
        {myOffers.length > 0 && (
          <View className="mt-4">
            <View className="mx-4 mb-3">
              <Text className="font-mont-bold text-lg text-white">
                My Offers
              </Text>
            </View>
            {myOffers.slice(0, 3).map((offer) => (
              <OfferCard key={offer._id} offer={offer} />
            ))}
          </View>
        )}

        {/* Recent Orders with Ship Button */}
        {sellerOrders.length > 0 && (
          <View className="mx-4 mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-mont-bold text-lg text-white">
                My Orders
              </Text>
              {deliveredCount > 0 && (
                <Pressable
                  onPress={() => setShowClearModal(true)}
                  hitSlop={8}
                  className="flex-row items-center rounded-pill bg-card px-3 py-1.5 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text className="font-mont-semibold text-xs text-[#EF4444] ml-1.5">
                    Clear Delivered ({deliveredCount})
                  </Text>
                </Pressable>
              )}
            </View>
            {sellerOrders.map((order) => (
              <Pressable
                key={order._id}
                onPress={() => router.push(`/order/${order._id}`)}
                className="mb-2 rounded-card bg-card p-3 active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-mont-medium text-sm text-white">
                      {order._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text className="font-mont text-xs text-text-secondary mt-0.5">
                      {formatDate(order.createdAt)} - {order.itemCount} items
                    </Text>
                  </View>
                  <View className="items-end">
                    <Badge
                      label={statusLabelMap[order.status] ?? order.status}
                      variant={statusVariant[order.status] ?? "neutral"}
                    />
                    <Text className="font-mont-bold text-sm text-primary mt-1">
                      {formatPrice(order.total)}
                    </Text>
                  </View>
                </View>
                {order.status === "processing" && hasDeliverySettings && !order.trackingNumber && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setShipTarget(order);
                    }}
                    className="mt-2 flex-row items-center justify-center rounded-[12px] bg-primary/15 border border-primary/30 py-2.5"
                  >
                    <Ionicons name="car-outline" size={16} color="#FFD400" />
                    <Text className="font-mont-semibold text-sm text-primary ml-2">
                      شحن مع شركة توصيل
                    </Text>
                  </Pressable>
                )}
                {order.trackingNumber && (
                  <View className="mt-2 flex-row items-center bg-[#22C55E]/10 rounded-[10px] px-3 py-1.5">
                    <Ionicons name="locate-outline" size={14} color="#22C55E" />
                    <Text className="font-mont-medium text-xs text-[#22C55E] ml-1.5">
                      {order.trackingNumber}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View className="h-6" />
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

      <ConfirmModal
        visible={showClearModal}
        title="Clear Delivered Orders"
        message={`This will permanently remove ${deliveredCount} delivered order${deliveredCount !== 1 ? "s" : ""} from your dashboard. This action cannot be undone.`}
        confirmLabel="Clear"
        variant="danger"
        onConfirm={handleClearDelivered}
        onCancel={() => setShowClearModal(false)}
      />
    </ScreenContainer>
  );
}
