import { useState } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/providers/ToastProvider";
import { ReportSheet, type ReportTargetType } from "./ReportSheet";
import { ConfirmModal } from "./ConfirmModal";

interface ContentMenuProps {
  /** The content being acted on. */
  targetType: ReportTargetType;
  targetId: string;
  /** The user who owns the content (omit when reporting a comment by an unknown user). */
  ownerId?: Id<"users"> | null;
  ownerName?: string;
  /** Render prop for the trigger — defaults to a 3-dot icon. */
  trigger?: (open: () => void) => React.ReactNode;
}

export function ContentMenu({
  targetType,
  targetId,
  ownerId,
  ownerName,
  trigger,
}: ContentMenuProps) {
  const { user } = useCurrentUser();
  const { showSuccess, showError } = useToast();
  const toggleBlock = useMutation(api.blocks.toggleBlock);
  const blockedQuery = useQuery(
    api.blocks.isBlocked,
    ownerId ? { targetUserId: ownerId } : "skip",
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const isOwn = Boolean(user && ownerId && user._id === ownerId);
  const canBlock = Boolean(user && ownerId && !isOwn);
  const isBlocked = Boolean(blockedQuery);

  const handleOpen = () => setMenuOpen(true);

  const handleReport = () => {
    setMenuOpen(false);
    setTimeout(() => setReportOpen(true), 150);
  };

  const handleBlockPress = () => {
    setMenuOpen(false);
    setTimeout(() => setConfirmBlockOpen(true), 150);
  };

  const handleConfirmBlock = async () => {
    if (!ownerId || busy) return;
    setBusy(true);
    try {
      const res = await toggleBlock({ targetUserId: ownerId });
      showSuccess(res.blocked ? "User blocked" : "User unblocked");
      setConfirmBlockOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update block");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger(handleOpen)
      ) : (
        <Pressable onPress={handleOpen} hitSlop={12} className="p-1">
          <Ionicons name="ellipsis-horizontal" size={20} color="#898989" />
        </Pressable>
      )}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setMenuOpen(false)}
        >
          <View
            className="bg-surface rounded-t-3xl mt-auto"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="h-1 w-10 rounded-full bg-card" />
            </View>

            {!isOwn && (
              <Pressable
                onPress={handleReport}
                className="flex-row items-center px-5 py-4"
              >
                <Ionicons name="flag-outline" size={20} color="#EF4444" />
                <Text className="font-mont-medium text-base text-white ml-3">
                  Report
                </Text>
              </Pressable>
            )}

            {canBlock && (
              <Pressable
                onPress={handleBlockPress}
                className="flex-row items-center px-5 py-4 border-t border-card"
              >
                <Ionicons
                  name={isBlocked ? "person-add-outline" : "remove-circle-outline"}
                  size={20}
                  color="#EF4444"
                />
                <Text className="font-mont-medium text-base text-white ml-3">
                  {isBlocked ? "Unblock user" : "Block user"}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setMenuOpen(false)}
              className="flex-row items-center justify-center py-4 border-t border-card"
            >
              <Text className="font-mont-medium text-base text-text-secondary">
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ReportSheet
        visible={reportOpen}
        targetType={targetType}
        targetId={targetId}
        onClose={() => setReportOpen(false)}
      />

      <ConfirmModal
        visible={confirmBlockOpen}
        title={isBlocked ? "Unblock user?" : "Block user?"}
        message={
          isBlocked
            ? `You will see ${ownerName ?? "this user"}'s content again.`
            : `You won't see ${ownerName ?? "this user"}'s content anywhere in the app. You can unblock them later.`
        }
        variant={isBlocked ? "info" : "warning"}
        confirmLabel={isBlocked ? "Unblock" : "Block"}
        loading={busy}
        onConfirm={handleConfirmBlock}
        onCancel={() => setConfirmBlockOpen(false)}
      />
    </>
  );
}
