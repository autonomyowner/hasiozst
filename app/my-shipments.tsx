import { useState, useMemo } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, Share } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Badge } from "@/components/ui/Badge";

const filters = [
  { key: "all", label: "الكل" },
  { key: "processing", label: "قيد المعالجة" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التسليم" },
] as const;

const statusVariant: Record<string, "primary" | "success" | "neutral" | "error"> = {
  processing: "primary",
  shipped: "success",
  delivered: "success",
  failed: "error",
};

const statusLabel: Record<string, string> = {
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  failed: "فشل التوصيل",
};

const providerLabel: Record<string, string> = {
  yalidine: "Yalidine",
  maystro: "Maystro",
  zrexpress: "ZR Express",
};

export default function MyShipmentsScreen() {
  const router = useRouter();
  const shipments = useQuery(api.delivery.listShipmentsBySeller, {});
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!shipments) return [];
    if (activeFilter === "all") return shipments;
    return shipments.filter((s) => s.mappedOrderStatus === activeFilter);
  }, [shipments, activeFilter]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-1 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-white">شحناتي</Text>
      </View>

      {/* Filter tabs */}
      <View className="px-4 mt-3 mb-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveFilter(item.key)}
              className="rounded-pill px-4 py-2"
              style={{
                backgroundColor:
                  activeFilter === item.key
                    ? "#FFD400"
                    : "rgba(169,169,169,0.15)",
              }}
            >
              <Text
                className="font-mont-semibold text-xs"
                style={{
                  color: activeFilter === item.key ? "#000" : "#898989",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Content */}
      {shipments === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cube-outline" size={48} color="#898989" />
          <Text className="font-mont-semibold text-base text-white mt-4">
            لا توجد شحنات بعد
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-1 text-center">
            قم بإعداد شركة التوصيل وابدأ شحن طلباتك
          </Text>
          <Pressable
            onPress={() => router.push("/delivery-settings")}
            className="mt-4 rounded-pill border border-primary px-5 py-2.5"
          >
            <Text className="font-mont-semibold text-sm text-primary">
              إعدادات التوصيل
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/order/${item.orderId}`)}
              className="mb-3 rounded-card bg-card p-4 active:opacity-80"
              style={{ borderWidth: 1, borderColor: "#333" }}
            >
              {/* Tracking number + provider */}
              <View className="flex-row items-center justify-between mb-2">
                <Pressable
                  onPress={() =>
                    Share.share({ message: item.trackingNumber })
                  }
                  className="flex-row items-center flex-1 mr-2"
                >
                  <Ionicons name="locate-outline" size={14} color="#fff" />
                  <Text
                    className="font-mont-bold text-sm text-white ml-1.5"
                    selectable
                  >
                    {item.trackingNumber}
                  </Text>
                </Pressable>
                <View
                  className="rounded-pill px-2.5 py-1"
                  style={{ backgroundColor: "rgba(255,212,0,0.15)" }}
                >
                  <Text className="font-mont-semibold text-[10px] text-primary">
                    {providerLabel[item.provider] ?? item.provider}
                  </Text>
                </View>
              </View>

              {/* Status badge + provider raw status */}
              <View className="flex-row items-center mb-2">
                <Badge
                  label={statusLabel[item.mappedOrderStatus] ?? item.mappedOrderStatus}
                  variant={statusVariant[item.mappedOrderStatus] ?? "neutral"}
                />
                {item.providerStatus && (
                  <Text className="font-mont text-[10px] text-text-secondary ml-2">
                    {item.providerStatus}
                  </Text>
                )}
              </View>

              {/* Delivery type + fee */}
              <View className="flex-row items-center" style={{ gap: 8 }}>
                {item.isStopDesk !== undefined && (
                  <View
                    className="rounded-pill px-2 py-0.5"
                    style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
                  >
                    <Text className="font-mont text-[10px] text-text-secondary">
                      {item.isStopDesk ? "Stop Desk" : "Home"}
                    </Text>
                  </View>
                )}
                {item.deliveryFee !== undefined && item.deliveryFee > 0 && (
                  <Text className="font-mont text-[10px] text-text-secondary">
                    {item.deliveryFee.toLocaleString("fr-DZ")} DA
                  </Text>
                )}
                <View className="flex-1" />
                <Text className="font-mont text-[10px] text-text-secondary">
                  {new Date(item.lastCheckedAt).toLocaleDateString("fr-DZ")}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
