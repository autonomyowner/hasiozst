import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-start justify-between px-4 pb-2 pt-4">
      <View>
        <Text className="font-mont-semibold text-2xl text-text-primary">
          {title}
        </Text>
        {subtitle && (
          <Text className="font-mont text-xs text-text-secondary mt-1">
            {subtitle}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="flex-row items-center mt-1">
          <Text className="font-mont-medium text-sm text-primary mr-1">
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#1A4B5F" />
        </Pressable>
      )}
    </View>
  );
}
