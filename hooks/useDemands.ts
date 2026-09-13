import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useDemand(id: string) {
  return useQuery(api.demandRequests.getById, { id: id as Id<"demandRequests"> });
}

export function useDemandResponses(demandId: string) {
  return useQuery(api.demandResponses.listByDemand, {
    demandId: demandId as Id<"demandRequests">,
  }) ?? [];
}
