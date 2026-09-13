import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

export function useNotifications() {
  const { isAuthenticated } = useCurrentUser();
  const skip = !isAuthenticated ? "skip" as const : undefined;
  const notifications = useQuery(api.notifications.listForUser, skip) ?? [];
  const unreadCount = useQuery(api.notifications.getUnreadCount, skip) ?? 0;
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteOneMutation = useMutation(api.notifications.deleteOne);
  const clearAllMutation = useMutation(api.notifications.clearAll);

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => markAsReadMutation({ id: id as Id<"notifications"> }),
    markAllAsRead: () => markAllAsReadMutation(),
    deleteOne: (id: string) => deleteOneMutation({ id: id as Id<"notifications"> }),
    clearAll: () => clearAllMutation(),
  };
}
