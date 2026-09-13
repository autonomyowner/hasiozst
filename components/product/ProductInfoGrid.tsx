import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InfoItem {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ProductInfoGridProps {
  items: InfoItem[];
}

export function ProductInfoGrid({ items }: ProductInfoGridProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {items.map((item, index) => (
        <View
          key={index}
          className="rounded-card bg-card p-3"
          style={{ width: "48.5%" }}
        >
          <View className="flex-row items-center mb-1.5">
            {/* Icon with circular background (matches Figma) */}
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                backgroundColor: "rgba(26,75,95,0.10)",
              }}
            >
              <Ionicons name={item.icon} size={14} color="#5F6E63" />
            </View>
            <Text className="font-mont text-xs text-text-secondary ml-2 flex-1">
              {item.label}
            </Text>
          </View>
          <Text className="font-mont-semibold text-sm text-text-primary ml-0.5">
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
