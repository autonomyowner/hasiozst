import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { ClientRequestStatus } from "@/lib/types";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "@/providers/ToastProvider";

export function useClientRequests(status?: ClientRequestStatus) {
  const { isAuthenticated } = useCurrentUser();
  const raw = useQuery(
    api.clientRequests.listForFreelancer,
    !isAuthenticated ? "skip" as const : status ? { status } : {}
  );
  return { requests: raw ?? [], isLoading: isAuthenticated && raw === undefined };
}

export function useNewRequestCount() {
  const { isAuthenticated } = useCurrentUser();
  return useQuery(api.clientRequests.countNewForFreelancer, !isAuthenticated ? "skip" as const : undefined) ?? 0;
}

export function useClientRequestActions() {
  const acceptMutation = useMutation(api.clientRequests.accept);
  const declineMutation = useMutation(api.clientRequests.decline);
  const completeMutation = useMutation(api.clientRequests.complete);
  const clearAllMutation = useMutation(api.clientRequests.clearAllForFreelancer);
  const { showError } = useToast();

  const accept = async (requestId: string) => {
    try {
      await acceptMutation({ requestId: requestId as Id<"clientRequests"> });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to accept request");
    }
  };

  const decline = async (requestId: string) => {
    try {
      await declineMutation({ requestId: requestId as Id<"clientRequests"> });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to decline request");
    }
  };

  const complete = async (requestId: string) => {
    try {
      await completeMutation({ requestId: requestId as Id<"clientRequests"> });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to complete request");
    }
  };

  const clearAll = async () => {
    try {
      await clearAllMutation();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to clear requests");
    }
  };

  return { accept, decline, complete, clearAll };
}
