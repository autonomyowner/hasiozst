import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/providers/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteAccountButton() {
  const router = useRouter();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const clearPushToken = useMutation(api.users.clearPushToken);
  const { showError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await clearPushToken().catch(() => {});
      await deleteAccount();
      try {
        await authClient.signOut();
      } catch {
        // Local session cleanup only
      }
      router.replace("/sign-in");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to delete account",
      );
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setConfirmOpen(true)}
        className="mx-4 mt-2 mb-8 items-center py-3"
      >
        <Text
          className="font-mont-medium text-sm"
          style={{ color: "#DC2626" }}
        >
          Delete Account
        </Text>
      </Pressable>

      <ConfirmModal
        visible={confirmOpen}
        title="Delete account permanently?"
        message="This will permanently delete your products, services, reels, comments, cart, favorites, notifications, and personal info. Past orders are kept for the other party but stripped of your name and contact details. This cannot be undone."
        variant="danger"
        confirmLabel="Delete forever"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </>
  );
}
