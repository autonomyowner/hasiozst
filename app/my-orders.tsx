import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { OrderList } from "@/components/profile/OrderList";
import { useOrders } from "@/hooks/useOrders";
import { useUserRole } from "@/hooks/useUserRole";

export default function MyOrdersScreen() {
  const { buyerOrders, sellerOrders, isLoading } = useOrders();
  const { effectiveRole } = useUserRole();
  const router = useRouter();

  const isSeller =
    effectiveRole === "fournisseur" ||
    effectiveRole === "importateur" ||
    effectiveRole === "grossiste";

  const orders = isSeller ? sellerOrders : buyerOrders;

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-1 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-white">My Orders</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="font-mont text-sm text-text-secondary">
            No orders yet
          </Text>
        </View>
      ) : (
        <OrderList orders={orders} />
      )}
    </ScreenContainer>
  );
}
