import { View, Text } from "react-native";
import { formatPrice } from "@/lib/formatters";

interface OrderSummaryTableProps {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export function OrderSummaryTable({
  productName,
  quantity,
  unitPrice,
}: OrderSummaryTableProps) {
  const subtotal = quantity * unitPrice;

  return (
    <View className="rounded-card bg-card p-4" style={{ gap: 10 }}>
      <View className="flex-row justify-between">
        <Text className="font-mont-medium text-sm text-text-secondary">
          Product
        </Text>
        <Text
          className="font-mont-semibold text-sm text-white flex-1 text-right"
          numberOfLines={1}
        >
          {productName}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="font-mont-medium text-sm text-text-secondary">
          Quantity
        </Text>
        <Text className="font-mont-semibold text-sm text-white">
          {quantity}
        </Text>
      </View>
      <View className="h-px bg-surface" />
      <View className="flex-row justify-between">
        <Text className="font-mont-medium text-sm text-text-secondary">
          Subtotal
        </Text>
        <Text className="font-mont-bold text-sm text-primary">
          {formatPrice(subtotal)}
        </Text>
      </View>
    </View>
  );
}
