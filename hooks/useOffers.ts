import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCurrentUser } from "./useCurrentUser";

export function useOffers() {
  const { isAuthenticated } = useCurrentUser();
  const openOffers = useQuery(api.offers.listOpen) ?? [];
  const myOffers = useQuery(api.offers.listByCreator, !isAuthenticated ? "skip" as const : undefined) ?? [];

  return {
    openOffers,
    myOffers,
    getOpenOffers: () => openOffers,
    getOffersByCreator: () => myOffers,
  };
}

export function useOffer(id: string) {
  return useQuery(api.offers.getById, { id: id as Id<"offers"> });
}

export function useBids(offerId: string) {
  return useQuery(api.bids.listByOffer, { offerId: offerId as Id<"offers"> }) ?? [];
}
