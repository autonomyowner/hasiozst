import { View, Text } from "react-native";
import { DemandRequest } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";

interface RecentRequestsProps {
  requests: DemandRequest[];
}

const statusVariant = {
  new: "primary" as const,
  in_progress: "success" as const,
  completed: "neutral" as const,
};

const statusLabel = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
};

export function RecentRequests({ requests }: RecentRequestsProps) {
  return (
    <View className="mx-4 mt-4 mb-6">
      <Text className="font-mont-bold text-lg text-white mb-3">
        Recent Requests
      </Text>
      {requests.map((req) => (
        <View
          key={req._id}
          className="mb-2 rounded-card bg-card p-3 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="font-mont-medium text-sm text-white" numberOfLines={1}>
              {req.title}
            </Text>
            <Text className="font-mont text-xs text-text-secondary mt-0.5">
              {req.buyerName} - {formatDate(req.createdAt)}
            </Text>
          </View>
          <View className="items-end">
            <Badge label={statusLabel[req.status]} variant={statusVariant[req.status]} />
            <Text className="font-mont-semibold text-xs text-primary mt-1">
              {formatPrice(req.budget)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
