import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/providers/ToastProvider";
import { formatDate } from "@/lib/formatters";
import type { AppNotification } from "@/lib/types";

function RightDeleteAction({
  drag,
  onDelete,
}: {
  drag: SharedValue<number>;
  onDelete: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));

  return (
    <Animated.View style={[{ width: 80 }, animatedStyle]}>
      <Pressable
        onPress={onDelete}
        className="flex-1 items-center justify-center bg-error mr-4 rounded-card"
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text className="font-mont-medium text-xs text-white mt-1">
          Delete
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteOne,
    clearAll,
  } = useNotifications();
  const { showError } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteOne(id);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    setShowClearModal(false);
    try {
      await clearAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to clear notifications");
    }
  };

  const handlePress = (notification: AppNotification) => {
    markAsRead(notification._id);
    const relatedId = notification.relatedId;
    const type = notification.type;
    if (!relatedId) {
      // No related entity — just mark as read (already done above)
      return;
    }

    switch (type) {
      case "order_placed":
      case "order_status_changed":
      case "stock_depleted":
        router.push(`/order/${relatedId}`);
        break;
      case "bid_received":
      case "bid_accepted":
      case "bid_rejected":
      case "offer_closed":
        router.push(`/offer/${relatedId}`);
        break;
      case "service_request_received":
      case "service_request_accepted":
      case "service_request_completed":
      case "service_request_declined":
        router.push("/client-requests");
        break;
      case "demand_response_received":
      case "demand_response_accepted":
      case "demand_response_declined":
        router.push("/(grociste)/demandes");
        break;
      case "shipment_created":
      case "shipment_delivered":
      case "shipment_failed":
        router.push(`/order/${relatedId}`);
        break;
      case "reel_comment":
        router.push("/(main)/reels");
        break;
      case "message_received":
        router.push(`/conversation/${relatedId}`);
        break;
      default:
        // Already on notifications screen — no navigation needed
        break;
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#0D1A12" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-mont-bold text-xl text-text-primary">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text className="font-mont text-sm text-text-secondary">
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Button
            title="Mark all read"
            onPress={() => markAllAsRead()}
            variant="ghost"
            size="sm"
          />
        )}
        {notifications.length > 0 && (
          <Pressable
            onPress={() => setShowClearModal(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-card ml-2"
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="font-mont-medium text-base text-text-secondary">
            No notifications
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A4B5F"
              colors={["#1A4B5F"]}
            />
          }
          renderItem={({ item: notification }) => (
            <ReanimatedSwipeable
              friction={2}
              rightThreshold={40}
              renderRightActions={(_progress, drag) => (
                <RightDeleteAction
                  drag={drag}
                  onDelete={() => handleDelete(notification._id)}
                />
              )}
              onSwipeableOpen={() => handleDelete(notification._id)}
            >
              <Pressable
                onPress={() => handlePress(notification)}
                className={`mx-4 mb-2 rounded-card p-4 active:opacity-80 ${
                  notification.read
                    ? "bg-card"
                    : "bg-card border border-primary/30"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-mont-semibold text-sm text-text-primary">
                      {notification.title}
                    </Text>
                    <Text className="font-mont text-sm text-text-secondary mt-1">
                      {notification.message}
                    </Text>
                    <Text className="font-mont text-xs text-text-secondary mt-1.5">
                      {formatDate(notification.createdAt)}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                  )}
                </View>
              </Pressable>
            </ReanimatedSwipeable>
          )}
        />
      )}

      <ConfirmModal
        visible={showClearModal}
        title="Clear All Notifications"
        message="This will permanently delete all your notifications. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </ScreenContainer>
  );
}
