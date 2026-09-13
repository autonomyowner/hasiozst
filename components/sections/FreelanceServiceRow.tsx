import { FlatList, View } from "react-native";
import { FreelanceServiceCard } from "@/components/cards/FreelanceServiceCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FreelanceService } from "@/lib/types";

interface FreelanceServiceRowProps {
  title: string;
  services: FreelanceService[];
  actionLabel?: string;
  onAction?: () => void;
}

export function FreelanceServiceRow({
  title,
  services,
  actionLabel,
  onAction,
}: FreelanceServiceRowProps) {
  return (
    <View>
      <SectionHeader
        title={title}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <FlatList
        data={services}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <FreelanceServiceCard service={item} />}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}
