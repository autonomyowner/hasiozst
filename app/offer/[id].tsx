import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ContentMenu } from "@/components/ui/ContentMenu";
import { useOffer, useBids } from "@/hooks/useOffers";
import { useOfferActions } from "@/hooks/useOfferActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { useConversations } from "@/hooks/useConversations";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { BidStatus } from "@/lib/types";

const bidStatusVariant: Record<BidStatus, "primary" | "success" | "error" | "neutral"> = {
  pending: "primary",
  accepted: "success",
  rejected: "error",
};

const bidStatusLabel: Record<BidStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const offer = useOffer(id ?? "");
  const bids = useBids(id ?? "");
  const { submitBid, acceptOfferBid, rejectOfferBid } = useOfferActions();
  const { user } = useCurrentUser();
  const { effectiveRole } = useUserRole();
  const { getOrCreate } = useConversations();

  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidPhone, setBidPhone] = useState("");
  const [bidErrors, setBidErrors] = useState<Record<string, string>>({});
  const [submittingBid, setSubmittingBid] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept] = useState<{ bidId: string; bidderName: string; amount: number } | null>(null);

  if (offer === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  if (!offer) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="font-mont-medium text-base text-text-secondary">
            Offer not found
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const isCreator = user?._id === offer.creatorId;
  const hasBid = bids.some((b) => b.bidderId === user?._id);
  const canBid = !!user && !isCreator && offer.status === "open" && !hasBid && effectiveRole === "grossiste";

  const handleSubmitBid = async () => {
    const errors: Record<string, string> = {};
    if (!bidAmount.trim() || isNaN(Number(bidAmount)))
      errors.amount = "Valid amount required";
    if (bidPhone.trim() && !/^0[5-7][0-9]{8}$/.test(bidPhone.trim()))
      errors.phone = "Invalid phone (e.g. 05XXXXXXXX)";
    setBidErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmittingBid(true);
    try {
      await submitBid(offer._id, Number(bidAmount), bidMessage.trim(), bidPhone.trim() || undefined);
      setBidAmount("");
      setBidMessage("");
      setBidPhone("");
    } catch {
      // Error handled in useOfferActions
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!confirmAccept) return;
    setAcceptingBidId(confirmAccept.bidId);
    await acceptOfferBid(confirmAccept.bidId);
    setAcceptingBidId(null);
    setConfirmAccept(null);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-card"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <ContentMenu
              targetType="offer"
              targetId={offer._id}
              ownerId={offer.creatorId}
              ownerName={offer.creatorName}
            />
          </View>
          <Text className="font-mont-bold text-xl text-white">
            {offer.title}
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-0.5">
            by {offer.creatorName}
          </Text>
        </View>

        {/* Info card */}
        <View className="mx-4 rounded-card bg-card p-4">
          <View className="flex-row gap-1.5 mb-3">
            <Badge
              label={offer.type === "auction" ? "Auction" : "Negotiable"}
              variant={offer.type === "auction" ? "primary" : "neutral"}
            />
            <Badge
              label={offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
              variant={
                offer.status === "open"
                  ? "success"
                  : offer.status === "expired"
                    ? "error"
                    : "neutral"
              }
            />
          </View>

          <Text className="font-mont text-sm text-text-secondary mb-3">
            {offer.description}
          </Text>

          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="font-mont text-xs text-text-secondary">
                Product
              </Text>
              <Text className="font-mont-medium text-sm text-white">
                {offer.productName}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-mont text-xs text-text-secondary">
                Quantity
              </Text>
              <Text className="font-mont-medium text-sm text-white">
                {offer.quantity} {offer.unit}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View>
              <Text className="font-mont text-xs text-text-secondary">
                Min Price
              </Text>
              <Text className="font-mont-bold text-sm text-primary">
                {formatPrice(offer.minPrice)}
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
        </View>

        {/* Bids */}
        <View className="mx-4 mt-4">
          <Text className="font-mont-bold text-lg text-white mb-3">
            Bids ({bids.length})
          </Text>

          {bids.length === 0 ? (
            <View className="rounded-card bg-card p-4">
              <Text className="font-mont text-sm text-text-secondary text-center">
                No bids yet
              </Text>
            </View>
          ) : (
            bids.map((bid) => (
              <View key={bid._id} className="rounded-card bg-card p-4 mb-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-mont-semibold text-sm text-white">
                      {bid.bidderName}
                    </Text>
                    <Text className="font-mont-bold text-base text-primary mt-0.5">
                      {formatPrice(bid.amount)}
                    </Text>
                  </View>
                  <Badge
                    label={bidStatusLabel[bid.status]}
                    variant={bidStatusVariant[bid.status]}
                  />
                </View>

                {bid.message ? (
                  <Text className="font-mont text-sm text-text-secondary mt-2">
                    {bid.message}
                  </Text>
                ) : null}

                <Text className="font-mont text-xs text-text-secondary mt-2">
                  {formatDate(bid.createdAt)}
                </Text>

                {/* Creator actions */}
                {isCreator && bid.status === "pending" && offer.status === "open" && (
                  <View className="flex-row gap-2 mt-3">
                    <View className="flex-1">
                      <Button
                        title="Accept"
                        onPress={() => setConfirmAccept({ bidId: bid._id, bidderName: bid.bidderName, amount: bid.amount })}
                        loading={acceptingBidId === bid._id}
                        size="sm"
                        fullWidth
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="Reject"
                        onPress={() => rejectOfferBid(bid._id)}
                        variant="outline"
                        size="sm"
                        fullWidth
                      />
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Bid form */}
        {canBid && (
          <View className="mx-4 mt-4">
            <Text className="font-mont-bold text-lg text-white mb-3">
              Place a Bid
            </Text>
            <TextInput
              label="Amount (DA)"
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder="Enter your bid amount"
              keyboardType="numeric"
              error={bidErrors.amount}
            />
            <TextInput
              label="Phone (optional)"
              value={bidPhone}
              onChangeText={setBidPhone}
              placeholder="05XXXXXXXX"
              keyboardType="phone-pad"
              error={bidErrors.phone}
            />
            <TextInput
              label="Message (optional)"
              value={bidMessage}
              onChangeText={setBidMessage}
              placeholder="Add a message to your bid..."
              multiline
              numberOfLines={2}
              style={{ textAlignVertical: "top", minHeight: 60 }}
            />
            <Button title="Submit Bid" onPress={handleSubmitBid} loading={submittingBid} fullWidth />
          </View>
        )}

        {/* Message button */}
        {user && !isCreator && (
          <View className="mx-4 mt-4">
            <Pressable
              onPress={async () => {
                const convId = await getOrCreate(
                  offer.creatorId,
                  "offer",
                  offer._id,
                  offer.title
                );
                if (convId) router.push(`/conversation/${convId}`);
              }}
              className="flex-row items-center justify-center rounded-card py-3.5"
              style={{ backgroundColor: "#0C0C0C", borderWidth: 1, borderColor: "#333", gap: 8 }}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#FFD400" />
              <Text className="font-mont-semibold text-sm text-primary">
                Message Creator
              </Text>
            </Pressable>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <ConfirmModal
        visible={!!confirmAccept}
        title="Accept Bid"
        message={`Accept bid of ${confirmAccept ? formatPrice(confirmAccept.amount) : ""} from ${confirmAccept?.bidderName ?? ""}? This will reject all other bids and close the offer.`}
        confirmLabel="Accept"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleAcceptBid}
        onCancel={() => setConfirmAccept(null)}
      />
    </ScreenContainer>
  );
}
