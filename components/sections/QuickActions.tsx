import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuickAction {
  label: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <View className="mx-4 mt-4">
      <Text className="font-mont-bold text-lg text-text-primary mb-3">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            onPress={action.onPress}
            className="items-center p-3 rounded-card"
            style={{
              width: "31%",
              backgroundColor: "rgba(26,75,95,0.10)",
            }}
          >
            {action.icon && (
              <View
                className="items-center justify-center rounded-full mb-2"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "rgba(26,75,95,0.15)",
                }}
              >
                <Ionicons name={action.icon} size={18} color="#1A4B5F" />
              </View>
            )}
            <Text className="font-mont-semibold text-xs text-text-primary text-center">
              {action.label}
            </Text>
            <Text
              className="mt-0.5 font-mont text-[10px] text-text-secondary text-center"
              numberOfLines={2}
            >
              {action.description}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
