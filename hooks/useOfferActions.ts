import { useMutation } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";
import type { OfferType } from "@/lib/types";
import type { Id } from "../convex/_generated/dataModel";

interface CreateOfferInput {
  title: string;
  description: string;
  productName: string;
  quantity: number;
  unit: string;
  type: OfferType;
  minPrice: number;
  deadline: string;
  category?: string;
}

export function useOfferActions() {
  const createOfferMutation = useMutation(api.offers.create);
  const createBidMutation = useMutation(api.bids.create);
  const acceptBidMutation = useMutation(api.bids.accept);
  const rejectBidMutation = useMutation(api.bids.reject);
  const { showError, showSuccess } = useToast();

  const createOffer = async (input: CreateOfferInput): Promise<string> => {
    try {
      const offerId = await createOfferMutation(input);
      return offerId;
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create offer");
      throw err;
    }
  };

  const submitBid = async (offerId: string, amount: number, message: string, phone?: string) => {
    try {
      await createBidMutation({
        offerId: offerId as Id<"offers">,
        amount,
        message,
        ...(phone ? { phone } : {}),
      });
      showSuccess("Bid submitted successfully!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit bid");
      throw err;
    }
  };

  const acceptOfferBid = async (bidId: string) => {
    try {
      await acceptBidMutation({ bidId: bidId as Id<"bids"> });
      showSuccess("Bid accepted!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to accept bid");
    }
  };

  const rejectOfferBid = async (bidId: string) => {
    try {
      await rejectBidMutation({ bidId: bidId as Id<"bids"> });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to reject bid");
    }
  };

  return { createOffer, submitBid, acceptOfferBid, rejectOfferBid };
}
