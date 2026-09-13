import { View, Text, Pressable, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";
import { useGuest } from "@/providers/GuestProvider";
import { MaterialTopTabs } from "@/components/layout/MaterialTopTabs";
import {
  HomeIcon,
  ReelsIcon,
  CartIcon,
  DashboardIcon,
  ProfileIcon,
} from "@/components/TabIcons";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";

const SCREEN_WIDTH = Dimensions.get("window").width;

const TAB_ICONS: Record<string, React.FC<{ color: string; size: number }>> = {
  home: HomeIcon,
  reels: ReelsIcon,
  cart: CartIcon,
  dashboard: DashboardIcon,
  profile: ProfileIcon,
};

const TAB_LABELS: Record<string, string> = {
  home: "Home",
  reels: "Reels",
  cart: "Cart",
  dashboard: "Dashboard",
  profile: "Profile",
};

function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 8;
  const { isGuest } = useGuest();
  const { effectiveRole } = useUserRole();
  const cartCount = useQuery(api.cart.getItemCount, isGuest ? "skip" : undefined) ?? 0;
  const unreadCount = useQuery(api.notifications.getUnreadCount, isGuest ? "skip" : undefined) ?? 0;

  // Determine which tabs to show — guests see all 5 tabs (content gated on the screens themselves)
  const hiddenTabs = new Set<string>();
  if (!isGuest && effectiveRole !== "customer" && effectiveRole !== "freelancer") {
    hiddenTabs.add("cart");
    hiddenTabs.add("dashboard");
  }

  const visibleRoutes = state.routes.filter((r) => !hiddenTabs.has(r.name));

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#000000",
        height: 80 + insets.bottom,
        paddingBottom: bottomPadding,
        paddingTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 0,
      }}
    >
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;
        const color = isFocused ? "#FFD400" : "#898989";
        const IconComponent = TAB_ICONS[route.name];
        const label = TAB_LABELS[route.name] ?? route.name;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "relative" }}>
              {IconComponent && <IconComponent color={color} size={22} />}
              {route.name === "cart" && cartCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10,
                    backgroundColor: "#FFD400",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontFamily: "Montserrat_700Bold",
                      fontSize: 9,
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
              {route.name === "profile" && unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10,
                    backgroundColor: "#EF4444",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Montserrat_700Bold",
                      fontSize: 9,
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                color,
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 10,
                marginTop: 4,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainLayout() {
  const { isGuest, isGuestLoading } = useGuest();
  const { effectiveRole, currentUser, isAuthenticated, isLoading } = useUserRole();

  // Not authenticated and not guest — must sign in
  if (!isLoading && !isGuestLoading && !isAuthenticated && !isGuest) {
    return <Redirect href="/sign-in" />;
  }

  // B2B users should never be in (main) — redirect to their zone
  if (!isGuest && isAuthenticated && currentUser && (effectiveRole === "importateur" || effectiveRole === "grossiste" || effectiveRole === "fournisseur")) {
    return <Redirect href="/(grociste)/home" />;
  }

  const showCart = !isGuest && (effectiveRole === "customer" || effectiveRole === "freelancer");
  const showDashboard = !isGuest && (effectiveRole === "customer" || effectiveRole === "freelancer");

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      initialLayout={{ width: SCREEN_WIDTH }}
      overdrag={true}
      overScrollMode="never"
      offscreenPageLimit={1}
      pagerStyle={{ backgroundColor: "#000" }}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: { backgroundColor: "#000" },
      }}
    >
      <MaterialTopTabs.Screen name="home" options={{ title: "Home" }} />
      <MaterialTopTabs.Screen name="reels" options={{ title: "Reels" }} />
      <MaterialTopTabs.Screen name="cart" options={{ title: "Cart" }} />
      <MaterialTopTabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
    </MaterialTopTabs>
  );
}
