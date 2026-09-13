import { useState, useCallback } from "react";
import { View, Text, FlatList, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppImage } from "@/components/ui/AppImage";
import { formatPrice } from "@/lib/formatters";
import type { FreelanceService } from "@/lib/types";

const CATEGORIES = [
  "All",
  "Design",
  "Development",
  "Marketing",
  "Writing",
  "Video",
  "Photography",
  "Consulting",
  "Other",
];

const PAGE_SIZE = 10;

export default function ServicesScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const { user } = useCurrentUser();

  const categoryFilter =
    activeCategory === "All" ? undefined : activeCategory;

  // Paginated query for browsing
  const { results: paginatedResults, status, loadMore } = usePaginatedQuery(
    api.freelanceServices.listPaginated,
    searchText.trim() ? "skip" : { category: categoryFilter },
    { initialNumItems: PAGE_SIZE }
  );

  // Server-side search query
  const searchResults = useQuery(
    api.freelanceServices.search,
    searchText.trim() ? { searchQuery: searchText.trim() } : "skip"
  );

  const isSearching = searchText.trim().length > 0;
  const services = isSearching ? searchResults : paginatedResults;
  const isLoading = services === undefined;

  const handleLoadMore = useCallback(() => {
    if (!isSearching && status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [isSearching, status, loadMore]);

  const renderFooter = useCallback(() => {
    if (isSearching || status !== "LoadingMore") return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#FFD400" />
      </View>
    );
  }, [isSearching, status]);

  const renderItem = useCallback(({ item }: { item: FreelanceService }) => (
    <Pressable
      onPress={() => router.push(`/service/${item._id}`)}
      className="flex-1 mb-3"
    >
      <View className="overflow-hidden rounded-card bg-card">
        <View className="relative">
          <AppImage source={item.imageUrl} className="h-36 w-full" />
          {item.images && item.images.length > 1 && (
            <View className="absolute top-2 right-2 flex-row items-center bg-black/60 rounded-full px-1.5 py-0.5">
              <Ionicons name="images-outline" size={10} color="#fff" />
              <Text className="font-mont text-[10px] text-white ml-0.5">
                {item.images.length}
              </Text>
            </View>
          )}
        </View>
        <View className="p-3" style={{ gap: 4 }}>
          <Text
            className="font-mont-medium text-sm text-white"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="font-mont text-xs text-text-secondary"
            numberOfLines={1}
          >
            {item.freelancerName}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-sm text-primary">
              {formatPrice(item.price)}
            </Text>
            <Text className="font-mont text-xs text-text-secondary">
              {item.rating} ({item.completedJobs})
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  ), [router]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-1" style={{ gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-white flex-1">
          Services
        </Text>
      </View>

      {/* Search */}
      <View className="mt-2">
        <SearchBar
          placeholder="Search services..."
          onChangeText={setSearchText}
        />
      </View>

      {/* Category tabs — underline style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}
        style={{ flexGrow: 0, marginTop: 4, marginBottom: 4 }}
      >
        {CATEGORIES.map((item) => {
          const isActive = activeCategory === item;
          return (
            <Pressable
              key={item}
              onPress={() => setActiveCategory(item)}
              style={{ paddingVertical: 8 }}
            >
              <Text
                className={`font-mont-semibold text-[13px] ${
                  isActive ? "text-white" : "text-text-secondary"
                }`}
              >
                {item}
              </Text>
              {isActive && (
                <View
                  className="mt-1 h-[2px] rounded-full bg-primary"
                  style={{ width: "100%" }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="mx-4 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      ) : services.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No services yet"
          message={user?.role === "freelancer" ? "Be the first to offer a service!" : "No services available right now."}
          ctaLabel={user?.role === "freelancer" ? "Create Service" : undefined}
          onPress={user?.role === "freelancer" ? () => router.push("/create-service") : undefined}
        />
      ) : (
        <FlatList
          data={services as FreelanceService[]}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          initialNumToRender={6}
        />
      )}
    </ScreenContainer>
  );
}
