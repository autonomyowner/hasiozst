import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppImage } from "@/components/ui/AppImage";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/formatters";

export default function FavoritesScreen() {
  const productsQuery = useQuery(api.favorites.listWithProducts);
  const products = productsQuery ?? [];
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (productsQuery === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-white">Favorites</Text>
      </View>

      {products.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favorites yet"
          message="Save products you love!"
          ctaLabel="Browse Products"
          onPress={() => router.push("/(main)/home")}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD400"
              colors={["#FFD400"]}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/product/${item._id}`)}
              className="flex-1 mb-3"
            >
              <View className="overflow-hidden rounded-card bg-card">
                <View className="relative">
                  <AppImage
                    source={item.imageUrl}
                    className="h-44 w-full"
                  />
                  {item.isNew && (
                    <View className="absolute left-2 top-2">
                      <Badge label="NEW" variant="primary" />
                    </View>
                  )}
                </View>
                <View className="p-3" style={{ gap: 4 }}>
                  <Text
                    className="font-mont-medium text-sm text-white"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="font-mont-bold text-sm text-primary">
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
