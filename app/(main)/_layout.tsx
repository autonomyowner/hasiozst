import { View, Text, Pressable, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useQuery } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";
import { useGuest } from "@/providers/GuestProvider";
import { MaterialTopTabs, type TopTabBarProps } from "@/components/layout/MaterialTopTabs";
import {
  HomeIcon,
  ReelsIcon,
  ServicesIcon,
  HotelsIcon,
  ProfileIcon,
} from "@/components/TabIcons";


const SCREEN_WIDTH = Dimensions.get("window").width;

const TAB_ICONS: Record<string, React.FC<{ color: string; size: number }>> = {
  home: HomeIcon,
  reels: ReelsIcon,
  services: ServicesIcon,
  hotels: HotelsIcon,
  profile: ProfileIcon,
};

const TAB_LABELS: Record<string, string> = {
  home: "Home",
  reels: "Reels",
  services: "Services",
  hotels: "Hotels",
  profile: "Profile",
};

// Screens that stay registered for navigation but never appear in the tab bar
const TAB_BAR_ROUTES = ["home", "reels", "services", "hotels", "profile"];

function CustomTabBar({ state, descriptors, navigation }: TopTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 8;
  const { isGuest } = useGuest();
  const unreadCount = useQuery(api.notifications.getUnreadCount, isGuest ? "skip" : undefined) ?? 0;

  // Home, Reels, Services, Hotels and Profile are the only tabs — cart and
  // dashboard stay registered as swipeable screens but are reached from the
  // home header / profile menu instead.
  const visibleRoutes = TAB_BAR_ROUTES.map((name) =>
    state.routes.find((r) => r.name === name)
  ).filter((r): r is (typeof state.routes)[number] => r !== undefined);

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F8F4ED",
        height: 80 + insets.bottom,
        paddingBottom: bottomPadding,
        paddingTop: 10,
        shadowColor: "#1A4B5F",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 0,
        borderTopWidth: 1,
        borderTopColor: "#E3DBCA",
      }}
    >
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;
        const color = isFocused ? "#1A4B5F" : "#5F6E63";
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
              {route.name === "profile" && unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10,
                    backgroundColor: "#DC2626",
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
                      color: "#FFFFFF",
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

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={(props: TopTabBarProps) => <CustomTabBar {...props} />}
      initialLayout={{ width: SCREEN_WIDTH }}
      overdrag={true}
      overScrollMode="never"
      offscreenPageLimit={1}
      pagerStyle={{ backgroundColor: "#F8F4ED" }}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: { backgroundColor: "#F8F4ED" },
      }}
    >
      <MaterialTopTabs.Screen name="home" options={{ title: "Home" }} />
      <MaterialTopTabs.Screen name="reels" options={{ title: "Reels" }} />
      <MaterialTopTabs.Screen name="services" options={{ title: "Services" }} />
      <MaterialTopTabs.Screen name="hotels" options={{ title: "Hotels" }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* Registered for navigation only — not shown in the tab bar */}
      <MaterialTopTabs.Screen name="cart" options={{ title: "Cart" }} />
      <MaterialTopTabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
    </MaterialTopTabs>
  );
}
