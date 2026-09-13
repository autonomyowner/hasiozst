import { Pressable, Text } from "react-native";

interface CategoryPillProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

export function CategoryPill({
  label,
  isActive = false,
  onPress,
}: CategoryPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 px-4 py-2 ${
        isActive ? "bg-primary" : "bg-pill-inactive"
      }`}
      style={[
        { borderRadius: isActive ? 35 : 19 },
        isActive && {
          shadowColor: "#1A4B5F",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        },
      ]}
    >
      <Text
        className={`font-mont-medium text-sm ${
          isActive ? "text-white" : "text-text-primary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
