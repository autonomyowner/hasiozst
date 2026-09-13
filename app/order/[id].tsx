import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useOrder } from "@/hooks/useOrders";
import { useOrderActions } from "@/hooks/useOrderActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { formatPrice, formatDate } from "@/lib/formatters";
import TrackingTimeline from "@/components/order/TrackingTimeline";
import type { OrderStatus } from "@/lib/types";

const statusSteps: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useOrder(id ?? "");
  const { advanceOrderStatus } = useOrderActions();
  const { user } = useCurrentUser();
  const { getOrCreate } = useConversations();
  const shipment = useQuery(
    api.delivery.getShipmentByOrder,
    id ? { orderId: id as Id<"orders"> } : "skip"
  );

  if (order === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  if (!order) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="font-mont-medium text-base text-text-secondary">
            Order not found
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isSeller = user?._id === order.sellerId;
  const canAdvance = isSeller && order.status !== "delivered";
  const nextStatus = canAdvance ? statusSteps[currentStepIndex + 1] : undefined;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mb-2"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-white">
            Order {order._id.slice(-6).toUpperCase()}
          </Text>
          <Text className="font-mont text-sm text-text-secondary">
            Placed {formatDate(order.createdAt)}
          </Text>
        </View>

        {/* Status Timeline */}
        <View className="mx-4 rounded-card bg-card p-4">
          <Text className="font-mont-semibold text-sm text-white mb-4">
            Order Status
          </Text>
          <View className="flex-row items-center justify-between">
            {statusSteps.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const dotColor = isPast
                ? "bg-green-500"
                : isCurrent
                  ? "bg-primary"
                  : "bg-zinc-600";
              const textColor = isPast
                ? "text-green-500"
                : isCurrent
                  ? "text-primary"
                  : "text-text-secondary";
              const lineColor =
                index < currentStepIndex ? "bg-green-500" : "bg-zinc-600";

              return (
                <View key={step} className="flex-1 items-center">
                  <View className="flex-row items-center w-full">
                    {index > 0 && (
                      <View className={`flex-1 h-0.5 ${lineColor}`} />
                    )}
                    <View className={`w-3 h-3 rounded-full ${dotColor}`} />
                    {index < statusSteps.length - 1 && (
                      <View className={`flex-1 h-0.5 ${index < currentStepIndex ? "bg-green-500" : "bg-zinc-600"}`} />
                    )}
                  </View>
                  <Text className={`font-mont text-[10px] mt-1.5 ${textColor}`}>
                    {statusLabel[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Tracking */}
        {shipment && (
          <View className="mx-4 mt-3">
            <TrackingTimeline
              trackingNumber={shipment.trackingNumber}
              provider={shipment.provider}
              providerStatus={shipment.providerStatus}
              mappedOrderStatus={shipment.mappedOrderStatus}
              history={shipment.history}
              isStopDesk={shipment.isStopDesk}
              deliveryFee={shipment.deliveryFee}
            />
          </View>
        )}

        {/* Items */}
        <View className="mx-4 mt-3 rounded-card bg-card p-4">
          <Text className="font-mont-semibold text-sm text-white mb-3">
            Items
          </Text>
          {order.items.map((item, i) => (
            <View
              key={`${item.productId}-${i}`}
              className="flex-row items-center mb-3 last:mb-0"
            >
              <View className="w-12 h-12 rounded-lg overflow-hidden bg-surface mr-3">
                <AppImage
                  source={item.productImage}
                  style={{ width: 48, height: 48 }}
                />
              </View>
              <View className="flex-1">
                <Text className="font-mont-medium text-sm text-white">
                  {item.productName}
                </Text>
                <Text className="font-mont text-xs text-text-secondary">
                  Qty: {item.quantity}
                </Text>
              </View>
              <Text className="font-mont-semibold text-sm text-white">
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View className="mx-4 mt-3 rounded-card bg-card p-4">
          <Text className="font-mont-semibold text-sm text-white mb-2">
            Shipping Address
          </Text>
          <Text className="font-mont text-sm text-text-secondary">
            {order.shippingAddress.fullName}
          </Text>
          <Text className="font-mont text-sm text-text-secondary">
            {order.shippingAddress.address}
          </Text>
          <Text className="font-mont text-sm text-text-secondary">
            {order.shippingAddress.city}
          </Text>
          <Text className="font-mont text-sm text-text-secondary">
            {order.shippingAddress.phone}
          </Text>
        </View>

        {/* Total */}
        <View className="mx-4 mt-3 rounded-card bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-medium text-sm text-white">
              {order.buyerName} → {order.sellerName}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="font-mont-medium text-sm text-text-secondary">
              Payment
            </Text>
            <Text className="font-mont-medium text-sm text-white">
              Cash on Delivery
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="font-mont-bold text-base text-white">Total</Text>
            <Text className="font-mont-bold text-xl text-primary">
              {formatPrice(order.total)}
            </Text>
          </View>
        </View>

        {/* Seller action */}
        {canAdvance && nextStatus && (
          <View className="mx-4 mt-4">
            <Button
              title={`Mark as ${statusLabel[nextStatus]}`}
              onPress={() => advanceOrderStatus(order._id, nextStatus)}
              fullWidth
            />
          </View>
        )}

        {/* Contact button */}
        {user && (
          <View className="mx-4 mt-3 mb-8">
            <Pressable
              onPress={async () => {
                const otherUserId = isSeller ? order.buyerId : order.sellerId;
                if (!otherUserId) return; // other party deleted their account
                const itemName = order.items[0]?.productName ?? "Order";
                const convId = await getOrCreate(
                  otherUserId,
                  "order",
                  order._id,
                  itemName
                );
                if (convId) router.push(`/conversation/${convId}`);
              }}
              className="flex-row items-center justify-center rounded-card py-3.5"
              style={{ backgroundColor: "#0C0C0C", borderWidth: 1, borderColor: "#333", gap: 8 }}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#FFD400" />
              <Text className="font-mont-semibold text-sm text-primary">
                {isSeller ? "Contact Buyer" : "Contact Seller"}
              </Text>
            </Pressable>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
