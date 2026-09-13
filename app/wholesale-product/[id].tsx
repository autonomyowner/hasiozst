import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useWholesaleProduct } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/formatters";
import { ImageCarousel } from "@/components/product/ImageCarousel";
import { SupplierInfo } from "@/components/product/SupplierInfo";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { OrderSummaryTable } from "@/components/product/OrderSummaryTable";
import { useToast } from "@/providers/ToastProvider";

export default function WholesaleProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useWholesaleProduct(id);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const addWholesaleItem = useMutation(api.cart.addWholesaleItem);

  const minOrder = product?.minOrder ?? 1;
  const [quantity, setQuantity] = useState(minOrder);

  // Sync quantity to actual minOrder once product loads
  useEffect(() => {
    if (product?.minOrder) {
      setQuantity(product.minOrder);
    }
  }, [product?.minOrder]);

  if (product === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-14 left-4 h-[42px] w-[42px] items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Ionicons name="cube-outline" size={48} color="#898989" />
        <Text className="font-mont-semibold text-white mt-3">Product not found</Text>
        <Text className="font-mont text-sm text-text-secondary mt-1">
          This product may have been removed
        </Text>
      </SafeAreaView>
    );
  }

  const images = product.images?.length ? product.images : [product.imageUrl];
  const unitPrice = product.pricePerUnit;

  const handleAddToCart = async () => {
    try {
      await addWholesaleItem({
        wholesaleProductId: product._id as Id<"wholesaleProducts">,
        quantity,
      });
      showSuccess("Added to wholesale cart");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    try {
      await addWholesaleItem({
        wholesaleProductId: product._id as Id<"wholesaleProducts">,
        quantity,
      });
      showSuccess("Added to cart — proceeding to checkout");
      router.push("/wholesale-checkout");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ImageCarousel
          images={images}
          videoUrl={product.videoUrl}
          badge={`Min: ${minOrder} units`}
          onBack={() => router.back()}
        />

        {/* Content */}
        <View className="p-4">
          {/* B2B badge */}
          <View className="flex-row items-center mb-2">
            <View
              className="rounded-pill px-3 py-1"
              style={{ backgroundColor: "rgba(255,212,0,0.12)" }}
            >
              <Text className="font-mont-semibold text-xs text-primary">
                Wholesale / B2B
              </Text>
            </View>
          </View>

          {/* Product name */}
          <Text className="font-mont-bold text-2xl text-white leading-tight">
            {product.name}
          </Text>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
              {product.tags.map((tag: string) => (
                <View
                  key={tag}
                  className="rounded-pill px-2.5 py-1"
                  style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
                >
                  <Text className="font-mont text-xs text-text-secondary">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Supplier info */}
          <View className="mt-4">
            <SupplierInfo
              name={product.supplierName ?? "Wholesale Supplier"}
              avatar={product.supplierAvatar}
              location={product.supplierLocation}
              rating={product.supplierRating ?? product.rating}
            />
          </View>

          {/* Price + Min Order */}
          <View className="mt-4 rounded-card bg-card p-4" style={{ gap: 12 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="pricetag" size={18} color="#FFD400" />
                <Text className="font-mont-bold text-2xl text-primary ml-2">
                  {unitPrice.toLocaleString("fr-DZ")}
                </Text>
                <Text className="font-mont-semibold text-sm text-primary ml-1">
                  DA / unit
                </Text>
              </View>
            </View>
            <View
              className="h-px"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={16} color="#898989" />
                <Text className="font-mont text-sm text-text-secondary ml-2">
                  Minimum Order
                </Text>
              </View>
              <Text className="font-mont-semibold text-white">
                {minOrder} units
              </Text>
            </View>
            {product.category && (
              <>
                <View
                  className="h-px"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                />
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="grid-outline" size={16} color="#898989" />
                    <Text className="font-mont text-sm text-text-secondary ml-2">
                      Category
                    </Text>
                  </View>
                  <Text className="font-mont-semibold text-white">
                    {product.category}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View className="mt-4 rounded-card bg-card p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text-outline" size={16} color="#898989" />
                <Text className="font-mont-semibold text-sm text-white ml-2">
                  Description
                </Text>
              </View>
              <Text className="font-mont text-sm text-text-secondary leading-5">
                {product.description}
              </Text>
            </View>
          )}

          {/* Quantity selector — +1 / -1, enforces minOrder floor */}
          <View className="mt-5">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => q + 1)}
              onDecrease={() => setQuantity((q) => Math.max(minOrder, q - 1))}
              min={minOrder}
            />
          </View>

          {/* Order summary */}
          <View className="mt-4">
            <OrderSummaryTable
              productName={product.name}
              quantity={quantity}
              unitPrice={unitPrice}
            />
          </View>

          {/* CTA buttons */}
          <View className="mt-5" style={{ gap: 10 }}>
            <Pressable
              onPress={handleBuyNow}
              className="flex-row items-center justify-center rounded-card py-4"
              style={{
                backgroundColor: "#FFD400",
                gap: 8,
              }}
            >
              <Ionicons name="flash" size={18} color="#000" />
              <Text className="font-mont-bold text-sm text-black">
                Buy Now
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAddToCart}
              className="flex-row items-center justify-center rounded-card bg-card py-4"
              style={{ gap: 8 }}
            >
              <Ionicons name="cart-outline" size={18} color="#FFD400" />
              <Text className="font-mont-bold text-sm text-primary">
                Add to Wholesale Cart
              </Text>
            </Pressable>
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
