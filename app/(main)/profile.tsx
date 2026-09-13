import { ScrollView, View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { DevRolePanel } from "@/components/dev/DevRolePanel";
import { Button } from "@/components/ui/Button";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrders } from "@/hooks/useOrders";
import { useGuest } from "@/providers/GuestProvider";
import { authClient } from "@/lib/auth-client";
import { formatCompactNumber } from "@/lib/formatters";

export default function ProfileScreen() {
  const { user, isLoading } = useCurrentUser();
  const { effectiveRole } = useUserRole();
  const router = useRouter();
  const { isGuest, exitGuestMode } = useGuest();
  const { buyerOrders } = useOrders();
  const clearPushToken = useMutation(api.users.clearPushToken);
  const allReels = useQuery(api.reels.list) ?? [];
  const userReels = useMemo(
    () => (user ? allReels.filter((r) => r.posterId === user._id) : []),
    [allReels, user]
  );

  const handleSignOut = async () => {
    await clearPushToken().catch(() => {});
    try {
      await authClient.signOut();
    } catch {
      // Sign out locally even if the server call fails
    }
    router.replace("/sign-in");
  };

  if (isGuest) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="items-center justify-center rounded-full mb-4"
            style={{ width: 80, height: 80, backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <Ionicons name="person-outline" size={36} color="#5F6E63" />
          </View>
          <Text className="font-mont-bold text-xl text-text-primary mb-2">
            Sign in to your account
          </Text>
          <Text className="font-mont text-sm text-text-secondary text-center mb-6">
            Create an account or sign in to access your profile, orders, and more.
          </Text>
          <Button
            title="Sign In"
            onPress={() => {
              exitGuestMode();
              router.replace("/sign-in");
            }}
            fullWidth
          />
          <Pressable
            onPress={() => {
              exitGuestMode();
              router.replace("/sign-up");
            }}
            className="mt-4 items-center py-3"
          >
            <Text className="font-mont text-sm text-text-secondary">
              Don't have an account?{" "}
              <Text className="font-mont-bold text-primary">Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A4B5F" />
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header — back arrow + "Profile" */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="h-[42px] w-[42px] items-center justify-center rounded-full"
            style={{ borderWidth: 1, borderColor: "rgba(26,75,95,0.14)" }}
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-semibold text-[15px] text-text-primary">
            Profile
          </Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Profile header (cover + avatar + name + role) */}
        {user && <ProfileHeader user={user} />}

        {/* Video Reel Showcase — sellers and freelancers only */}
        {(effectiveRole === "fournisseur" || effectiveRole === "freelancer") && (
        <View className="mx-4 mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {/* New video card */}
            <Pressable
              onPress={() => router.push("/create-reel")}
              className="items-center justify-center rounded-card"
              style={{
                width: 120,
                height: 130,
                backgroundColor: "rgba(26,75,95,0.10)",
                borderWidth: 1,
                borderColor: "rgba(26,75,95,0.14)",
                borderStyle: "dashed",
              }}
            >
              <View
                className="items-center justify-center rounded-full mb-2"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(26,75,95,0.14)",
                }}
              >
                <Ionicons name="add" size={20} color="#5F6E63" />
              </View>
              <Text className="font-mont-semibold text-xs text-text-primary">
                New video
              </Text>
              <Text
                className="font-mont text-[9px] text-text-secondary text-center mt-0.5 px-2"
                numberOfLines={2}
              >
                add new video for your profile
              </Text>
            </Pressable>

            {/* User's actual reels */}
            {userReels.map((reel) => (
              <VideoReelCard
                key={reel._id}
                image={reel.thumbnailUrl}
                views={formatCompactNumber(reel.likes + reel.shares)}
              />
            ))}
          </ScrollView>
        </View>
        )}

        {/* Dev role toggle — dev only */}
        <DevRolePanel />

        {/* Divider */}
        <View className="mx-4 mb-3 h-px" style={{ backgroundColor: "rgba(26,75,95,0.06)" }} />

        {/* Menu items */}
        <View className="mx-4 mb-3" style={{ gap: 8 }}>
          {/* Notifications */}
          <Pressable
            onPress={() => router.push("/notifications")}
            className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={18} color="#5F6E63" />
              <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
          </Pressable>

          {/* Dashboard */}
          <Pressable
            onPress={() => router.push("/(main)/dashboard")}
            className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="grid-outline" size={18} color="#5F6E63" />
              <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                Dashboard
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
          </Pressable>

          {/* My Orders */}
          <Pressable
            onPress={() => router.push("/my-orders")}
            className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="receipt-outline" size={18} color="#5F6E63" />
              <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                My Orders
              </Text>
            </View>
            <View className="flex-row items-center">
              {buyerOrders.length > 0 && (
                <View
                  className="rounded-full items-center justify-center mr-2"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: "#1A4B5F",
                  }}
                >
                  <Text className="font-mont-bold text-xs text-white">
                    {buyerOrders.length}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
            </View>
          </Pressable>

          {/* Favorites */}
          <Pressable
            onPress={() => router.push("/favorites")}
            className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={18} color="#5F6E63" />
              <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                Favorites
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
          </Pressable>

          {/* Delivery Settings - sellers only */}
          {(effectiveRole === "fournisseur" || effectiveRole === "importateur" || effectiveRole === "grossiste") && (
            <>
              <Pressable
                onPress={() => router.push("/delivery-settings")}
                className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
                style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="car-outline" size={18} color="#5F6E63" />
                  <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                    إعدادات التوصيل
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/my-shipments")}
                className="flex-row items-center justify-between rounded-card px-4 py-4 active:opacity-80"
                style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={18} color="#5F6E63" />
                  <Text className="font-mont-semibold text-sm text-text-primary ml-3">
                    شحناتي
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#5F6E63" />
              </Pressable>
            </>
          )}
        </View>

        {/* Legal links */}
        <View className="mx-4 mt-2 flex-row justify-center" style={{ gap: 16 }}>
          <Pressable onPress={() => router.push("/privacy-policy")}>
            <Text className="font-mont text-xs text-text-secondary underline">
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/terms-of-service")}>
            <Text className="font-mont text-xs text-text-secondary underline">
              Terms of Service
            </Text>
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          className="mx-4 mt-4 mb-2 items-center py-3"
        >
          <Text
            className="font-mont-medium text-sm"
            style={{ color: "#5F6E63" }}
          >
            Sign Out
          </Text>
        </Pressable>

        {/* Delete account — Play Store / GDPR requirement */}
        <DeleteAccountButton />
      </ScrollView>
      )}
    </ScreenContainer>
  );
}

function VideoReelCard({ image, views }: { image: string; views: string }) {
  return (
    <View
      className="rounded-card overflow-hidden"
      style={{ width: 140, height: 130 }}
    >
      <Image
        source={{ uri: image }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      {/* Play + views at bottom */}
      <View className="absolute bottom-2 left-2 flex-row items-center">
        <Ionicons name="play" size={12} color="#0D1A12" />
        <Text className="font-mont-medium text-[10px] text-text-primary ml-1">
          {views}
        </Text>
      </View>
    </View>
  );
}
