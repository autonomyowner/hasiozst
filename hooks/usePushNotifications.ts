import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { getNotifications } from "@/lib/pushNotifications";
import type { EventSubscription } from "expo-modules-core";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { useCurrentUser } from "./useCurrentUser";

// Show notifications even when the app is in the foreground.
// No-ops in Expo Go, where the native module is unavailable.
getNotifications()?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices with dev builds (not Expo Go)
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice) {
    return null;
  }

  // Create Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1A4B5F",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      ...(projectId ? { projectId } : {}),
    });
    return token;
  } catch {
    // projectId not available (no EAS config / dev client) — skip push registration
    return null;
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const savePushToken = useMutation(api.users.savePushToken);
  const unreadCount = useQuery(api.notifications.getUnreadCount, !user ? "skip" as const : undefined) ?? 0;
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // Register token when user is authenticated
  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token && token !== user.expoPushToken) {
        savePushToken({ token }).catch(() => {
          // Silently fail — push is best-effort
        });
      }
    });
  }, [user?._id]);

  // Set up notification listeners
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    // Notification received while app is open (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // No-op — the handler above shows the alert
      }
    );

    // User tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        navigateToNotification(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Sync badge count
  useEffect(() => {
    getNotifications()?.setBadgeCountAsync(unreadCount).catch(() => {});
  }, [unreadCount]);

  const navigateToNotification = useCallback(
    (data: Record<string, unknown> | undefined) => {
      const type = data?.type as string | undefined;
      const relatedId = data?.relatedId as string | undefined;

      if (!type || !relatedId) {
        // navigate (not push) prevents stacking duplicates
        router.navigate("/notifications");
        return;
      }

      switch (type) {
        case "order_placed":
        case "order_status_changed":
        case "stock_depleted":
        case "shipment_created":
        case "shipment_delivered":
        case "shipment_failed":
          router.navigate(`/order/${relatedId}`);
          break;
        case "bid_received":
        case "bid_accepted":
        case "bid_rejected":
        case "offer_closed":
          router.navigate(`/offer/${relatedId}`);
          break;
        case "service_request_received":
        case "service_request_accepted":
        case "service_request_completed":
        case "service_request_declined":
          router.navigate("/client-requests");
          break;
        case "demand_response_received":
        case "demand_response_accepted":
        case "demand_response_declined":
          router.navigate("/(grociste)/demandes");
          break;
        case "reel_comment":
          router.navigate("/(main)/reels");
          break;
        case "message_received":
          router.navigate(`/conversation/${relatedId}`);
          break;
        default:
          router.navigate("/notifications");
      }
    },
    [router]
  );

  return { navigateToNotification };
}

/**
 * Handle cold-start notification (app opened from a killed state via notification tap).
 * Call this once in the root layout.
 */
export async function getInitialNotificationResponse() {
  const Notifications = getNotifications();
  if (!Notifications) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}
