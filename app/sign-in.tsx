import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { BackgroundImage } from "@/components/layout/BackgroundImage";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { useGuest } from "@/providers/GuestProvider";

export default function SignInScreen() {
  const router = useRouter();
  const { enterGuestMode } = useGuest();
  const ensureUser = useMutation(api.users.ensureUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Invalid email format";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");

    let result;
    try {
      result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
    } catch (err: unknown) {
      setLoading(false);
      setGeneralError(err instanceof Error ? err.message : "Network error. Check your connection.");
      return;
    }

    if (result.error) {
      setLoading(false);
      setGeneralError(result.error.message ?? "Sign in failed. Check your credentials.");
      return;
    }

    // Recovery: ensure user profile row exists (handles failed sign-up edge case)
    let ensured = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 800 + attempt * 500));
      try {
        await ensureUser({
          name: email.trim().split("@")[0],
          email: email.trim(),
          avatar: "",
          role: "customer",
        });
        ensured = true;
        break;
      } catch {
        // Auth session not ready yet or already exists — continue
      }
    }

    setLoading(false);
    if (!ensured) {
      setGeneralError("Signed in but profile setup is slow. The app will retry automatically.");
    }
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior="padding"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Top background image */}
        <BackgroundImage
          source={require("@/assets/media/photos/habitas-alula-pool.jpg")}
          height={320}
        >
          <View className="px-6 pt-14">
            <Text className="font-mont-bold text-lg text-primary">
              HASIO
            </Text>
          </View>
        </BackgroundImage>

        {/* Content */}
        <View className="px-6 -mt-8 flex-1">
          <Text className="font-mont-bold text-3xl text-text-primary mb-1">
            Welcome Back
          </Text>
          <Text className="font-mont text-sm text-text-secondary mb-6">
            Sign in to continue to your account.
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
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="........"
            secureTextEntry
            error={errors.password}
          />

          {/* Sign In button */}
          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
          />

          {/* Sign up link */}
          <Pressable
            onPress={() => router.replace("/sign-up")}
            className="mt-6 items-center"
          >
            <Text className="font-mont text-sm text-text-secondary">
              Don't have an account?{" "}
              <Text className="font-mont-bold text-primary">Sign Up</Text>
            </Text>
          </Pressable>

          {/* Continue as Guest */}
          <Pressable
            onPress={async () => {
              await authClient.signOut().catch(() => {});
              enterGuestMode();
              router.replace("/");
            }}
            className="mt-4 items-center py-3"
          >
            <Text className="font-mont-medium text-sm text-text-secondary">
              Continue as Guest
            </Text>
          </Pressable>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
