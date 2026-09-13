import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useQuery, usePaginatedQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ProductRow } from "@/components/sections/ProductRow";
import { ProductCard } from "@/components/cards/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";

const GRID_GAP = 12;
const GRID_PADDING = 16;
const PAGE_SIZE = 6;

export default function AllProductsScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();

  const promotionProducts = useQuery(api.promotions.listActiveWithProducts) ?? [];

  const {
    results: paginatedProducts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.products.listPaginated,
    {},
    { initialNumItems: PAGE_SIZE }
  );

  const handleEndReached = useCallback(() => {
    if (status === "CanLoadMore") loadMore(PAGE_SIZE);
  }, [status, loadMore]);

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-white">All Products</Text>
      </View>

      <FlatList
        data={paginatedProducts}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          paddingHorizontal: GRID_PADDING,
          paddingBottom: 24,
        }}
        columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        initialNumToRender={PAGE_SIZE}
        onEndReachedThreshold={0.5}
        onEndReached={handleEndReached}
        ListHeaderComponent={
          <View style={{ marginHorizontal: -GRID_PADDING, marginBottom: 12 }}>
            {promotionProducts.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ProductRow
                  title="Promotions"
                  subtitle="Special deals & offers"
                  products={promotionProducts as any}
                />
              </View>
            )}
            <SectionHeader title="All Products" subtitle="Browse everything" />
          </View>
        }
        ListFooterComponent={
          status === "LoadingMore" ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#FFD400" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          status === "LoadingFirstPage" ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#FFD400" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <ProductCard
              product={item}
              isFavorite={isFavorite(item._id)}
              onToggleFavorite={() => toggleFavorite(item._id)}
              onAddToCart={() => addItem(item._id)}
              fullWidth
            />
          </View>
        )}
      />
    </ScreenContainer>
  );
}
