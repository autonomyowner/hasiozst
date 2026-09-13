import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { WholesaleProduct } from "@/lib/types";
import { formatPrice } from "@/lib/formatters";

interface SupplierProductCardProps {
  product: WholesaleProduct;
  onPress?: () => void;
}

const productTypeLabel: Record<string, string> = {
  express: "Express",
  grocery: "Organic",
  importer: "Imported",
};

const unitLabelByType: Record<string, string> = {
  express: "unit",
  grocery: "bag",
  importer: "unit",
};

export function SupplierProductCard({
  product,
  onPress,
}: SupplierProductCardProps) {
  const categoryLabel =
    (product.productType && productTypeLabel[product.productType]) ||
    product.tags[0] ||
    null;

  const unitLabel =
    (product.productType && unitLabelByType[product.productType]) || "unit";

  return (
    <Pressable onPress={onPress} className="mb-3 mx-4 active:opacity-90">
      <View
        className="overflow-hidden"
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(245,230,163,0.18)",
          padding: 10,
          shadowColor: "#F5E6A3",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <View className="flex-row">
          {/* Image with overlays */}
          <View
            className="relative overflow-hidden"
            style={{ width: 132, height: 148, borderRadius: 14 }}
          >
            <AppImage
              source={product.imageUrl}
              style={{ width: 132, height: 148 }}
            />

            {/* Category badge top-left */}
            {categoryLabel && (
              <View
                className="absolute left-2 top-2 rounded-md px-2 py-0.5"
                style={{ backgroundColor: "rgba(245,230,163,0.22)" }}
              >
                <Text
                  className="font-mont-semibold text-[10px]"
                  style={{ color: "#F5E6A3" }}
                >
                  {categoryLabel}
                </Text>
              </View>
            )}

            {/* Play overlay if has video */}
            {product.hasVideo && (
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                >
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
              </View>
            )}

            {/* Availability text bottom-left */}
            <View
              className="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              <Text className="font-mont text-[9px] text-white">
                Available: {product.minOrder} {unitLabel}s
              </Text>
            </View>

            {/* Star rating bottom-right */}
            <View
              className="absolute bottom-2 right-2 flex-row items-center rounded-md px-1.5 py-0.5"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              <Ionicons name="star" size={9} color="#F5E6A3" />
              <Text className="ml-0.5 font-mont-semibold text-[10px] text-white">
                {product.rating}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 pl-3 pr-1 py-0.5 justify-between">
            <View>
              {/* Supplier row */}
              <View className="flex-row items-center">
                {product.supplierAvatar ? (
                  <Image
                    source={{ uri: product.supplierAvatar }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#3a1414",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#3a1414",
                    }}
                  />
                )}
                <Text
                  className="ml-1.5 font-mont-semibold text-[12px] text-white flex-1"
                  numberOfLines={1}
                >
                  {product.supplierName}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color="#22C55E"
                  style={{ marginLeft: 2 }}
                />
              </View>

              {/* Location row */}
              <View className="mt-0.5 flex-row items-center">
                <Ionicons name="location-outline" size={10} color="#B9C9A8" />
                <Text
                  className="ml-0.5 font-mont text-[10px] text-[#B9C9A8]"
                  numberOfLines={1}
                >
                  {product.supplierLocation}
                </Text>
              </View>

              {/* Product name */}
              <Text
                className="mt-1.5 font-mont-bold text-[13px] text-white leading-[16px]"
                numberOfLines={2}
              >
                {product.name}
              </Text>

              {/* Starting from + price */}
              <Text className="mt-1 font-mont text-[9px] text-[#B9C9A8]">
                Starting from
              </Text>
              <Text
                className="font-mont-bold text-[14px]"
                style={{ color: "#F5E6A3" }}
              >
                {formatPrice(product.pricePerUnit)}
                <Text className="font-mont text-[10px] text-[#B9C9A8]">
                  {" "}
                  / {unitLabel}
                </Text>
              </Text>
            </View>

            {/* View Details pill */}
            <Pressable
              onPress={onPress}
              className="mt-2 self-start flex-row items-center px-3 py-1.5"
              style={{
                gap: 6,
                backgroundColor: "#F5E6A3",
                borderRadius: 999,
                shadowColor: "#F5E6A3",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="font-mont-semibold text-[11px] text-black">
                View Details
              </Text>
              <Ionicons name="arrow-forward" size={12} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
