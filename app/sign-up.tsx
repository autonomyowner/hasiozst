import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { BackgroundImage } from "@/components/layout/BackgroundImage";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import type { UserRole, SellerType } from "@/lib/types";

type Step = "role" | "form";

const roleCards: {
  key: UserRole;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "customer",
    label: "Customer",
    description: "Browse products & services, watch reels, and order easily.",
    icon: "cart-outline",
  },
  {
    key: "freelancer",
    label: "Freelancer",
    description:
      "Offer your services, get hired by clients, and manage your projects easily.",
    icon: "briefcase-outline",
  },
  {
    key: "seller",
    label: "Seller",
    description:
      "Sell products, receive orders, and grow your business online.",
    icon: "storefront-outline",
  },
];

const sellerTypes: { key: SellerType; label: string }[] = [
  { key: "fournisseur", label: "Fournisseur (Supplier)" },
  { key: "importateur", label: "Importateur (Importer)" },
  { key: "grossiste", label: "Grossiste (Wholesaler)" },
];

export default function SignUpScreen() {
  const router = useRouter();
  const ensureUser = useMutation(api.users.ensureUser);

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("customer");
  const [sellerType, setSellerType] = useState<SellerType>("fournisseur");

  // Form fields
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Invalid email format";
    if (phone.trim() && !/^0[5-7][0-9]{8}$/.test(phone.trim()))
      newErrors.phone = "Invalid phone format (e.g. 05XXXXXXXX)";
    if (!password.trim()) newErrors.password = "Password is required";
    if (password.length < 8) newErrors.password = "Minimum 8 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");

    let result;
    try {
      result = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });
    } catch (err: unknown) {
      setLoading(false);
      setGeneralError(err instanceof Error ? err.message : "Network error. Check your connection.");
      return;
    }

    if (result.error) {
      setLoading(false);
      setGeneralError(result.error.message ?? "Sign up failed. Try again.");
      return;
    }

    // Retry ensureUser — auth session needs time to propagate to Convex
    const maxRetries = 5;
    let succeeded = false;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Wait before each attempt (increasing delay: 800ms, 1.2s, 1.8s, 2.5s, 3.5s)
      await new Promise((r) => setTimeout(r, 800 + attempt * 500));
      try {
        await ensureUser({
          name: name.trim(),
          email: email.trim(),
          avatar: "",
          role,
          sellerType: role === "seller" ? sellerType : undefined,
        });
        succeeded = true;
        break;
      } catch {
        // Auth session not ready yet — retry
      }
    }

    if (!succeeded) {
      setLoading(false);
      setGeneralError("Account created but profile setup failed. Please sign in to complete setup.");
      return;
    }

    setLoading(false);
    router.replace("/");
  };

  // Step 1 — Role Selection
  if (step === "role") {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <BackgroundImage
            source={require("@/assets/images/profile-cover-gold.jpg")}
            height={320}
          >
            <View className="px-6 pt-14">
              <Text className="font-mont-bold text-lg text-primary">
                HASIO
              </Text>
            </View>
          </BackgroundImage>

          <View className="px-6 -mt-8 flex-1">
            <Text className="font-mont-bold text-3xl text-white mb-1">
              Create Your{"\n"}Account
            </Text>
            <Text className="font-mont text-sm text-text-secondary mb-6">
              Choose how you want to use the platform.
            </Text>

            <View className="h-px bg-text-secondary/20 mb-5" />

            {/* Role cards */}
            <View style={{ gap: 10 }}>
              {roleCards.map((r) => {
                const isSelected = role === r.key;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => setRole(r.key)}
                    className={`flex-row items-center rounded-card p-4 ${
                      isSelected
                        ? "bg-primary"
                        : "bg-card"
                    }`}
                  >
                    <View
                      className={`h-11 w-11 rounded-xl items-center justify-center mr-3 ${
                        isSelected ? "bg-black/20" : "bg-surface"
                      }`}
                    >
                      <Ionicons
                        name={r.icon}
                        size={22}
                        color={isSelected ? "#000" : "#898989"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-mont-semibold text-sm ${
                          isSelected ? "text-black" : "text-white"
                        }`}
                      >
                        {r.label}
                      </Text>
                      <Text
                        className={`font-mont text-xs mt-0.5 ${
                          isSelected ? "text-black/70" : "text-text-secondary"
                        }`}
                        numberOfLines={2}
                      >
                        {r.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Seller type sub-selection */}
            {role === "seller" && (
              <View className="mt-4" style={{ gap: 8 }}>
                <Text className="font-mont-medium text-sm text-white">
                  Seller Type
                </Text>
                {sellerTypes.map((st) => (
                  <Pressable
                    key={st.key}
                    onPress={() => setSellerType(st.key)}
                    className={`rounded-card px-4 py-3 ${
                      sellerType === st.key
                        ? "bg-card border border-primary"
                        : "bg-card"
                    }`}
                  >
                    <Text
                      className={`font-mont-medium text-sm ${
                        sellerType === st.key ? "text-primary" : "text-white"
                      }`}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Continue button */}
            <View className="mt-6">
              <Button
                title={`Continue as ${roleCards.find((r) => r.key === role)?.label}`}
                onPress={() => setStep("form")}
                fullWidth
              />
            </View>

            <Pressable
              onPress={() => router.replace("/sign-in")}
              className="mt-6 mb-8 items-center"
            >
              <Text className="font-mont text-sm text-text-secondary">
                Already have an account?{" "}
                <Text className="font-mont-bold text-primary">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step 2 — Registration Form
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior="padding"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Back button */}
        <Pressable onPress={() => setStep("role")} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        <Text className="font-mont-bold text-3xl text-white mb-1">
          Create Your{"\n"}Account
        </Text>
        <Text className="font-mont text-sm text-text-secondary mb-6">
          Join and start trading today.
        </Text>

        <View className="h-px bg-text-secondary/20 mb-5" />

        {generalError ? (
          <View className="bg-error/10 rounded-card p-3 mb-4">
            <Text className="font-mont text-sm text-error text-center">
              {generalError}
            </Text>
          </View>
        ) : null}

        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          error={errors.name}
        />

        {role === "seller" && (
          <TextInput
            label="Business Name (Optional for buyers)"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Business name (optional)"
          />
        )}

        <TextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 05XXXXXXXX"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
          secureTextEntry
          error={errors.password}
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Text className="font-mont text-xs text-text-secondary text-center mt-4 mb-2 px-2">
          By creating an account, you agree to our{" "}
          <Text
            className="font-mont-semibold text-primary"
            onPress={() => router.push("/terms-of-service")}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            className="font-mont-semibold text-primary"
            onPress={() => router.push("/privacy-policy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>

        <View className="mt-2">
          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
          />
        </View>

        <Pressable
          onPress={() => router.replace("/sign-in")}
          className="mt-6 mb-8 items-center"
        >
          <Text className="font-mont text-sm text-text-secondary">
            Already have an account?{" "}
            <Text className="font-mont-bold text-primary">Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
