import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { formatPrice } from "@/lib/formatters";
import { ImageCarousel } from "@/components/product/ImageCarousel";
import { SupplierInfo } from "@/components/product/SupplierInfo";
import { ProductInfoGrid } from "@/components/product/ProductInfoGrid";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { OrderSummaryTable } from "@/components/product/OrderSummaryTable";
import { ProductRow } from "@/components/sections/ProductRow";
import { ContentMenu } from "@/components/ui/ContentMenu";
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductType } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { useGuest } from "@/providers/GuestProvider";

function getProductType(product: Product): ProductType {
  if (product.productType) return product.productType;
  if (product.specs) return "importer";
  if (product.expirationDate || product.storageCondition) return "grocery";
  return "express";
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user } = useCurrentUser();
  const { isGuest } = useGuest();
  const { getOrCreate } = useConversations();
  const [quantity, setQuantity] = useState(1);
  const similarProducts = useProducts(product?.category ?? "all");

  if (product === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#1A4B5F" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="font-mont text-text-primary">Product not found</Text>
      </SafeAreaView>
    );
  }

  const productType = getProductType(product);
  const images = product.images?.length ? product.images : [product.imageUrl];
  const isImporter = productType === "importer";

  const groceryInfoItems = [
    {
      label: "Stock Quantity",
      value: product.stockQuantity
        ? `Available: ${product.stockQuantity} bags\nLow Stock Warning (if < 20)`
        : "In Stock",
      icon: "cube-outline" as const,
    },
    {
      label: "Starting From",
      value: formatPrice(product.price),
      icon: "pricetag-outline" as const,
    },
    {
      label: "Expiration Date",
      value: product.expirationDate ?? "N/A",
      icon: "calendar-outline" as const,
    },
    {
      label: "Storage Condition",
      value: product.storageCondition ?? "N/A",
      icon: "thermometer-outline" as const,
    },
  ];

  const importerInfoItems = [
    {
      label: "Power",
      value: product.specs?.power ?? "N/A",
      icon: "flash-outline" as const,
    },
    {
      label: "Capacity",
      value: product.specs?.capacity ?? "N/A",
      icon: "resize-outline" as const,
    },
    {
      label: "Warranty",
      value: product.specs?.warranty ?? "N/A",
      icon: "shield-checkmark-outline" as const,
    },
    {
      label: "Material",
      value: product.specs?.material ?? "N/A",
      icon: "construct-outline" as const,
    },
  ];

  const filteredSimilar = (similarProducts ?? []).filter(
    (p) => p._id !== product._id
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ImageCarousel
          images={images}
          videoUrl={product.videoUrl}
          badge={product.badge ?? (product.isNew ? "In Stock" : undefined)}
          minOrder={isImporter ? product.minOrder : undefined}
          onBack={() => router.back()}
        />

        {/* Content */}
        <View className="p-4">
          {/* Product title label */}
          <Text className="font-mont text-xs text-text-secondary mb-1">
            Product Title
          </Text>
          <Text className="font-mont-bold text-2xl text-text-primary leading-tight">
            {product.name}
          </Text>

          {/* Tagline */}
          {product.tagline && (
            <Text className="font-mont text-sm text-text-secondary mt-1">
              {product.tagline}
            </Text>
          )}

          {/* Supplier info */}
          <View className="mt-4 flex-row items-start">
            <View style={{ flex: 1 }}>
              <SupplierInfo
                name={product.seller ?? "HASIO Seller"}
                avatar={product.supplierAvatar}
                location={product.supplierLocation}
                rating={product.rating}
                reviewCount={product.reviewCount}
                trustedCustomers={product.trustedCustomers}
              />
            </View>
            <ContentMenu
              targetType="product"
              targetId={product._id}
              ownerId={product.sellerId}
              ownerName={product.seller ?? undefined}
            />
          </View>

          {/* Price */}
          <View className="flex-row items-center mt-4">
            <Ionicons name="pricetag" size={18} color="#1A4B5F" />
            <Text className="font-mont-bold text-2xl text-primary ml-2">
              {product.price.toLocaleString("en-US")}
            </Text>
            <Text className="font-mont-semibold text-sm text-primary ml-1.5">
              SAR
            </Text>
          </View>

          {/* Info grid (Grocery or Importer) */}
          {productType === "grocery" && (
            <View className="mt-4">
              <ProductInfoGrid items={groceryInfoItems} />
            </View>
          )}

          {productType === "importer" && (
            <View className="mt-4">
              <ProductInfoGrid items={importerInfoItems} />
            </View>
          )}

          {/* Description */}
          <View className="mt-4 rounded-card bg-card p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="document-text-outline" size={16} color="#5F6E63" />
              <Text className="font-mont-semibold text-sm text-text-primary ml-2">
                Description
              </Text>
            </View>
            <Text className="font-mont text-sm text-text-secondary leading-5">
              {product.description ??
                "High-quality product from a verified seller. Free returns within 14 days. Fast delivery across Algeria."}
            </Text>
          </View>

          {/* Quantity selector */}
          <View className="mt-5">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => q + 1)}
              onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              min={product.minOrder ?? 1}
            />
          </View>

          {/* Order summary */}
          <View className="mt-4">
            <OrderSummaryTable
              productName={product.name}
              quantity={quantity}
              unitPrice={product.price}
            />
          </View>

          {/* CTA button */}
          <Pressable
            onPress={() => {
              if (isImporter) {
                showSuccess("Your quote request has been sent to the supplier.");
              } else {
                for (let i = 0; i < quantity; i++) {
                  addItem(product._id);
                }
                router.push("/checkout");
              }
            }}
            className="mt-5 flex-row items-center justify-center rounded-card bg-card py-4"
            style={{ gap: 8 }}
          >
            <Ionicons name="cart-outline" size={20} color="#1A4B5F" />
            <Text className="font-mont-bold text-primary">
              &gt;&gt;&gt;
            </Text>
            <Text className="font-mont-bold text-sm text-primary">
              {isImporter ? "Request Quote" : "Order Now"}
            </Text>
          </Pressable>

          {/* Message Seller */}
          {product.sellerId !== user?._id && !isGuest && user && (
            <Pressable
              onPress={async () => {
                const convId = await getOrCreate(
                  product.sellerId,
                  "product",
                  product._id,
                  product.name
                );
                if (convId) router.push(`/conversation/${convId}`);
              }}
              className="mt-3 flex-row items-center justify-center rounded-card py-3.5"
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3DBCA", gap: 8 }}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#1A4B5F" />
              <Text className="font-mont-semibold text-sm text-primary">
                Message Seller
              </Text>
            </Pressable>
          )}

          {/* Similar Products */}
          {filteredSimilar.length > 0 && (
            <View className="mt-6 -mx-4">
              <ProductRow
                title="Similar Products"
                products={filteredSimilar.slice(0, 6)}
              />
            </View>
          )}

          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
