import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "@/providers/ToastProvider";

export function useMessages(conversationId: string | undefined) {
  const { isAuthenticated } = useCurrentUser();
  const { showError } = useToast();

  const skip = !isAuthenticated || !conversationId ? ("skip" as const) : undefined;

  const messages =
    useQuery(
      api.messages.list,
      skip ?? { conversationId: conversationId as Id<"conversations"> }
    ) ?? [];

  const sendMutation = useMutation(api.messages.send);
  const deleteMessageMutation = useMutation(api.messages.deleteMessage);

  const send = async (text: string) => {
    if (!conversationId) return;
    try {
      await sendMutation({
        conversationId: conversationId as Id<"conversations">,
        text,
      });
    } catch (e: any) {
      showError(e.message || "Failed to send message");
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteMessageMutation({ id: id as Id<"messages"> });
    } catch (e: any) {
      showError(e.message || "Failed to delete message");
    }
  };

  return {
    messages,
    send,
    deleteMessage,
  };
}
