import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";

export function useFreelanceServices(category?: string) {
  return useQuery(api.freelanceServices.list, category ? { category } : {}) ?? [];
}
