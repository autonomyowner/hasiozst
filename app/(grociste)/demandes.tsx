import { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OfferCard } from "@/components/cards/OfferCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOffers } from "@/hooks/useOffers";
import { formatPrice, formatDate } from "@/lib/formatters";
import { useViewMode } from "@/hooks/useViewMode";
import { useUserRole } from "@/hooks/useUserRole";
import { ReelsContent } from "@/components/sections/ReelsContent";

type Tab = "demandes" | "offers";

export default function DemandesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("demandes");
  const [offerSearch, setOfferSearch] = useState("");
  const [offerCategory, setOfferCategory] = useState("all");
  const { openOffers } = useOffers();
  const rawDemandRequests = useQuery(api.demandRequests.list);
  const categoriesRaw = useQuery(api.categories.list) ?? [];
  // Exclude the seed "all" category — we already render a manual "All" pill
  const categories = categoriesRaw.filter((c) => c.slug !== "all");
  const demandRequests = rawDemandRequests ?? [];
  const router = useRouter();
  const { isB2CMode } = useViewMode();
  const { effectiveRole } = useUserRole();
  const isFocused = useIsFocused();
  const isFournisseur = effectiveRole === "fournisseur";

  const filteredOffers = useMemo(() => {
    let result = openOffers;
    if (offerSearch.trim()) {
      const q = offerSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q)
      );
    }
    if (offerCategory !== "all") {
      result = result.filter((o) => o.category === offerCategory);
    }
    return result;
  }, [openOffers, offerSearch, offerCategory]);

  // B2C mode — show reels instead of demandes/offers
  if (isB2CMode) {
    return <ReelsContent isFocused={isFocused} />;
  }

  if (rawDemandRequests === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "demandes", label: "Demandes" },
    { key: "offers", label: "Offers" },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-2 pb-3 flex-row items-start justify-between">
          <View>
            <Text className="font-mont-bold text-xl text-white">Demandes</Text>
            <Text className="font-mont text-sm text-text-secondary">
              Buyer requests & wholesale offers
            </Text>
          </View>
          {activeTab === "demandes" && !isFournisseur && (
            <Pressable
              onPress={() => router.push("/create-demand")}
              className="bg-primary rounded-pill px-4 py-2 mt-1"
            >
              <Text className="font-mont-semibold text-sm text-black">
                Post Demand
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tab Switcher */}
        <View className="mx-4 mb-4 flex-row rounded-card bg-surface p-1">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 items-center rounded-[10px] py-2 ${
                activeTab === tab.key ? "bg-card" : ""
              }`}
            >
              <Text
                className={`font-mont-semibold text-sm ${
                  activeTab === tab.key ? "text-primary" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "demandes" ? (
          demandRequests.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No demands yet"
              message={isFournisseur ? "No demand requests available" : "Post a demand to find suppliers"}
              ctaLabel={isFournisseur ? undefined : "Post Demand"}
              onPress={isFournisseur ? undefined : () => router.push("/create-demand")}
            />
          ) : (
          <>
            {demandRequests.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => router.push(`/demand/${item._id}`)}
                className="mx-4 mb-3 rounded-card bg-card p-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-mont-semibold text-base text-white">
                      {item.title}
                    </Text>
                    <Text className="font-mont text-sm text-text-secondary mt-1">
                      {item.buyerName}
                    </Text>
                  </View>
                  <View className="flex-row gap-1.5">
                    <Badge
                      label={item.status === "new" ? "Open" : item.status === "in_progress" ? "In Progress" : "Done"}
                      variant={item.status === "new" ? "success" : "primary"}
                    />
                    {(item.responseCount ?? 0) > 0 && (
                      <Badge
                        label={`${item.responseCount}`}
                        variant="neutral"
                      />
                    )}
                  </View>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  <View>
                    <Text className="font-mont text-xs text-text-secondary">
                      Budget
                    </Text>
                    <Text className="font-mont-bold text-sm text-primary">
                      {formatPrice(item.budget)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-mont text-xs text-text-secondary">
                      Deadline
                    </Text>
                    <Text className="font-mont-medium text-sm text-white">
                      {formatDate(item.deadline)}
                    </Text>
                  </View>
                </View>
                {!isFournisseur && (
                  <View className="mt-3">
                    <Button
                      title="Submit Offer"
                      onPress={() =>
                        router.push(
                          `/create-offer?title=${encodeURIComponent(item.title)}&productName=${encodeURIComponent(item.title.split(" - ")[0])}&minPrice=${item.budget}`
                        )
                      }
                      size="sm"
                      fullWidth
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </>
          )
        ) : (
          <>
            {/* Offers search bar */}
            <View className="mb-2">
              <SearchBar
                placeholder="Search offers..."
                onChangeText={setOfferSearch}
              />
            </View>

            {/* Category pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              style={{ flexGrow: 0, marginBottom: 12 }}
            >
              <Pressable
                onPress={() => setOfferCategory("all")}
                className="rounded-pill px-4 py-2"
                style={{
                  backgroundColor: offerCategory === "all" ? "#FFD400" : "rgba(169,169,169,0.12)",
                }}
              >
                <Text
                  className={`font-mont-semibold text-[13px] ${
                    offerCategory === "all" ? "text-black" : "text-text-secondary"
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => {
                const isActive = offerCategory === cat.slug;
                return (
                  <Pressable
                    key={cat.slug}
                    onPress={() => setOfferCategory(cat.slug)}
                    className="rounded-pill px-4 py-2"
                    style={{
                      backgroundColor: isActive ? "#FFD400" : "rgba(169,169,169,0.12)",
                    }}
                  >
                    <Text
                      className={`font-mont-semibold text-[13px] ${
                        isActive ? "text-black" : "text-text-secondary"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredOffers.length === 0 ? (
              <EmptyState
                icon="pricetags-outline"
                title="No offers found"
                message={offerSearch || offerCategory !== "all" ? "Try different filters" : "No open offers yet"}
              />
            ) : (
              filteredOffers.map((offer) => (
                <OfferCard key={offer._id} offer={offer} />
              ))
            )}

            {!isFournisseur && (
              <View className="mx-4 mt-2 mb-4">
                <Button
                  title="Create Offer"
                  onPress={() => router.push("/create-offer")}
                  fullWidth
                />
              </View>
            )}
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
