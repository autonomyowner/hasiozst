import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export function CartEmptyState() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Cart icon in gray circle */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: 69,
          height: 69,
          backgroundColor: "rgba(26,75,95,0.14)",
        }}
      >
        <Ionicons name="cart-outline" size={32} color="#5F6E63" />
      </View>

      {/* Title */}
      <Text className="mt-5 font-mont-bold text-[22px] text-text-primary">
        Cart
      </Text>

      {/* Empty message with letter spacing */}
      <Text
        className="mt-2 font-mont text-xs text-text-primary text-center"
        style={{ letterSpacing: 3.48 }}
      >
        Your cart is empty
      </Text>

      {/* Short centered divider */}
      <View
        className="mt-5"
        style={{
          width: 38,
          height: 1,
          backgroundColor: "rgba(26,75,95,0.14)",
        }}
      />

      {/* CTA pill */}
      <Pressable
        onPress={() => router.replace("/(main)/home")}
        className="mt-5 flex-row items-center"
        style={{
          backgroundColor: "rgba(26,75,95,0.14)",
          borderRadius: 35,
          paddingLeft: 20,
          paddingRight: 6,
          paddingVertical: 8,
          gap: 10,
        }}
      >
        <Text className="font-mont-medium text-xs text-text-primary">
          Start shopping now
        </Text>
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 26,
            height: 26,
            backgroundColor: "rgba(26,75,95,0.14)",
          }}
        >
          <Ionicons name="arrow-forward" size={14} color="#0D1A12" />
        </View>
      </Pressable>
    </View>
  );
}
