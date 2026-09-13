import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { SubscriptionPlan } from "@/lib/types";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  onPress: () => void;
}

export function SubscriptionPlanCard({
  plan,
  onPress,
}: SubscriptionPlanCardProps) {
  const isPro = plan.popular;

  return (
    <Pressable onPress={onPress} style={{ width: 200 }} className="mr-3">
      <View className="rounded-card overflow-hidden" style={{ height: 280 }}>
        {isPro ? (
          <LinearGradient
            colors={["#3D3500", "#1A1600", "#0C0C0C"]}
            style={{ flex: 1, padding: 16 }}
          >
            <CardContent plan={plan} isPro />
          </LinearGradient>
        ) : (
          <View className="flex-1 bg-card p-4">
            <CardContent plan={plan} isPro={false} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function CardContent({
  plan,
  isPro,
}: {
  plan: SubscriptionPlan;
  isPro: boolean;
}) {
  return (
    <>
      {plan.popular && (
        <View className="self-start rounded-pill bg-primary/20 px-2 py-0.5 mb-1">
          <Text className="font-mont-semibold text-[9px] text-primary">
            MOST POPULAR
          </Text>
        </View>
      )}
      <Text
        className={`font-mont-bold text-base ${isPro ? "text-white" : "text-white"}`}
      >
        {plan.name}
      </Text>
      <Text className="font-mont text-xs text-text-secondary mt-0.5">
        {plan.id === "free"
          ? "Start selling with no commitment"
          : "Grow faster & get more visibility"}
      </Text>

      {/* Price */}
      <View className="flex-row items-baseline mt-3">
        <Text
          className={`font-mont-bold text-2xl ${isPro ? "text-white" : "text-white"}`}
        >
          {plan.price === 0 ? "0" : plan.price.toLocaleString("fr-DZ")}
        </Text>
        <Text className="font-mont-medium text-sm text-text-secondary ml-1.5">
          {plan.period}
        </Text>
      </View>

      {plan.popular && (
        <Text className="font-mont-semibold text-xs text-success mt-1">
          Save 6 000 DA
        </Text>
      )}

      {/* Feature list */}
      <View className="mt-3" style={{ gap: 4 }}>
        {plan.features.slice(0, 4).map((feature, i) => (
          <View key={i} className="flex-row items-center">
            <Ionicons
              name="checkmark"
              size={14}
              color={isPro ? "#FFD400" : "#898989"}
            />
            <Text className="font-mont text-xs text-text-secondary ml-1.5">
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
