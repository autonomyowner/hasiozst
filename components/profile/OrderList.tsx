import { memo, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FullOrder } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";

interface OrderListProps {
  orders: FullOrder[];
}

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

const OrderCard = memo(function OrderCard({ order, onPress }: { order: FullOrder; onPress: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => onPress(order._id)}
      className="mb-2 rounded-card bg-card p-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-mont-medium text-sm text-text-primary">
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
          <View className="flex-row items-center bg-success/10 rounded-[10px] px-3 py-1.5">
            <Ionicons name="locate-outline" size={12} color="#1F9D55" />
            <Text className="font-mont-medium text-[10px] text-success ml-1">
              {order.trackingNumber}
            </Text>
          </View>
          {order.deliveryProvider && (
            <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: "rgba(26,75,95,0.12)" }}>
              <Text className="font-mont text-[10px] text-primary">
                {order.deliveryProvider}
              </Text>
            </View>
          )}
          SAR {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <Text className="font-mont text-[10px] text-text-secondary">
              {order.deliveryFee.toLocaleString("en-US")}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
});

export function OrderList({ orders }: OrderListProps) {
  const router = useRouter();

  const handlePress = useCallback((id: string) => {
    router.push(`/order/${id}`);
  }, [router]);

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      maxToRenderPerBatch={10}
      windowSize={5}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      renderItem={({ item }) => <OrderCard order={item} onPress={handlePress} />}
    />
  );
}
