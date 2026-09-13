import { View, Text, Pressable, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useUserRole } from "@/hooks/useUserRole";
import { MaterialTopTabs } from "@/components/layout/MaterialTopTabs";
import {
  HomeIcon,
  DemandesIcon,
  ReelsIcon,
  AdsIcon,
  DashboardIcon,
  ProfileIcon,
} from "@/components/TabIcons";
import { useViewMode } from "@/hooks/useViewMode";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";

const SCREEN_WIDTH = Dimensions.get("window").width;

const TAB_ICONS: Record<string, React.FC<{ color: string; size: number }>> = {
  home: HomeIcon,
  demandes: DemandesIcon,
  ads: AdsIcon,
  "seller-dashboard": DashboardIcon,
  profile: ProfileIcon,
};

const TAB_LABELS: Record<string, string> = {
  home: "Home",
  demandes: "Demandes",
  ads: "Ads",
  "seller-dashboard": "Dashboard",
  profile: "Profile",
};

function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 8;
  const { isB2CMode } = useViewMode();

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
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? "#FFD400" : "#898989";

        // Dynamic icon/label for demandes tab when in B2C mode
        let IconComponent = TAB_ICONS[route.name];
        let label = TAB_LABELS[route.name] ?? route.name;
        if (isB2CMode && route.name === "demandes") {
          IconComponent = ReelsIcon;
          label = "Reels";
        }

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
            {IconComponent && <IconComponent color={color} size={22} />}
            <Text
              style={{
                color,
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 10,
                marginTop: 2,
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

export default function GrocisteLayout() {
  const { isAuthenticated, isLoading, effectiveRole, currentUser } = useUserRole();

  // Not authenticated — must sign in
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  // B2C-only users (customer/freelancer) should not be in grociste zone
  if (!isLoading && isAuthenticated && currentUser &&
      effectiveRole !== "importateur" && effectiveRole !== "grossiste" && effectiveRole !== "fournisseur") {
    return <Redirect href="/(main)/home" />;
  }

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
      <MaterialTopTabs.Screen name="demandes" options={{ title: "Demandes" }} />
      <MaterialTopTabs.Screen name="ads" options={{ title: "Ads" }} />
      <MaterialTopTabs.Screen
        name="seller-dashboard"
        options={{ title: "Dashboard" }}
      />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
    </MaterialTopTabs>
  );
}
