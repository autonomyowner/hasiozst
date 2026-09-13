import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function useFreelanceServices(category?: string) {
  return useQuery(api.freelanceServices.list, category ? { category } : {}) ?? [];
}
