import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CartItem } from "@/components/cart/CartItem";
import { GuestSignInPrompt } from "@/components/ui/GuestSignInPrompt";
import { useCart } from "@/hooks/useCart";
import { useGuest } from "@/providers/GuestProvider";
import { formatPrice } from "@/lib/formatters";
import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";

const DELIVERY_FEE = 1000;

export default function CartStandaloneScreen() {
  const { isGuest } = useGuest();
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const router = useRouter();
  const rawCartQuery = useQuery(api.cart.get, isGuest ? "skip" : undefined);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isGuest) {
    return <GuestSignInPrompt message="Sign in to add items to your cart and start shopping" />;
  }

  if (rawCartQuery === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A4B5F" />
        </View>
      </ScreenContainer>
    );
  }

  const totalAmount = total + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <ScreenContainer>
      {/* Header with back button */}
      <View className="flex-row items-center justify-center py-4 px-4">
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#0D1A12" />
        </Pressable>
        <View className="flex-row items-center">
          <Text className="font-mont-bold text-xl text-text-primary">Your</Text>
          <View className="ml-1.5">
            <Text className="font-mont-bold text-xl text-text-primary">Cart</Text>
            <View
              style={{
                height: 3,
                backgroundColor: "#1A4B5F",
                borderRadius: 2,
                marginTop: 2,
              }}
            />
          </View>
        </View>
      </View>

      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1A4B5F"
                colors={["#1A4B5F"]}
              />
            }
          >
            {items.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                onUpdateQuantity={(qty) =>
                  updateQuantity(item.productId, qty)
                }
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </ScrollView>

          {/* Summary + Checkout */}
          <View className="px-4 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            {/* Summary card */}
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(227,219,202,0.6)",
                backgroundColor: "rgba(242,234,217,0.6)",
                paddingHorizontal: 20,
                paddingVertical: 16,
                marginBottom: 16,
              }}
            >
              {/* Subtotal */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-mont-medium text-sm text-text-secondary">Subtotal</Text>
                <Text className="font-mont-semibold text-sm text-text-primary">{formatPrice(total)}</Text>
              </View>
              {/* Delivery Fee */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-mont-medium text-sm text-text-secondary">Delivery Fee</Text>
                <Text className="font-mont-semibold text-sm text-text-primary">{formatPrice(DELIVERY_FEE)}</Text>
              </View>
              {/* Separator */}
              <View style={{ height: 1, backgroundColor: "rgba(227,219,202,0.8)", marginBottom: 12 }} />
              {/* Total */}
              <View className="flex-row items-center justify-between">
                <Text className="font-mont-bold text-base text-text-primary">Total Amount</Text>
                <Text className="font-mont-bold text-lg text-primary">{formatPrice(totalAmount)}</Text>
              </View>
            </View>

            {/* Checkout button */}
            <Pressable
              onPress={() => router.push("/checkout")}
              className="active:opacity-80"
              style={{
                backgroundColor: "#1A4B5F",
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                shadowColor: "#1A4B5F",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
              <Text className="font-mont-bold text-white" style={{ fontSize: 15, letterSpacing: 0.5 }}>
                {">>> "}Proceed to Checkout
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
