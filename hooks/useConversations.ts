import { useQuery, useMutation } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "@/providers/ToastProvider";
import type { ConversationContextType } from "@/lib/types";

export function useConversations() {
  const { isAuthenticated } = useCurrentUser();
  const { showError } = useToast();
  const skip = !isAuthenticated ? ("skip" as const) : undefined;

  const conversations = useQuery(api.conversations.listForUser, skip) ?? [];
  const unreadTotal = useQuery(api.conversations.getUnreadTotal, skip) ?? 0;

  const getOrCreateMutation = useMutation(api.conversations.getOrCreate);
  const markAsReadMutation = useMutation(api.conversations.markAsRead);
  const deleteConversationMutation = useMutation(api.conversations.deleteConversation);

  const getOrCreate = async (
    otherUserId: string,
    contextType: ConversationContextType,
    contextId: string,
    contextTitle: string
  ): Promise<string | null> => {
    try {
      const id = await getOrCreateMutation({
        otherUserId: otherUserId as Id<"users">,
        contextType,
        contextId,
        contextTitle,
      });
      return id;
    } catch (e: any) {
      showError(e.message || "Failed to start conversation");
      return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markAsReadMutation({ id: id as Id<"conversations"> });
    } catch {
      // Silent — best effort
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await deleteConversationMutation({ id: id as Id<"conversations"> });
    } catch (e: any) {
      showError(e.message || "Failed to delete conversation");
    }
  };

  return {
    conversations,
    unreadTotal,
    getOrCreate,
    markAsRead,
    deleteConversation,
  };
}
