import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { DashboardStats } from "@/components/sections/DashboardStats";
import { QuickActions } from "@/components/sections/QuickActions";
import { RecentRequests } from "@/components/sections/RecentRequests";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { GuestSignInPrompt } from "@/components/ui/GuestSignInPrompt";
import { useUserRole } from "@/hooks/useUserRole";
import { useGuest } from "@/providers/GuestProvider";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/providers/ToastProvider";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { OrderStatus } from "@/lib/types";

type TabFilter = "all" | "services" | "demandes";
type OrderFilter = "all" | OrderStatus;

const ORDER_FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

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

function CustomerDashboard() {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();
  const { buyerOrders, isLoading } = useOrders();
  const clearAllAsBuyer = useMutation(api.orders.clearAllAsBuyer);
  const { showSuccess, showError } = useToast();

  const handleClearAll = async () => {
    setShowClearModal(false);
    try {
      await clearAllAsBuyer();
      showSuccess("Orders cleared");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to clear orders");
    }
  };

  const activeCount = useMemo(
    () => buyerOrders.filter((o) => o.status === "pending" || o.status === "processing" || o.status === "shipped").length,
    [buyerOrders]
  );

  const filteredOrders = useMemo(
    () => filter === "all" ? buyerOrders : buyerOrders.filter((o) => o.status === filter),
    [buyerOrders, filter]
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-1 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-mont-bold text-xl text-white">My Orders</Text>
            <View className="mt-1 h-0.5 w-10 bg-primary rounded-full" />
            <Text className="font-mont text-sm text-text-secondary mt-1">
              Track your orders
            </Text>
          </View>
          {buyerOrders.length > 0 && (
            <Pressable
              onPress={() => setShowClearModal(true)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row mx-4 mt-3 gap-3">
          <View className="flex-1 rounded-card bg-card p-3">
            <Text className="font-mont text-xs text-text-secondary">Total Orders</Text>
            <Text className="font-mont-bold text-2xl text-white mt-1">
              {buyerOrders.length}
            </Text>
          </View>
          <View className="flex-1 rounded-card bg-card p-3">
            <Text className="font-mont text-xs text-text-secondary">Active</Text>
            <Text className="font-mont-bold text-2xl text-primary mt-1">
              {activeCount}
            </Text>
          </View>
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 px-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {ORDER_FILTERS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              className={`rounded-pill px-4 py-2 ${
                filter === tab.key ? "bg-primary" : "bg-card"
              }`}
            >
              <Text
                className={`font-mont-semibold text-xs ${
                  filter === tab.key ? "text-black" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Order list */}
        {filteredOrders.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="bag-outline" size={48} color="#898989" />
            <Text className="font-mont text-sm text-text-secondary mt-3">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </Text>
            {filter === "all" && (
              <Pressable
                onPress={() => router.push("/(main)/home")}
                className="mt-4 rounded-pill bg-primary px-6 py-2.5"
              >
                <Text className="font-mont-semibold text-sm text-black">
                  Start Shopping
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View className="mx-4 mt-3 pb-4">
            {filteredOrders.map((order) => (
              <Pressable
                key={order._id}
                onPress={() => router.push(`/order/${order._id}`)}
                className="mb-2 rounded-card bg-card p-3 active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-mont-medium text-sm text-white">
                      Order #{order._id.slice(-6).toUpperCase()}
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
                {order.trackingNumber && (
                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row items-center bg-[#22C55E]/10 rounded-[10px] px-3 py-1.5">
                      <Ionicons name="locate-outline" size={12} color="#22C55E" />
                      <Text className="font-mont-medium text-[10px] text-[#22C55E] ml-1">
                        {order.trackingNumber}
                      </Text>
                    </View>
                    {order.deliveryProvider && (
                      <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: "rgba(255,212,0,0.12)" }}>
                        <Text className="font-mont text-[10px] text-primary">
                          {order.deliveryProvider}
                        </Text>
                      </View>
                    )}
                    {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                      <Text className="font-mont text-[10px] text-text-secondary">
                        {order.deliveryFee.toLocaleString("fr-DZ")} DA
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showClearModal}
        title="Clear All Orders"
        message="This will permanently delete all your orders from your dashboard. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </ScreenContainer>
  );
}

export default function DashboardScreen() {
  const { isGuest } = useGuest();
  const { effectiveRole } = useUserRole();

  if (isGuest) {
    return <GuestSignInPrompt message="Sign in to view your orders and manage your dashboard" />;
  }

  if (effectiveRole === "customer") return <CustomerDashboard />;

  return <FreelancerDashboard />;
}

function FreelancerDashboard() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const router = useRouter();
  const rawDemandRequests = useQuery(api.demandRequests.list);
  const freelancerStats = useQuery(api.freelanceServices.getFreelancerStats);
  const demandRequests = rawDemandRequests ?? [];

  if (rawDemandRequests === undefined || freelancerStats === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  const stats = {
    totalRevenue: freelancerStats?.totalRevenue ?? 0,
    growth: 0,
    activeServices: freelancerStats?.activeServices ?? 0,
    pendingRequests: freelancerStats?.pendingRequests ?? 0,
    completedProjects: freelancerStats?.completedProjects ?? 0,
    ongoingProjects: freelancerStats?.ongoingProjects ?? 0,
    revenueThisMonth: freelancerStats?.revenueThisMonth ?? 0,
    completedThisMonth: freelancerStats?.completedThisMonth ?? 0,
    servicesThisMonth: freelancerStats?.servicesThisMonth ?? 0,
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "services", label: "Services" },
    { key: "demandes", label: "Demandes" },
  ];

  const filteredRequests = demandRequests.filter((req) => {
    if (activeTab === "all") return true;
    if (activeTab === "services")
      return req.status === "in_progress" || req.status === "completed";
    if (activeTab === "demandes") return req.status === "new";
    return true;
  });

  const quickActions = [
    {
      label: "New Service",
      description: "Add a new service to your portfolio and attract clients",
      icon: "add-circle-outline" as const,
      onPress: () => router.push("/create-service"),
    },
    {
      label: "Demandes",
      description: "Check client requests and respond quickly",
      icon: "document-text-outline" as const,
      onPress: () => router.push("/client-requests"),
    },
    {
      label: "Mes Services",
      description: "Manage your active services and track performance",
      icon: "grid-outline" as const,
      onPress: () => router.push("/services"),
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
            Overview of your freelance activity
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
          <Text className="font-mont text-xs text-text-secondary mt-1">
            Check out new client offers and find your next project.
          </Text>
          <Pressable
            onPress={() => router.push("/notifications")}
            className="mt-2 self-end flex-row items-center rounded-pill border border-primary px-4 py-1.5"
          >
            <Text className="font-mont-semibold text-xs text-primary">
              View Offers
            </Text>
            <Text className="text-primary ml-1">→</Text>
          </Pressable>
        </View>

        {/* Tab filter with yellow underline */}
        <View className="mx-4 mt-4 flex-row">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="mr-6 py-2"
            >
              <Text
                className={`font-mont-semibold text-sm ${
                  activeTab === tab.key ? "text-white" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View className="mt-1 h-0.5 w-full bg-primary rounded-full" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Recent Requests */}
        <RecentRequests requests={filteredRequests} />
      </ScrollView>
    </ScreenContainer>
  );
}
