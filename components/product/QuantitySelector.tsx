import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 999,
}: QuantitySelectorProps) {
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <Text className="font-mont-semibold text-sm text-white">
        Select Quantity
      </Text>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Pressable
          onPress={onDecrease}
          disabled={quantity <= min}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            quantity <= min ? "bg-card" : "bg-primary"
          }`}
        >
          <Ionicons
            name="remove"
            size={18}
            color={quantity <= min ? "#898989" : "#000"}
          />
        </Pressable>
        <Text className="font-mont-bold text-lg text-white w-8 text-center">
          {quantity}
        </Text>
        <Pressable
          onPress={onIncrease}
          disabled={quantity >= max}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            quantity >= max ? "bg-card" : "bg-primary"
          }`}
        >
          <Ionicons
            name="add"
            size={18}
            color={quantity >= max ? "#898989" : "#000"}
          />
        </Pressable>
      </View>
    </View>
  );
}
