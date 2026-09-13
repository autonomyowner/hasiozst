import { FlatList, View } from "react-native";
import { ProductCard } from "@/components/cards/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Product } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";

interface ProductRowProps {
  title: string;
  subtitle?: string;
  products: Product[];
  actionLabel?: string;
  onAction?: () => void;
}

export function ProductRow({
  title,
  subtitle,
  products,
  actionLabel,
  onAction,
}: ProductRowProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();

  return (
    <View>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyExtractor={(item) => item._id}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            isFavorite={isFavorite(item._id)}
            onToggleFavorite={() => toggleFavorite(item._id)}
            onAddToCart={() => addItem(item._id)}
          />
        )}
      />
    </View>
  );
}
