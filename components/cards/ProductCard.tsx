import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { Product } from "@/lib/types";
import { useRouter } from "expo-router";

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onAddToCart?: () => void;
  fullWidth?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  onToggleFavorite,
  isFavorite,
  onAddToCart,
  fullWidth,
}: ProductCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/product/${product._id}`)}
      className={fullWidth ? "" : "mr-3"}
      style={fullWidth ? { width: "100%" } : { width: 141 }}
    >
      <View className="overflow-hidden rounded-card bg-[#141A16]" style={{ height: 196 }}>
        {/* Full-bleed image with inner rounded rect (matches Figma) */}
        <View
          className="relative flex-1 overflow-hidden"
          style={{ borderRadius: 10, margin: 6 }}
        >
          <AppImage
            source={product.imageUrl}
            style={{ width: "100%", height: "100%" }}
          />

          {/* Full gradient overlay from bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            locations={[0.35, 1]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "100%",
            }}
          />

          {/* Video play indicator */}
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

          {/* Heart icon — top right */}
          {onToggleFavorite && (
            <Pressable
              onPress={onToggleFavorite}
              className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={14}
                color={isFavorite ? "#EF4444" : "#fff"}
              />
            </Pressable>
          )}

          {/* All text inside gradient overlay (Figma layout) */}
          <View className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
            {/* HASIO brand */}
            <Text className="font-mont text-[8px] text-white/50 mb-0.5 tracking-wider">
              HASIO
            </Text>

            {/* Product name */}
            <Text
              className="font-mont-semibold text-[10px] text-white leading-[12px]"
              numberOfLines={2}
            >
              {product.name}
            </Text>

            {/* New badge */}
            {product.isNew && (
              <View
                className="mt-1 self-start rounded-full px-1.5"
                style={{ backgroundColor: "#2866ED", paddingVertical: 1 }}
              >
                <Text className="font-mont-semibold text-[5px] text-white">
                  New
                </Text>
              </View>
            )}

            {/* Sponsored badge */}
            {product.isPromoted && (
              <View
                className="mt-1 self-start rounded-full px-1.5"
                style={{ backgroundColor: "#F5E6A3", paddingVertical: 1 }}
              >
                <Text className="font-mont-semibold text-[5px] text-black">
                  Sponsored
                </Text>
              </View>
            )}

            {/* Old price (struck through) */}
            {product.oldPrice && (
              <Text
                className="font-mont-semibold text-[7px] text-[#828282] mt-1"
                style={{ textDecorationLine: "line-through" }}
              >
                SAR {product.oldPrice.toLocaleString("en-US")}
              </Text>
            )}

            {/* Current price with currency */}
            <View className="flex-row items-baseline mt-0.5">
              <Text className="font-mont-semibold text-[13px] text-gold">
                {product.price.toLocaleString("en-US")}
              </Text>
              <Text className="font-mont-semibold text-[7px] text-gold ml-0.5">
                SAR
              </Text>
            </View>
          </View>

          {/* Cart button — bottom right */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart?.();
            }}
            className="absolute bottom-1.5 right-1.5 h-[22px] w-[22px] items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="cart-outline" size={12} color="#000" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});
