import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function usePromotions() {
  const myPromotions = useQuery(api.promotions.listByCreator) ?? [];
  const createPromotion = useMutation(api.promotions.create);
  const removePromotion = useMutation(api.promotions.remove);
  const recordImpression = useMutation(api.promotions.recordImpression);
  const recordClick = useMutation(api.promotions.recordClick);

  return { myPromotions, createPromotion, removePromotion, recordImpression, recordClick };
}
