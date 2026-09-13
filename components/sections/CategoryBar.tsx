import { ScrollView } from "react-native";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Category } from "@/lib/types";

interface CategoryBarProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryBar({
  categories,
  activeId,
  onSelect,
}: CategoryBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
    >
      {categories.map((cat) => (
        <CategoryPill
          key={cat.slug}
          label={cat.label}
          isActive={cat.slug === activeId}
          onPress={() => onSelect(cat.slug)}
        />
      ))}
    </ScrollView>
  );
}
