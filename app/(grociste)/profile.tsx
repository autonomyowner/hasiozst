import { ScrollView, View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppImage } from "@/components/ui/AppImage";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DevRolePanel } from "@/components/dev/DevRolePanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSellerStats } from "@/hooks/useSellerStats";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";

export default function GrocisteProfileScreen() {
  const { user } = useCurrentUser();
  const stats = useSellerStats();
  const router = useRouter();
  const clearPushToken = useMutation(api.users.clearPushToken);

  if (!user || stats.isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  const handleSignOut = async () => {
    await clearPushToken().catch(() => {});
    try {
      await authClient.signOut();
    } catch {
      // Sign out locally even if the server call fails
    }
    router.replace("/sign-in");
  };

  const menuItems = [
    {
      label: "Edit Profile",
      description: "Update your name and photo.",
      icon: "person-outline" as const,
      onPress: () => router.push("/edit-profile"),
    },
    {
      label: "Notifications",
      description: "View your notifications.",
      icon: "notifications-outline" as const,
      onPress: () => router.push("/notifications"),
    },
    {
      label: "My Products",
      description: "Manage, edit, and update your product listings.",
      icon: "pricetags-outline" as const,
      onPress: () => router.push("/my-products"),
    },
    {
      label: "My Orders",
      description: "Track and manage active and completed orders.",
      icon: "receipt-outline" as const,
      onPress: () => router.push("/my-orders"),
    },
    {
      label: "Favorites",
      description: "Your saved products",
      icon: "heart-outline" as const,
      onPress: () => router.push("/favorites"),
    },
    {
      label: "Subscription Plan",
      description: user?.plan === "pro" ? "Current Plan: Pro Seller" : "Upgrade to Pro",
      icon: "diamond-outline" as const,
      onPress: () => router.push("/subscription-plan?plan=pro"),
      highlight: true,
    },
    {
      label: "إعدادات التوصيل",
      description: "Manage delivery providers (Yalidine, Maystro, ZR Express)",
      icon: "car-outline" as const,
      onPress: () => router.push("/delivery-settings"),
    },
    {
      label: "شحناتي",
      description: "Track all your shipments",
      icon: "cube-outline" as const,
      onPress: () => router.push("/my-shipments"),
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <View className="px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Cover banner */}
        <View className="mx-4 mt-3 rounded-card overflow-hidden" style={{ height: 107 }}>
          <Image
            source={require("@/assets/images/profile-cover-gold.jpg")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>

        {/* Avatar + name + badge */}
        <View className="px-4 mb-5" style={{ marginTop: -32 }}>
          {user?.avatar ? (
            <View
              className="rounded-full items-center justify-center"
              style={{ width: 70, height: 70, borderWidth: 3, borderColor: "#000" }}
            >
              <AppImage
                source={user.avatar}
                style={{ width: 64, height: 64, borderRadius: 32 }}
              />
            </View>
          ) : (
            <View
              className="h-[70px] w-[70px] rounded-full bg-surface items-center justify-center"
              style={{ borderWidth: 3, borderColor: "#000" }}
            >
              <Text className="font-mont-bold text-2xl text-primary">
                {user?.name?.charAt(0) ?? "S"}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mt-3">
            <Text className="font-mont-bold text-lg text-white">
              {user?.name ?? "Seller"}
            </Text>
            {user?.plan === "pro" && (
              <View
                className="ml-2 flex-row items-center rounded-pill px-2.5 py-0.5"
                style={{ backgroundColor: "#423B19" }}
              >
                <Text className="font-mont-semibold text-[10px] text-primary">
                  Pro Seller
                </Text>
                <Ionicons name="star" size={10} color="#FFD400" style={{ marginLeft: 3 }} />
              </View>
            )}
          </View>
          <Text className="font-mont text-sm text-text-secondary mt-0.5">
            {user?._creationTime
              ? new Date(user._creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : ""}
          </Text>
        </View>

        {/* Stats grid 2x2 */}
        <View className="mx-4 mb-4" style={{ gap: 8 }}>
          {/* Row 1 */}
          <View className="flex-row" style={{ gap: 8 }}>
            {/* Completion Rate */}
            <View className="flex-1 rounded-card bg-card p-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="flame-outline" size={14} color="#EF4444" />
                <Text className="font-mont-medium text-xs text-white ml-1">
                  Completion Rate
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-mont-bold text-xl text-primary">
                    {stats.completionRate}%
                  </Text>
                  <Text className="font-mont text-[10px] text-text-secondary">
                    30 days
                  </Text>
                </View>
                <DonutChart
                  percentage={stats.completionRate}
                  color="#EF4444"
                  size={44}
                />
              </View>
            </View>

            {/* Orders */}
            <View className="flex-1 rounded-card bg-card p-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cube-outline" size={14} color="#3B82F6" />
                <Text className="font-mont-medium text-xs text-white ml-1">
                  Orders
                </Text>
                <Text className="font-mont text-[9px] text-text-secondary ml-0.5">
                  (Last 30 Days)
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-mont-bold text-xl text-primary">
                    {stats.ordersLast30Days}
                  </Text>
                  <Text className="font-mont text-[10px] text-text-secondary">
                    Orders
                  </Text>
                </View>
                <DonutChart
                  percentage={Math.min(100, (stats.ordersLast30Days / 150) * 100)}
                  color="#3B82F6"
                  size={44}
                />
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View className="flex-row" style={{ gap: 8 }}>
            {/* Response Time */}
            <View className="flex-1 rounded-card bg-card p-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={14} color="#FFD400" />
                <Text className="font-mont-medium text-xs text-white ml-1">
                  Response Time
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-mont-bold text-xl text-primary">
                    {stats.responseTimeMinutes > 0
                      ? `${Math.floor(stats.responseTimeMinutes / 60)}h ${stats.responseTimeMinutes % 60}m`
                      : "—"}
                  </Text>
                  <Text className="font-mont text-[10px] text-text-secondary">
                    time
                  </Text>
                </View>
                <BarChart
                  values={stats.ordersLast30Days > 0 ? [3, 5, 4, 6, 5] : [0, 0, 0, 0, 0]}
                  color="#FFD400"
                  height={35}
                />
              </View>
            </View>

            {/* Revenue */}
            <View className="flex-1 rounded-card bg-card p-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cash-outline" size={14} color="#22C55E" />
                <Text className="font-mont-medium text-xs text-white ml-1">
                  Revenue
                </Text>
                <Text className="font-mont text-[9px] text-text-secondary ml-0.5">
                  (This Month)
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-mont-bold text-base text-primary">
                    {stats.revenueThisMonth.toLocaleString("fr-DZ")}
                  </Text>
                  <Text className="font-mont text-[10px] text-text-secondary">
                    DA
                  </Text>
                </View>
                <LineChart
                  values={stats.revenueThisMonth > 0 ? [10, 30, 20, 50, 40, 60, 45] : [0, 0, 0, 0, 0, 0, 0]}
                  color="#22C55E"
                  width={55}
                  height={30}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Dev role toggle */}
        <DevRolePanel />

        {/* Menu items */}
        <View className="mx-4 mb-4" style={{ gap: 8 }}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className="flex-row items-center justify-between rounded-card px-4 py-4"
              style={{ backgroundColor: "rgba(169,169,169,0.08)" }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name={item.icon} size={20} color="#898989" />
                <View className="ml-3">
                  <Text className="font-mont-medium text-sm text-white">
                    {item.label}
                  </Text>
                  <Text
                    className={`font-mont text-xs mt-0.5 ${
                      item.highlight ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#898989" />
            </Pressable>
          ))}
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
          className="mx-4 mt-2 mb-2 items-center py-3"
        >
          <Text className="font-mont-medium text-sm text-text-secondary">
            Sign Out
          </Text>
        </Pressable>

        {/* Delete account — Play Store / GDPR requirement */}
        <DeleteAccountButton />
      </ScrollView>
    </ScreenContainer>
  );
}
