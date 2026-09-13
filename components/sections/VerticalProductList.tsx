import { FlatList, View } from "react-native";
import { useCallback } from "react";
import { VerticalProductCard } from "@/components/cards/VerticalProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Product } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";

interface VerticalProductListProps {
  title: string;
  products: Product[];
  actionLabel?: string;
  onAction?: () => void;
}

export function VerticalProductList({
  title,
  products,
  actionLabel,
  onAction,
}: VerticalProductListProps) {
  const { toggleFavorite, isFavorite } = useFavorites();

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <VerticalProductCard
        product={item}
        isFavorite={isFavorite(item._id)}
        onToggleFavorite={() => toggleFavorite(item._id)}
      />
    ),
    [isFavorite, toggleFavorite]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  return (
    <View>
      <SectionHeader
        title={title}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEnabled={false}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}
