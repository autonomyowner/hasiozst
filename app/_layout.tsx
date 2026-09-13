// Diagnostic fetch/URL guard MUST be installed before Sentry.init() so that
// `fetchGuard:` errors are captured with their *real* call stack BEFORE Sentry's
// own fetch instrumentation wraps anything. See lib/fetchGuard.ts for details.
import { installFetchGuard } from "@/lib/fetchGuard";
installFetchGuard();

import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { AppProviders } from "@/providers/AppProviders";
import { usePushNotifications, getInitialNotificationResponse } from "@/hooks/usePushNotifications";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { initSentry, Sentry, reactNavigationIntegration } from "@/lib/sentry";
import "../global.css";

// Initialize Sentry as early as possible
initSentry();

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <Ionicons name="warning-outline" size={48} color="#FFD400" />
      <Text style={{ fontFamily: "Montserrat_700Bold", fontSize: 20, color: "#fff", marginTop: 16, textAlign: "center" }}>
        Something went wrong
      </Text>
      <Text style={{ fontFamily: "Montserrat_400Regular", fontSize: 14, color: "#898989", marginTop: 8, textAlign: "center" }}>
        {error.message || "An unexpected error occurred."}
      </Text>
      <Pressable onPress={retry} style={{ marginTop: 24, backgroundColor: "#FFD400", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12 }}>
        <Text style={{ fontFamily: "Montserrat_600SemiBold", fontSize: 14, color: "#000" }}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function PushRegistration() {
  const { navigateToNotification } = usePushNotifications();
  const initialHandled = useRef(false);

  // Handle cold-start: app opened from killed state via notification tap.
  // Runs once — getLastNotificationResponseAsync returns the same stale
  // response on every call, so without the ref guard each re-render would
  // push /notifications again (the old bug that stacked 5-6 screens).
  useEffect(() => {
    if (initialHandled.current) return;
    initialHandled.current = true;

    getInitialNotificationResponse().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        navigateToNotification(data);
      }
    });
  }, [navigateToNotification]);

  return null;
}

function RootLayout() {
  // Register the navigation container with Sentry's React Navigation integration
  // so that future crashes carry breadcrumbs identifying the screen the user was on.
  const navigationContainerRef = useNavigationContainerRef();
  const navIntegrationRegistered = useRef(false);
  useEffect(() => {
    if (!navIntegrationRegistered.current && navigationContainerRef?.current) {
      reactNavigationIntegration.registerNavigationContainer(navigationContainerRef);
      navIntegrationRegistered.current = true;
    }
  }, [navigationContainerRef]);

  const [fontsLoaded, fontError] = useFonts({
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const [fontTimeout, setFontTimeout] = useState(false);

  // Font load timeout — prevent infinite black screen if fonts fail to load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded) setFontTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  const fontsReady = fontsLoaded || fontError || fontTimeout;

  useEffect(() => {
    if (fontsReady) {
      // Hide native splash immediately — animated splash takes over
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("../assets/splash-icon.png")}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <AppProviders>
      {showSplash && <AnimatedSplash onFinish={handleSplashFinish} />}
      <PushRegistration />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(grociste)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
        <Stack.Screen name="sign-up" options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="product/[id]"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="search"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-confirmation" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="offer/[id]" />
        <Stack.Screen name="create-offer" />
        <Stack.Screen name="create-demand" />
        <Stack.Screen name="demand/[id]" />
        <Stack.Screen name="create-reel" />
        <Stack.Screen name="create-service" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="my-orders" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="all-products" />
        <Stack.Screen name="my-products" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="client-requests" />
        <Stack.Screen name="subscription-plan" />
        <Stack.Screen name="create-product" />
        <Stack.Screen name="edit-product" />
        <Stack.Screen name="my-wholesale-products" />
        <Stack.Screen name="edit-wholesale-product" />
        <Stack.Screen name="create-post" />
        <Stack.Screen name="subscription-payment" />
        <Stack.Screen name="wholesale-checkout" />
        <Stack.Screen name="services" />
        <Stack.Screen name="delivery-settings" />
        <Stack.Screen name="conversations" />
        <Stack.Screen name="conversation/[id]" />
        <Stack.Screen name="my-shipments" />
        <Stack.Screen name="wholesale-browse" />
        <Stack.Screen name="my-ads" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="terms-of-service" />
        <Stack.Screen
          name="wholesale-product/[id]"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="service/[id]"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="[...unmatched]" options={{ animation: "fade" }} />
      </Stack>
    </AppProviders>
  );
}

// Wrap with Sentry for automatic error capturing + performance tracing
export default Sentry.wrap(RootLayout);
