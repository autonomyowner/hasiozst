import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { WholesaleOffer } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/formatters";

interface OfferCardProps {
  offer: WholesaleOffer;
}

const statusVariant = {
  open: "success" as const,
  closed: "neutral" as const,
  expired: "error" as const,
};

const statusLabel = {
  open: "Open",
  closed: "Closed",
  expired: "Expired",
};

export function OfferCard({ offer }: OfferCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/offer/${offer._id}`)}
      className="mx-4 mb-3 rounded-card bg-card p-4 active:opacity-80"
    >
      {/* Title & Badges */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-mont-semibold text-base text-white">
            {offer.title}
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-0.5">
            by {offer.creatorName}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <Badge
            label={offer.type === "auction" ? "Auction" : "Negotiable"}
            variant={offer.type === "auction" ? "primary" : "neutral"}
          />
          <Badge
            label={statusLabel[offer.status]}
            variant={statusVariant[offer.status]}
          />
        </View>
      </View>

      {/* Description */}
      <Text
        className="font-mont text-sm text-text-secondary mt-2"
        numberOfLines={2}
      >
        {offer.description}
      </Text>

      {/* Stats row */}
      <View className="flex-row items-center justify-between mt-3">
        <View>
          <Text className="font-mont text-xs text-text-secondary">
            Min Price
          </Text>
          <Text className="font-mont-bold text-sm text-primary">
            {formatPrice(offer.minPrice)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="font-mont text-xs text-text-secondary">Bids</Text>
          <Text className="font-mont-bold text-sm text-white">
            {offer.bidCount}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-mont text-xs text-text-secondary">
            Deadline
          </Text>
          <Text className="font-mont-medium text-sm text-white">
            {formatDate(offer.deadline)}
          </Text>
        </View>
      </View>

      {/* Best bid highlight */}
      {offer.currentBestBid !== null && (
        <View className="mt-2 rounded-lg bg-surface px-3 py-2">
          <Text className="font-mont text-xs text-text-secondary">
            Best Bid
          </Text>
          <Text className="font-mont-bold text-sm text-primary">
            {formatPrice(offer.currentBestBid ?? 0)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
