import { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@/lib/convex";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SubscriptionPlanCard } from "@/components/cards/SubscriptionPlanCard";
import { AppImage } from "@/components/ui/AppImage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { subscriptionPlans } from "@/lib/subscriptionPlans";
import { formatPrice, formatDate } from "@/lib/formatters";
import { useToast } from "@/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Id } from "../../convex/_generated/dataModel";

export default function PromoteBusinessScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isPro = user?.plan === "pro";
  const myPromotions = useQuery(api.promotions.listByCreator) ?? [];
  const removePromotion = useMutation(api.promotions.remove);
  const { showSuccess, showError } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removePromotion({ id: deleteTarget as Id<"promotions"> });
      showSuccess("Promotion deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Separate product-linked (new) vs legacy promotions
  const { productLinked, legacy } = useMemo(() => {
    const pl: typeof myPromotions = [];
    const lg: typeof myPromotions = [];
    for (const p of myPromotions) {
      if (p.productId) pl.push(p);
      else lg.push(p);
    }
    return { productLinked: pl, legacy: lg };
  }, [myPromotions]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="font-mont-bold text-xl text-text-primary">
              Promote Your Business
            </Text>
            {isPro && (
              <View className="rounded-full px-2" style={{ backgroundColor: "#1A4B5F", paddingVertical: 2 }}>
                <Text className="font-mont-bold text-[9px] text-white">PRO</Text>
              </View>
            )}
          </View>
          <Text className="font-mont text-sm text-text-secondary mt-0.5">
            Increase your visibility and reach more clients.
          </Text>
        </View>

        <View className="mx-4 h-px bg-text-secondary/20 mb-5" />

        {/* Non-Pro locked state */}
        {!isPro && (
          <View
            className="mx-4 mb-6 rounded-card items-center overflow-hidden"
            style={{
              backgroundColor: "rgba(242,234,217,0.8)",
              borderWidth: 1,
              borderColor: "rgba(26,75,95,0.15)",
              borderRadius: 20,
            }}
          >
            <View style={{ paddingVertical: 28, paddingHorizontal: 24, alignItems: "center" }}>
              <View
                className="h-14 w-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(26,75,95,0.1)" }}
              >
                <Ionicons name="lock-closed" size={24} color="#1A4B5F" />
              </View>
              <Text className="font-mont-bold text-base text-text-primary text-center">
                Pro Feature
              </Text>
              <Text className="font-mont text-xs text-text-secondary text-center mt-1.5 px-2">
                Upgrade to Pro to promote your products on the home feed, search results, and recommendations.
              </Text>
              <View
                className="mt-4 rounded-full px-6"
                style={{
                  backgroundColor: "rgba(26,75,95,0.12)",
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "rgba(26,75,95,0.2)",
                }}
              >
                <Text className="font-mont-semibold text-xs text-primary">
                  Contact admin to upgrade
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Create New Post — Pro only */}
        {isPro && (
          <Pressable
            onPress={() => router.push("/create-post")}
            className="mx-4 mb-6 rounded-card border border-dashed border-text-secondary/30 py-8 items-center"
          >
            <View className="h-12 w-12 rounded-full bg-primary items-center justify-center mb-3">
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
            <Text className="font-mont-bold text-base text-text-primary">
              Promote a Product
            </Text>
            <Text className="font-mont text-xs text-text-secondary mt-1 text-center px-8">
              Select one of your products to boost its visibility on the home feed and search results.
            </Text>
          </Pressable>
        )}

        {/* My Promotions */}
        <View className="px-4 mb-6">
          <Text className="font-mont-bold text-base text-text-primary mb-3">
            My Promotions
          </Text>

          {myPromotions === undefined ? (
            <ActivityIndicator color="#1A4B5F" />
          ) : productLinked.length === 0 && legacy.length === 0 ? (
            <View className="bg-card rounded-card p-6 items-center">
              <Text className="font-mont text-sm text-text-secondary">
                {isPro ? "No promotions yet. Promote your first product above." : "No promotions yet."}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {/* Product-linked promotions with analytics */}
              {productLinked.map((promo) => {
                const impressions = promo.impressions ?? 0;
                const clicks = promo.clicks ?? 0;
                const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
                const daysLeft = promo.expiresAt
                  ? Math.max(0, Math.ceil((promo.expiresAt - Date.now()) / 86400000))
                  : null;
                const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && promo.status === "active";

                return (
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

                          {/* Price + status badges */}
                          <View className="flex-row items-center mt-1.5 flex-wrap" style={{ gap: 6 }}>
                            {promo.price ? (
                              <Text className="font-mont-bold text-xs text-primary">
                                {formatPrice(promo.price)}
                              </Text>
                            ) : null}
                            <View className={`px-2 py-0.5 rounded-full ${
                              promo.status === "active" ? "bg-success/20" : "bg-text-secondary/20"
                            }`}>
                              <Text className={`font-mont text-[10px] ${
                                promo.status === "active" ? "text-success" : "text-text-secondary"
                              }`}>
                                {promo.status}
                              </Text>
                            </View>
                            {isExpiringSoon && (
                              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.2)" }}>
                                <Text className="font-mont text-[10px]" style={{ color: "#F59E0B" }}>
                                  Expiring Soon
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Analytics row */}
                          <View className="flex-row items-center mt-2" style={{ gap: 12 }}>
                            <View className="flex-row items-center" style={{ gap: 3 }}>
                              <Ionicons name="eye-outline" size={12} color="#5F6E63" />
                              <Text className="font-mont text-[10px] text-text-secondary">
                                {impressions}
                              </Text>
                            </View>
                            <View className="flex-row items-center" style={{ gap: 3 }}>
                              <Ionicons name="finger-print-outline" size={12} color="#5F6E63" />
                              <Text className="font-mont text-[10px] text-text-secondary">
                                {clicks}
                              </Text>
                            </View>
                            <View className="flex-row items-center" style={{ gap: 3 }}>
                              <Ionicons name="analytics-outline" size={12} color="#5F6E63" />
                              <Text className="font-mont text-[10px] text-text-secondary">
                                {ctr}% CTR
                              </Text>
                            </View>
                            {daysLeft !== null && (
                              <Text className="font-mont text-[10px] text-text-secondary">
                                {daysLeft}d left
                              </Text>
                            )}
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
                );
              })}

              {/* Legacy promotions (without productId) */}
              {legacy.map((promo) => (
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
                          <View className="px-2 py-0.5 rounded-full bg-text-secondary/10">
                            <Text className="font-mont text-[10px] text-text-secondary">
                              Legacy
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
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}
