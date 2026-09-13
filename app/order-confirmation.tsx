import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-mont-bold text-2xl text-primary mb-2">
          Order Placed!
        </Text>
        <Text className="font-mont text-base text-text-secondary text-center mb-2">
          Your order has been successfully placed.
        </Text>
        <Text className="font-mont-medium text-sm text-text-primary mb-1">
          Order ID: {orderId}
        </Text>
        <Text className="font-mont text-sm text-text-secondary mb-8">
          Payment: Cash on Delivery
        </Text>

        <View className="w-full gap-3">
          <Button
            title="View Order"
            onPress={() => router.replace(`/order/${orderId}`)}
            fullWidth
          />
          <Button
            title="Continue Shopping"
            onPress={() => router.replace("/(main)/home")}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
