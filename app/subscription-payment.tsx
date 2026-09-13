import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput } from "@/components/ui/TextInput";
import { RadioButton } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { subscriptionPlans } from "@/lib/subscriptionPlans";
import { formatPrice } from "@/lib/formatters";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/providers/ToastProvider";

const paymentMethods = [
  { label: "Pay with Card", value: "card", description: "Visa - Mastercard" },
  { label: "CCP / Bank Transfer (Algeria)", value: "ccp", description: "Pay via CCP / Bank Transfer" },
  { label: "Mobile Payment", value: "mobile", description: "BaridiMob / Edahabia" },
];

export default function SubscriptionPaymentScreen() {
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const router = useRouter();
  const { currentUser: user, effectiveRole } = useUserRole();
  const plan = subscriptionPlans.find((p) => p.id === planId) ?? subscriptionPlans[1];

  const { showSuccess } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    // UI-only — simulate payment
    setTimeout(() => {
      setLoading(false);
      showSuccess(`Your ${plan.name} subscription is now active!`);
      const dest = effectiveRole === "importateur" || effectiveRole === "grossiste"
        ? "/(grociste)/home" : "/(main)/home";
      router.replace(dest);
    }, 1500);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mb-4"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <Text className="font-mont-bold text-xl text-white">
          Complete Your Payment
        </Text>
        <Text className="font-mont text-sm text-text-secondary mt-0.5 mb-5">
          Secure checkout to activate your subscription.
        </Text>

        {/* Plan summary card */}
        <LinearGradient
          colors={["#3D3500", "#1A1600", "#0C0C0C"]}
          className="rounded-card p-4 mb-4"
        >
          <View className="flex-row justify-between">
            <View>
              <Text className="font-mont-bold text-base text-white">
                {plan.name}
              </Text>
              <Text className="font-mont text-xs text-text-secondary">
                Grow faster & get more visibility
              </Text>
              <View className="flex-row items-baseline mt-2">
                <Text className="font-mont-bold text-2xl text-white">
                  {plan.price.toLocaleString("fr-DZ")}
                </Text>
                <Text className="font-mont text-sm text-text-secondary ml-1">
                  {plan.period}
                </Text>
              </View>
              <Text className="font-mont-semibold text-xs text-success mt-1">
                Save 6 000 DA
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              {plan.features.map((f, i) => (
                <View key={i} className="flex-row items-center">
                  <Ionicons name="checkmark" size={12} color="#FFD400" />
                  <Text className="font-mont text-[10px] text-text-secondary ml-1">
                    {f}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <Text className="font-mont text-xs text-text-secondary text-center mb-5">
          Subscription renews annually. Cancel anytime.
        </Text>

        {/* Payment Method */}
        <Text className="font-mont-bold text-base text-white mb-3">
          Select Payment Method
        </Text>
        <RadioButton
          options={paymentMethods}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />

        {/* Card form (shown when card selected) */}
        {paymentMethod === "card" && (
          <View className="mt-4">
            <TextInput
              label="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="Enter your full Card Number"
              keyboardType="number-pad"
            />
            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1">
                <TextInput
                  label="Expiry Date"
                  value={expiry}
                  onChangeText={setExpiry}
                  placeholder="DD/MM"
                />
              </View>
              <View className="flex-1">
                <TextInput
                  label="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  placeholder="CVV"
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>
            </View>
            <TextInput
              label="Cardholder Name"
              value={cardName}
              onChangeText={setCardName}
              placeholder="Enter your full Name"
            />
          </View>
        )}

        {/* Billing Details */}
        <Text className="font-mont-bold text-base text-white mt-5 mb-3">
          Billing Details
        </Text>
        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your Full Name"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your Phone Number"
          keyboardType="phone-pad"
        />

        {/* Order summary */}
        <View className="rounded-card bg-card p-4 mt-4" style={{ gap: 8 }}>
          <View className="flex-row justify-between">
            <Text className="font-mont text-sm text-text-secondary">Plan</Text>
            <Text className="font-mont-semibold text-sm text-white">
              {plan.name}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-mont text-sm text-text-secondary">
              Subtotal
            </Text>
            <Text className="font-mont-semibold text-sm text-white">
              {formatPrice(plan.price)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-mont text-sm text-text-secondary">Tax</Text>
            <Text className="font-mont-semibold text-sm text-white">
              {formatPrice(0)}
            </Text>
          </View>
          <View className="h-px bg-surface" />
          <View className="flex-row justify-between">
            <Text className="font-mont-bold text-sm text-white">Total</Text>
            <Text className="font-mont-bold text-sm text-primary">
              {formatPrice(plan.price)}
            </Text>
          </View>
        </View>

        {/* Pay button */}
        <View className="mt-6">
          <Button
            title={`Pay ${formatPrice(plan.price)} Securely`}
            onPress={handlePay}
            loading={loading}
            fullWidth
          />
        </View>

        <View className="flex-row items-center justify-center mt-4 mb-8">
          <Ionicons name="lock-closed" size={14} color="#898989" />
          <Text className="font-mont text-xs text-text-secondary ml-1.5">
            Your payment is encrypted and secure.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
