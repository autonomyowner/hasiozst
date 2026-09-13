import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { subscriptionPlans } from "@/lib/subscriptionPlans";
import { formatPrice } from "@/lib/formatters";

export default function SubscriptionPlanScreen() {
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const router = useRouter();
  const plan = subscriptionPlans.find((p) => p.id === planId) ?? subscriptionPlans[0];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mb-4"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        {/* Plan name */}
        <Text className="font-mont-bold text-xl text-white">{plan.name}</Text>
        <Text className="font-mont text-sm text-text-secondary mt-1">
          {plan.id === "free"
            ? "Start selling with no commitment."
            : plan.id === "pro"
            ? "Grow faster & get more visibility."
            : "Enterprise-grade features for agencies."}
        </Text>

        {/* Price */}
        <View className="flex-row items-baseline mt-4">
          <Text className="font-mont-bold text-4xl text-primary">
            {plan.price === 0 ? "0" : plan.price.toLocaleString("fr-DZ")}
          </Text>
          <Text className="font-mont-medium text-lg text-text-secondary ml-2">
            {plan.period}
          </Text>
        </View>

        {plan.id === "free" && (
          <Text className="font-mont text-sm text-text-secondary mt-2">
            Perfect for new sellers who want to test the platform and start
            receiving orders.
          </Text>
        )}

        {/* What's Included */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFD400" />
            <Text className="font-mont-bold text-base text-white ml-2">
              What's Included
            </Text>
          </View>
          <View className="rounded-card bg-card p-4 flex-row flex-wrap" style={{ gap: 12 }}>
            {plan.features.map((feature, i) => (
              <View key={i} className="flex-row items-center" style={{ width: "45%" }}>
                <Ionicons name="checkmark" size={14} color="#FFD400" />
                <Text className="font-mont text-xs text-text-secondary ml-1.5">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Limitations (free plan) */}
        {plan.limitations && (
          <View className="mt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle-outline" size={20} color="#FFD400" />
              <Text className="font-mont-bold text-base text-white ml-2">
                Limitations
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              {plan.limitations.map((limitation, i) => (
                <View key={i} className="flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#FFD400" />
                  <Text className="font-mont text-sm text-white ml-2">
                    {limitation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Benefits (pro/agency) */}
        {plan.benefits && (
          <View className="mt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="star-outline" size={20} color="#FFD400" />
              <Text className="font-mont-bold text-base text-white ml-2">
                {plan.id === "agency" ? "Enterprise Advantages" : "Extra Benefits"}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {plan.benefits.map((benefit, i) => (
                <View key={i} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text className="font-mont text-sm text-white ml-2">
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <View className="mt-8">
          <Button
            title={plan.ctaText}
            onPress={() => {
              if (plan.id === "free") {
                router.back();
              } else {
                router.push(`/subscription-payment?plan=${plan.id}`);
              }
            }}
            fullWidth
          />
        </View>

        <Text className="font-mont text-xs text-text-secondary text-center mt-4">
          {plan.id === "free"
            ? "Upgrade anytime to unlock more features."
            : "Subscription renews automatically. Cancel anytime."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
