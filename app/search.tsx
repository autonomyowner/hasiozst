import { View, Text, FlatList, Pressable, useWindowDimensions } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "@/components/ui/SearchBar";
import { ProductCard } from "@/components/cards/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import type { Id } from "../convex/_generated/dataModel";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();

  const results = useQuery(
    api.products.search,
    query.trim() ? { query: query.trim() } : "skip"
  ) ?? [];

  const promotedProducts = useQuery(api.promotions.listActiveWithProducts) ?? [];

  // Filter promoted products that match the search query, prepend to results
  const mergedResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchLower = query.trim().toLowerCase();
    const matchingPromoted = promotedProducts.filter((p) =>
      p.name.toLowerCase().includes(searchLower)
    );

    // Deduplicate: remove promoted IDs from regular results
    const promotedIds = new Set(matchingPromoted.map((p) => p._id));
    const regularResults = results.filter((r) => !promotedIds.has(r._id as string));

    return [
      ...matchingPromoted.map((p) => ({
        ...p,
        _id: p._id as any,
        sellerId: p.sellerId as any,
        isActive: true,
        isPromoted: true as const,
      })),
      ...regularResults.map((r) => ({
        ...r,
        isPromoted: false as const,
      })),
    ];
  }, [query, results, promotedProducts]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 gap-3">
        <View className="flex-1">
          <SearchBar
            placeholder="Search products, brands..."
            onChangeText={setQuery}
          />
        </View>
        <Pressable onPress={() => router.back()}>
          <Text className="font-mont-medium text-sm text-primary">Cancel</Text>
        </Pressable>
      </View>

      {/* Results */}
      {query.trim() === "" ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-mont text-sm text-text-secondary text-center">
            Search for products, brands, or sellers
          </Text>
        </View>
      ) : mergedResults.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-mont-medium text-base text-white">
            No results found
          </Text>
          <Text className="mt-1 font-mont text-sm text-text-secondary text-center">
            Try searching for something else
          </Text>
        </View>
      ) : (
        <FlatList
          data={mergedResults}
          keyExtractor={(item) => `${item.isPromoted ? "promo-" : ""}${item._id}`}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <ProductCard
                product={item as any}
                isFavorite={isFavorite(item._id as Id<"products">)}
                onToggleFavorite={() => toggleFavorite(item._id as Id<"products">)}
                onAddToCart={() => addItem(item._id as Id<"products">)}
                fullWidth
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
