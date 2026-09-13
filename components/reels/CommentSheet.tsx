import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaginatedQuery, type PaginatedQueryReference } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useReelActions } from "@/hooks/useReels";
import { useToast } from "@/providers/ToastProvider";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { ContentMenu } from "@/components/ui/ContentMenu";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../convex/_generated/dataModel";

interface CommentSheetProps {
  reelId: Id<"reels">;
  visible: boolean;
  commentCount: number;
  onClose: () => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentSheet({
  reelId,
  visible,
  commentCount,
  onClose,
}: CommentSheetProps) {
  const { addComment } = useReelActions(reelId);
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  // Bottom padding: lift the input above Android gesture bar / nav buttons
  // and iOS home indicator. Minimum 16px so it never sits flush.
  const bottomInset = Math.max(insets.bottom, 16);

  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(
    // Cast: server validator marks paginationOpts as v.optional for backwards-compat
    // with pre-April 2026 APKs, but usePaginatedQuery requires a strict pagination ref.
    api.reels.listComments as unknown as PaginatedQueryReference,
    visible ? { id: reelId } : "skip",
    { initialNumItems: 20 }
  );

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      await addComment(text);
      setText("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const isLoading = status === "LoadingFirstPage";
  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const blocked = useBlockedUsers();
  const visibleComments = comments.filter((c) => !blocked.has(c.userId));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* Backdrop — tap to dismiss */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Bottom sheet */}
        <View
          className="bg-surface rounded-t-3xl"
          style={{ maxHeight: "75%" }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-card">
            <Text className="font-mont-bold text-base text-white">
              Comments ({commentCount})
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="font-mont-bold text-lg text-text-secondary">
                x
              </Text>
            </Pressable>
          </View>

          {/* Comment list */}
          <FlatList
            data={visibleComments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            style={{ flexGrow: 0, flexShrink: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            onEndReached={() => {
              if (canLoadMore) loadMore(20);
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              isLoading ? (
                <ActivityIndicator
                  color="#FFD400"
                  style={{ paddingVertical: 32 }}
                />
              ) : (
                <Text className="font-mont text-sm text-text-secondary text-center py-8">
                  No comments yet. Be the first!
                </Text>
              )
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator
                  color="#FFD400"
                  style={{ paddingVertical: 16 }}
                />
              ) : null
            }
            renderItem={({ item }) => (
              <View className="mb-4 flex-row items-start">
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center mb-1">
                    <Text className="font-mont-semibold text-sm text-white">
                      {item.userName}
                    </Text>
                    <Text className="font-mont text-xs text-text-secondary ml-2">
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <Text className="font-mont text-sm text-text-secondary">
                    {item.text}
                  </Text>
                </View>
                <ContentMenu
                  targetType="reelComment"
                  targetId={item._id}
                  ownerId={item.userId}
                  ownerName={item.userName}
                  trigger={(open) => (
                    <Pressable onPress={open} hitSlop={8} className="ml-2 p-1">
                      <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                    </Pressable>
                  )}
                />
              </View>
            )}
          />

          {/* Input — bottom inset lifts it above Android nav bar / iOS home indicator */}
          <View
            className="flex-row items-center px-4 pt-3 border-t border-card"
            style={{ paddingBottom: bottomInset }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              className="flex-1 bg-card rounded-card px-4 py-2.5 text-white font-mont text-sm mr-3"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handlePost}
              blurOnSubmit
            />
            <Pressable
              onPress={handlePost}
              disabled={!text.trim() || posting}
              className="bg-primary rounded-card px-4 py-2.5"
              style={{ opacity: text.trim() && !posting ? 1 : 0.5 }}
            >
              <Text className="font-mont-bold text-sm text-black">Post</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
