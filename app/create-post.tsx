import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@/lib/convex";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../convex/_generated/api";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { formatPrice } from "@/lib/formatters";
import { useToast } from "@/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Id } from "../convex/_generated/dataModel";

const DURATION_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { showSuccess, showError } = useToast();

  // Redirect non-Pro sellers
  useEffect(() => {
    if (user && user.plan !== "pro") {
      showError("Pro plan required to create promotions");
      router.back();
    }
  }, [user]);

  const createPromotion = useMutation(api.promotions.create);
  const myProducts = useQuery(api.products.listBySeller) ?? [];
  const myPromotions = useQuery(api.promotions.listByCreator) ?? [];

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [loading, setLoading] = useState(false);

  // Build set of already-promoted product IDs
  const promotedProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const promo of myPromotions) {
      if (promo.status === "active" && promo.productId) {
        ids.add(promo.productId as string);
      }
    }
    return ids;
  }, [myPromotions]);

  const handlePublish = async () => {
    if (!selectedProductId) {
      showError("Select a product to promote");
      return;
    }

    setLoading(true);
    try {
      await createPromotion({
        productId: selectedProductId as Id<"products">,
        description: description.trim() || undefined,
        durationDays: parseInt(durationDays, 10),
      });
      showSuccess("Promotion published!");
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not publish promotion.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mb-4"
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>

          <Text className="font-mont-bold text-xl text-text-primary">
            Promote a Product
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-0.5 mb-5">
            Select one of your products to boost its visibility on the home feed and search results.
          </Text>

          <View className="h-px bg-text-secondary/20 mb-5" />

          {/* Product picker */}
          <Text className="font-mont-semibold text-sm text-text-primary mb-3">
            Select a Product
          </Text>

          {myProducts === undefined ? (
            <ActivityIndicator color="#1A4B5F" />
          ) : myProducts.length === 0 ? (
            <Pressable
              onPress={() => router.push("/create-product")}
              className="rounded-card border border-dashed border-text-secondary/30 py-8 items-center mb-5"
            >
              <Ionicons name="bag-add-outline" size={32} color="#5F6E63" />
              <Text className="font-mont-medium text-sm text-text-primary mt-2">
                Create Your First Product
              </Text>
              <Text className="font-mont text-xs text-text-secondary mt-1">
                You need at least one product to create a promotion
              </Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10, marginBottom: 20 }}>
              {myProducts.map((product) => {
                const isPromoted = promotedProductIds.has(product._id as string);
                const isSelected = selectedProductId === (product._id as string);

                return (
                  <Pressable
                    key={product._id}
                    onPress={() => {
                      if (isPromoted) return;
                      setSelectedProductId(
                        isSelected ? null : (product._id as string)
                      );
                    }}
                    className={`flex-row items-center rounded-card overflow-hidden ${
                      isPromoted ? "opacity-50" : ""
                    }`}
                    style={{
                      backgroundColor: isSelected ? "rgba(26,75,95,0.1)" : "#FFFFFF",
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? "#1A4B5F" : "#E3DBCA",
                      borderRadius: 16,
                    }}
                  >
                    <AppImage
                      source={product.imageUrl}
                      style={{ width: 72, height: 72 }}
                    />
                    <View className="flex-1 px-3 py-2">
                      <Text
                        className="font-mont-medium text-sm text-text-primary"
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>
                      <Text className="font-mont text-xs text-text-secondary mt-0.5">
                        {product.category}
                      </Text>
                      <Text className="font-mont-bold text-sm text-primary mt-0.5">
                        {formatPrice(product.price)}
                      </Text>
                    </View>
                    {isPromoted ? (
                      <View
                        className="mr-3 rounded-full px-2"
                        style={{ backgroundColor: "rgba(26,75,95,0.2)", paddingVertical: 3 }}
                      >
                        <Text className="font-mont-semibold text-[10px] text-primary">
                          Active
                        </Text>
                      </View>
                    ) : isSelected ? (
                      <View className="mr-3">
                        <Ionicons name="checkmark-circle" size={24} color="#1A4B5F" />
                      </View>
                    ) : (
                      <View className="mr-3">
                        <Ionicons name="ellipse-outline" size={24} color="#5F6E63" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Description override */}
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, 200))}
            placeholder="Custom description for the promotion"
            multiline
            numberOfLines={3}
          />

          {/* Duration picker */}
          <Dropdown
            label="Promotion Duration"
            options={DURATION_OPTIONS}
            value={durationDays}
            onSelect={setDurationDays}
            placeholder="30 days"
          />
        </ScrollView>

        {/* Fixed bottom publish button */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="px-6 pt-3 bg-background border-t border-text-secondary/10"
        >
          <Button
            title="Publish Promotion"
            onPress={handlePublish}
            loading={loading}
            disabled={!selectedProductId}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
