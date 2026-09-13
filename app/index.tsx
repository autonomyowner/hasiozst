import { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserRole } from "@/hooks/useUserRole";
import { useGuest } from "@/providers/GuestProvider";
import { ONBOARDING_KEY } from "./onboarding";

export default function Index() {
  const { effectiveRole, isLoading, isAuthenticated, currentUser } = useUserRole();
  const { isGuest, isGuestLoading } = useGuest();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [userWaitTimedOut, setUserWaitTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setHasSeenOnboarding(val === "true");
      setCheckingOnboarding(false);
    });
  }, []);

  // Timeout: if authenticated but user profile never loads, stop waiting after 6s
  useEffect(() => {
    if (isAuthenticated && !currentUser && !userWaitTimedOut) {
      timerRef.current = setTimeout(() => setUserWaitTimedOut(true), 6000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (currentUser && timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [isAuthenticated, currentUser, userWaitTimedOut]);

  if (isLoading || checkingOnboarding || isGuestLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  // First-time users see onboarding
  if (!hasSeenOnboarding && !isAuthenticated && !isGuest) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/sign-in" />;
  }

  if (isGuest) {
    return <Redirect href="/(main)/home" />;
  }

  // Wait for user data before deciding route (timeout after 6s to prevent infinite spinner)
  if (isAuthenticated && !currentUser && !userWaitTimedOut) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  if (effectiveRole === "importateur" || effectiveRole === "grossiste" || effectiveRole === "fournisseur") {
    return <Redirect href="/(grociste)/home" />;
  }

  return <Redirect href="/(main)/home" />;
}
