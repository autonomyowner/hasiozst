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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AppImage } from "@/components/ui/AppImage";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Conversation } from "@/lib/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const CONTEXT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  product: "cube-outline",
  order: "receipt-outline",
  service: "construct-outline",
  offer: "pricetag-outline",
  wholesaleProduct: "storefront-outline",
};

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

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { conversations, deleteConversation } = useConversations();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    await deleteConversation(deleteTarget);
  };

  const getOtherInfo = (conv: Conversation) => {
    if (!user) return { name: "", avatar: "" };
    const isP1 = conv.participant1Id === user._id;
    return {
      name: isP1 ? conv.participant2Name : conv.participant1Name,
      avatar: isP1 ? conv.participant2Avatar : conv.participant1Avatar,
    };
  };

  const getUnread = (conv: Conversation) => {
    if (!user) return 0;
    return conv.participant1Id === user._id
      ? conv.participant1Unread
      : conv.participant2Unread;
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#0D1A12" />
        </Pressable>
        <Text className="font-mont-bold text-xl text-text-primary flex-1">
          Messages
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="chatbubbles-outline" size={48} color="#5F6E63" />
          <Text className="font-mont-medium text-base text-text-secondary mt-4">
            No conversations yet
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-1 text-center px-8">
            Start a conversation by tapping "Message" on a product, service, or order.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
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
          renderItem={({ item: conv }) => {
            const other = getOtherInfo(conv);
            const unread = getUnread(conv);
            const contextIcon = CONTEXT_ICONS[conv.contextType] ?? "ellipse-outline";

            return (
              <ReanimatedSwipeable
                friction={2}
                rightThreshold={40}
                renderRightActions={(_progress, drag) => (
                  <RightDeleteAction
                    drag={drag}
                    onDelete={() => setDeleteTarget(conv._id)}
                  />
                )}
              >
                <Pressable
                  onPress={() => router.push(`/conversation/${conv._id}`)}
                  className={`mx-4 mb-2 rounded-card p-4 active:opacity-80 ${
                    unread > 0
                      ? "bg-card border border-primary/30"
                      : "bg-card"
                  }`}
                >
                  <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="relative">
                      <AppImage
                        source={other.avatar}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                      />
                      {unread > 0 && (
                        <View
                          className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1"
                        >
                          <Text className="font-mont-bold text-[10px] text-white">
                            {unread > 99 ? "99+" : unread}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`font-mont-semibold text-sm ${
                            unread > 0 ? "text-text-primary" : "text-text-primary"
                          }`}
                          numberOfLines={1}
                        >
                          {other.name}
                        </Text>
                        {conv.lastMessageAt && (
                          <Text className="font-mont text-xs text-text-secondary">
                            {timeAgo(conv.lastMessageAt)}
                          </Text>
                        )}
                      </View>

                      {/* Context badge */}
                      <View className="flex-row items-center mt-1">
                        <View className="flex-row items-center bg-surface rounded-full px-2 py-0.5">
                          <Ionicons name={contextIcon} size={10} color="#5F6E63" />
                          <Text
                            className="font-mont text-[10px] text-text-secondary ml-1"
                            numberOfLines={1}
                          >
                            {conv.contextTitle}
                          </Text>
                        </View>
                      </View>

                      {/* Last message preview */}
                      {conv.lastMessageText && (
                        <Text
                          className={`font-mont text-sm mt-1 ${
                            unread > 0
                              ? "text-text-primary"
                              : "text-text-secondary"
                          }`}
                          numberOfLines={1}
                        >
                          {conv.lastMessageSenderId === user?._id
                            ? `You: ${conv.lastMessageText}`
                            : conv.lastMessageText}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </ReanimatedSwipeable>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Conversation"
        message="This will permanently delete this conversation and all its messages."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}
