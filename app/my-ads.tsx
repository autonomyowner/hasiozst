import { useState } from "react";
import { ScrollView, View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@/lib/convex";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SubscriptionPlanCard } from "@/components/cards/SubscriptionPlanCard";
import { AppImage } from "@/components/ui/AppImage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { subscriptionPlans } from "@/lib/subscriptionPlans";
import { formatPrice, formatDate } from "@/lib/formatters";
import { useToast } from "@/providers/ToastProvider";
import type { Id } from "../convex/_generated/dataModel";

export default function MyAdsScreen() {
  const router = useRouter();
  const myPromotions = useQuery(api.promotions.listByCreator) ?? [];
  const removePromotion = useMutation(api.promotions.remove);
  const { showSuccess, showError } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removePromotion({ id: deleteTarget as Id<"promotions"> });
      showSuccess("Promotion deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete");
    }
    setDeleteTarget(null);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View className="px-4 pt-2 pb-3 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <View>
            <Text className="font-mont-bold text-xl text-text-primary">
              My Ads
            </Text>
            <Text className="font-mont text-xs text-text-secondary mt-0.5">
              Increase your visibility and reach more clients.
            </Text>
          </View>
        </View>

        <View className="mx-4 h-px bg-text-secondary/20 mb-5" />

        {/* Create New Post */}
        <Pressable
          onPress={() => router.push("/create-post")}
          className="mx-4 mb-6 rounded-card border border-dashed border-text-secondary/30 py-8 items-center"
        >
          <View className="h-12 w-12 rounded-full bg-primary items-center justify-center mb-3">
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
          <Text className="font-mont-bold text-base text-text-primary">
            Create New Post
          </Text>
          <Text className="font-mont text-xs text-text-secondary mt-1 text-center px-8">
            Promote a product or service to appear at the top of search results.
          </Text>
        </Pressable>

        {/* My Promotions */}
        <View className="px-4 mb-6">
          <Text className="font-mont-bold text-base text-text-primary mb-3">
            My Promotions
          </Text>

          {myPromotions === undefined ? (
            <ActivityIndicator color="#1A4B5F" />
          ) : myPromotions.length === 0 ? (
            <View className="bg-card rounded-card p-6 items-center">
              <Text className="font-mont text-sm text-text-secondary">
                No promotions yet. Create your first post above.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {myPromotions.map((promo) => (
                <View key={promo._id} className="bg-card rounded-card overflow-hidden">
                  {promo.imageUrl && (
                    <AppImage
                      source={promo.imageUrl}
                      style={{ width: "100%", height: 140 }}
                    />
                  )}
                  <View className="p-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="font-mont-semibold text-sm text-text-primary">
                          {promo.title}
                        </Text>
                        {promo.description ? (
                          <Text className="font-mont text-xs text-text-secondary mt-0.5" numberOfLines={2}>
                            {promo.description}
                          </Text>
                        ) : null}
                        <View className="flex-row items-center mt-1.5" style={{ gap: 8 }}>
                          <Text className="font-mont text-xs text-primary">
                            {formatPrice(promo.priceLow)} - {formatPrice(promo.priceHigh)}
                          </Text>
                          <View className={`px-2 py-0.5 rounded-full ${
                            promo.status === "active" ? "bg-success/20" : "bg-text-secondary/20"
                          }`}>
                            <Text className={`font-mont text-[10px] ${
                              promo.status === "active" ? "text-success" : "text-text-secondary"
                            }`}>
                              {promo.status}
                            </Text>
                          </View>
                        </View>
                        <Text className="font-mont text-[10px] text-text-secondary mt-1">
                          {formatDate(promo.createdAt)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setDeleteTarget(promo._id)}
                        className="h-9 w-9 rounded-full bg-error/10 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Subscription Plans */}
        <View className="mb-6">
          <Text className="font-mont-bold text-base text-text-primary text-center mb-1">
            Subscription Plans
          </Text>
          <Text className="font-mont text-xs text-text-secondary text-center mb-4">
            Choose a plan to boost your visibility permanently.
          </Text>

          <FlatList
            horizontal
            data={subscriptionPlans}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <SubscriptionPlanCard
                plan={item}
                onPress={() =>
                  router.push(`/subscription-plan?plan=${item.id}`)
                }
              />
            )}
          />
        </View>

        <View className="h-6" />
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion?"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}
