import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  ctaLabel?: string;
  onPress?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  ctaLabel,
  onPress,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="items-center justify-center rounded-full mb-4"
        style={{
          width: 72,
          height: 72,
          backgroundColor: "rgba(169,169,169,0.12)",
        }}
      >
        <Ionicons name={icon} size={32} color="#898989" />
      </View>
      <Text className="font-mont-bold text-base text-white mb-1 text-center">
        {title}
      </Text>
      <Text className="font-mont text-sm text-text-secondary text-center">
        {message}
      </Text>
      {ctaLabel && onPress && (
        <Pressable
          onPress={onPress}
          className="mt-4 bg-primary rounded-pill px-6 py-2.5"
        >
          <Text className="font-mont-semibold text-sm text-black">
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
