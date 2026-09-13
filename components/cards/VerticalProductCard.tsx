import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "expo-router";

interface VerticalProductCardProps {
  product: Product;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export const VerticalProductCard = memo(function VerticalProductCard({
  product,
  onToggleFavorite,
  isFavorite,
}: VerticalProductCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/product/${product._id}`)}
      className="mb-3 mx-4"
    >
      <View className="flex-row overflow-hidden rounded-card bg-card">
        <View className="relative">
          <AppImage
            source={product.imageUrl}
            className="h-32 w-32"
          />
          {product.isNew && (
            <View className="absolute left-2 top-2">
              <Badge label="New" variant="new" />
            </View>
          )}
          {product.isPromoted && (
            <View
              className="absolute right-2 top-2 rounded-full px-2"
              style={{ backgroundColor: "#FFD400", paddingVertical: 2 }}
            >
              <Text className="font-mont-semibold text-[8px] text-black">
                Sponsored
              </Text>
            </View>
          )}
          {product.videoUrl && (
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <View
                className="h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Ionicons name="play" size={14} color="#fff" />
              </View>
            </View>
          )}
        </View>
        <View className="flex-1 justify-between p-3">
          <View style={{ gap: 4 }}>
            <Text
              className="font-mont-medium text-sm text-white"
              numberOfLines={2}
            >
              {product.name}
            </Text>
            {product.seller && (
              <Text
                className="font-mont text-xs text-text-secondary"
                numberOfLines={1}
              >
                {product.seller}
              </Text>
            )}
            {product.rating && (
              <Text className="font-mont text-xs text-text-secondary">
                {product.rating} rating
              </Text>
            )}
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-sm text-primary">
              {formatPrice(product.price)}
            </Text>
            {onToggleFavorite && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onToggleFavorite();
                }}
                className="rounded-pill bg-surface px-3 py-1"
              >
                <Text className="font-mont-medium text-xs text-white">
                  {isFavorite ? "Saved" : "Save"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});
