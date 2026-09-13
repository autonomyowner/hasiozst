import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppImage } from "@/components/ui/AppImage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Message } from "@/lib/types";

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const CONTEXT_ROUTES: Record<string, string> = {
  product: "/product",
  order: "/order",
  service: "/service",
  offer: "/offer",
  wholesaleProduct: "/wholesale-product",
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { markAsRead } = useConversations();
  const { messages, send, deleteMessage } = useMessages(id);
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const conversation = useQuery(
    api.conversations.getById,
    id ? { id: id as Id<"conversations"> } : "skip"
  );

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (id && conversation) {
      markAsRead(id);
    }
  }, [id, messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText("");
    await send(text);
    setSending(false);
  }, [inputText, sending, send]);

  const handleDeleteMessage = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    await deleteMessage(deleteTarget);
  };

  const navigateToContext = () => {
    if (!conversation) return;
    const route = CONTEXT_ROUTES[conversation.contextType];
    if (route) {
      router.push(`${route}/${conversation.contextId}` as any);
    }
  };

  if (!conversation) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="font-mont text-text-secondary">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isP1 = conversation.participant1Id === user?._id;
  const otherName = isP1
    ? conversation.participant2Name
    : conversation.participant1Name;
  const otherAvatar = isP1
    ? conversation.participant2Avatar
    : conversation.participant1Avatar;

  // Messages come in desc order from the query — inverted FlatList shows them correctly
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.senderId === user?._id;
    const nextMessage = messages[index + 1]; // older message (desc order)
    const showDateSep =
      !nextMessage || !isSameDay(item.createdAt, nextMessage.createdAt);

    return (
      <View>
        {showDateSep && (
          <View className="items-center my-3">
            <Text className="font-mont text-xs text-text-secondary bg-surface px-3 py-1 rounded-full">
              {formatDateSeparator(item.createdAt)}
            </Text>
          </View>
        )}
        <Pressable
          onLongPress={isMine ? () => setDeleteTarget(item._id) : undefined}
          className={`mb-1.5 px-4 ${isMine ? "items-end" : "items-start"}`}
        >
          <View
            style={{
              maxWidth: "75%",
              backgroundColor: isMine ? "#FFD400" : "#0C0C0C",
              borderRadius: 18,
              ...(isMine
                ? { borderBottomRightRadius: 4 }
                : { borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#333" }),
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Montserrat_400Regular",
                fontSize: 14,
                color: isMine ? "#000" : "#fff",
              }}
            >
              {item.text}
            </Text>
            <View
              className="flex-row items-center mt-1"
              style={{ gap: 4, alignSelf: isMine ? "flex-end" : "flex-start" }}
            >
              <Text
                style={{
                  fontFamily: "Montserrat_400Regular",
                  fontSize: 10,
                  color: isMine ? "rgba(0,0,0,0.5)" : "#898989",
                }}
              >
                {formatMessageTime(item.createdAt)}
              </Text>
              {isMine && (
                <Ionicons
                  name={item.isRead ? "checkmark-done" : "checkmark"}
                  size={12}
                  color={item.isRead ? "#000" : "rgba(0,0,0,0.4)"}
                />
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b border-[#222]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <AppImage
          source={otherAvatar}
          style={{ width: 36, height: 36, borderRadius: 18 }}
        />
        <View className="flex-1 ml-3">
          <Text className="font-mont-semibold text-base text-white" numberOfLines={1}>
            {otherName}
          </Text>
          <Pressable onPress={navigateToContext} className="flex-row items-center">
            <Ionicons
              name={
                ({
                  product: "cube-outline",
                  order: "receipt-outline",
                  service: "construct-outline",
                  offer: "pricetag-outline",
                  wholesaleProduct: "storefront-outline",
                } as Record<string, keyof typeof Ionicons.glyphMap>)[conversation.contextType] ??
                "ellipse-outline"
              }
              size={11}
              color="#898989"
            />
            <Text
              className="font-mont text-xs text-text-secondary ml-1"
              numberOfLines={1}
            >
              {conversation.contextTitle}
            </Text>
            <Ionicons name="chevron-forward" size={11} color="#898989" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ paddingVertical: 8 }}
          maxToRenderPerBatch={15}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="chatbubble-outline" size={32} color="#898989" />
              <Text className="font-mont text-sm text-text-secondary mt-2">
                Start the conversation
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View
          className="flex-row items-end px-4 pt-3 border-t border-[#222]"
          style={{ gap: 10, paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#898989"
            multiline
            maxLength={1000}
            style={{
              flex: 1,
              backgroundColor: "#0C0C0C",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 10,
              maxHeight: 100,
              color: "#fff",
              fontFamily: "Montserrat_400Regular",
              fontSize: 14,
              borderWidth: 1,
              borderColor: "#333",
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: inputText.trim() ? "#FFD400" : "#222",
            }}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "#000" : "#898989"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Message"
        message="Delete this message? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteMessage}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}
