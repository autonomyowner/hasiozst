import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { CartItem as CartItemType } from "@/lib/types";
import { formatPrice } from "@/lib/formatters";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItem = memo(function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <View
      className="mx-4 mb-4 overflow-hidden"
      style={{
        borderRadius: 20,
        backgroundColor: "rgba(17,17,17,0.8)",
        borderWidth: 1,
        borderColor: "rgba(51,51,51,0.6)",
      }}
    >
      <View className="flex-row items-center" style={{ padding: 10 }}>
        {/* Product image — vertically centered */}
        <AppImage
          source={item.product.imageUrl}
          style={{ width: 120, height: 140, borderRadius: 16 }}
        />

        {/* Content right side */}
        <View className="flex-1 ml-3" style={{ alignSelf: "stretch", justifyContent: "space-between" }}>
          {/* Top section: seller + remove button */}
          <View>
            {/* Remove button row */}
            <View className="flex-row items-start justify-between">
              {/* Seller info */}
              {item.product.sellerName ? (
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center" style={{ gap: 5 }}>
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#EF4444",
                      }}
                    >
                      <Text className="font-mont-bold text-white" style={{ fontSize: 9 }}>
                        {item.product.sellerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="font-mont-medium text-white" style={{ fontSize: 11 }} numberOfLines={1}>
                      {item.product.sellerName}
                    </Text>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#22C55E",
                      }}
                    />
                  </View>
                  {item.product.sellerCity ? (
                    <View className="flex-row items-center mt-0.5" style={{ gap: 2, marginLeft: 25 }}>
                      <Ionicons name="location-outline" size={10} color="#898989" />
                      <Text className="font-mont text-text-secondary" style={{ fontSize: 9 }}>
                        {item.product.sellerCity}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : <View style={{ flex: 1 }} />}

              {/* X button */}
              <Pressable
                onPress={onRemove}
                className="items-center justify-center active:opacity-60"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "rgba(239,68,68,0.15)",
                }}
              >
                <Ionicons name="close" size={15} color="#EF4444" />
              </Pressable>
            </View>

            {/* Product name — bigger, prominent */}
            <Text
              className="font-mont-semibold text-white"
              style={{ fontSize: 15, lineHeight: 20, marginTop: 8 }}
              numberOfLines={2}
            >
              {item.product.name}
            </Text>
          </View>

          {/* Bottom section: price + quantity */}
          <View className="flex-row items-center justify-between" style={{ marginTop: 10 }}>
            <View>
              <Text className="font-mont-bold text-primary" style={{ fontSize: 15 }}>
                {formatPrice(item.product.price)}
              </Text>
              <Text className="font-mont text-text-secondary" style={{ fontSize: 10 }}>
                / unit
              </Text>
            </View>

            {/* Quantity controls */}
            <View
              className="flex-row items-center"
              style={{
                backgroundColor: "rgba(51,51,51,0.5)",
                borderRadius: 10,
                paddingHorizontal: 4,
                paddingVertical: 3,
              }}
            >
              <Pressable
                onPress={() => onUpdateQuantity(item.quantity - 1)}
                className="items-center justify-center active:opacity-60"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "#333",
                }}
              >
                <Text className="font-mont-bold text-white" style={{ fontSize: 15 }}>-</Text>
              </Pressable>
              <Text className="font-mont-bold text-white" style={{ fontSize: 15, minWidth: 28, textAlign: "center" }}>
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => onUpdateQuantity(item.quantity + 1)}
                className="items-center justify-center active:opacity-60"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "#FFD400",
                }}
              >
                <Text className="font-mont-bold text-black" style={{ fontSize: 15 }}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});
