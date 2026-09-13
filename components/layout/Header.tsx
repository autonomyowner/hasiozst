import { View, Text, Pressable } from "react-native";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export function Header({ title, subtitle, rightAction }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View>
        {subtitle && (
          <Text className="font-mont text-sm text-text-secondary">
            {subtitle}
          </Text>
        )}
        {title && (
          <Text className="font-mont-bold text-xl text-white">{title}</Text>
        )}
      </View>
      {rightAction && (
        <Pressable onPress={rightAction.onPress}>
          <Text className="font-mont-semibold text-sm text-primary">
            {rightAction.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
