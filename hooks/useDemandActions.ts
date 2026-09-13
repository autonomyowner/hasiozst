import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";
import type { Id } from "../convex/_generated/dataModel";

export function useDemandActions() {
  const createResponseMutation = useMutation(api.demandResponses.create);
  const acceptResponseMutation = useMutation(api.demandResponses.accept);
  const declineResponseMutation = useMutation(api.demandResponses.decline);
  const { showError, showSuccess } = useToast();

  const submitResponse = async (
    demandId: string,
    phone: string,
    message: string,
    priceQuote: number
  ) => {
    try {
      await createResponseMutation({
        demandId: demandId as Id<"demandRequests">,
        phone,
        message,
        priceQuote,
      });
      showSuccess("Response submitted!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit response");
      throw err;
    }
  };

  const acceptResponse = async (responseId: string) => {
    try {
      await acceptResponseMutation({ responseId: responseId as Id<"demandResponses"> });
      showSuccess("Response accepted!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to accept response");
    }
  };

  const declineResponse = async (responseId: string) => {
    try {
      await declineResponseMutation({ responseId: responseId as Id<"demandResponses"> });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to decline response");
    }
  };

  return { submitResponse, acceptResponse, declineResponse };
}
