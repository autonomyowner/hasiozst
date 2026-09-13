import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useDemand, useDemandResponses } from "@/hooks/useDemands";
import { useDemandActions } from "@/hooks/useDemandActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { DemandResponseStatus } from "@/lib/types";

const responseStatusVariant: Record<DemandResponseStatus, "primary" | "success" | "error"> = {
  pending: "primary",
  accepted: "success",
  declined: "error",
};

const responseStatusLabel: Record<DemandResponseStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

const demandStatusLabel: Record<string, string> = {
  new: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

const demandStatusVariant: Record<string, "success" | "primary" | "neutral"> = {
  new: "success",
  in_progress: "primary",
  completed: "neutral",
};

export default function DemandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const demand = useDemand(id ?? "");
  const responses = useDemandResponses(id ?? "");
  const { submitResponse, acceptResponse, declineResponse } = useDemandActions();
  const { user } = useCurrentUser();
  const { effectiveRole } = useUserRole();

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [priceQuote, setPriceQuote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState<{ responseId: string; responderName: string; priceQuote: number } | null>(null);

  if (demand === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </ScreenContainer>
    );
  }

  if (!demand) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="font-mont-medium text-base text-text-secondary">
            Demand not found
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const isCreator = user?._id === demand.userId;
  const hasResponded = responses.some((r) => r.responderId === user?._id);
  const isB2BSeller = effectiveRole === "fournisseur" || effectiveRole === "importateur" || effectiveRole === "grossiste";
  const canRespond = !!user && !isCreator && isB2BSeller && demand.status !== "completed" && !hasResponded;

  const handleSubmitResponse = async () => {
    const newErrors: Record<string, string> = {};
    if (!phone.trim() || !/^0[5-7][0-9]{8}$/.test(phone.trim()))
      newErrors.phone = "Valid phone required (e.g. 05XXXXXXXX)";
    if (!priceQuote.trim() || isNaN(Number(priceQuote)) || Number(priceQuote) <= 0)
      newErrors.priceQuote = "Valid price quote required";
    if (!message.trim())
      newErrors.message = "Message is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await submitResponse(demand._id, phone.trim(), message.trim(), Number(priceQuote));
      setPhone("");
      setMessage("");
      setPriceQuote("");
    } catch {
      // Error handled in useDemandActions
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptResponse = async () => {
    if (!confirmAccept) return;
    await acceptResponse(confirmAccept.responseId);
    setConfirmAccept(null);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mb-2"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-white">
            {demand.title}
          </Text>
          <Text className="font-mont text-sm text-text-secondary mt-0.5">
            by {demand.buyerName}
          </Text>
        </View>

        {/* Info card */}
        <View className="mx-4 rounded-card bg-card p-4">
          <View className="flex-row gap-1.5 mb-3">
            <Badge
              label={demandStatusLabel[demand.status] ?? demand.status}
              variant={demandStatusVariant[demand.status] ?? "neutral"}
            />
            {(demand.responseCount ?? 0) > 0 && (
              <Badge
                label={`${demand.responseCount} response${(demand.responseCount ?? 0) > 1 ? "s" : ""}`}
                variant="neutral"
              />
            )}
          </View>

          {demand.description ? (
            <Text className="font-mont text-sm text-text-secondary mb-3">
              {demand.description}
            </Text>
          ) : null}

          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="font-mont text-xs text-text-secondary">Budget</Text>
              <Text className="font-mont-bold text-sm text-primary">
                {formatPrice(demand.budget)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-mont text-xs text-text-secondary">Deadline</Text>
              <Text className="font-mont-medium text-sm text-white">
                {formatDate(demand.deadline)}
              </Text>
            </View>
          </View>

          {demand.category ? (
            <View className="mt-1">
              <Text className="font-mont text-xs text-text-secondary">Category</Text>
              <Text className="font-mont-medium text-sm text-white">
                {demand.category}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Responses list */}
        <View className="mx-4 mt-4">
          <Text className="font-mont-bold text-lg text-white mb-3">
            Responses ({responses.length})
          </Text>

          {responses.length === 0 ? (
            <View className="rounded-card bg-card p-4">
              <Text className="font-mont text-sm text-text-secondary text-center">
                No responses yet
              </Text>
            </View>
          ) : (
            responses.map((resp) => (
              <View key={resp._id} className="rounded-card bg-card p-4 mb-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-mont-semibold text-sm text-white">
                      {resp.responderName}
                    </Text>
                    <Text className="font-mont-bold text-base text-primary mt-0.5">
                      {formatPrice(resp.priceQuote)}
                    </Text>
                  </View>
                  <Badge
                    label={responseStatusLabel[resp.status as DemandResponseStatus]}
                    variant={responseStatusVariant[resp.status as DemandResponseStatus]}
                  />
                </View>

                {resp.message ? (
                  <Text className="font-mont text-sm text-text-secondary mt-2">
                    {resp.message}
                  </Text>
                ) : null}

                {/* Phone pill — only when accepted */}
                {resp.status === "accepted" && resp.phone && (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${resp.phone}`)}
                    className="flex-row items-center self-start mt-2 px-3 py-1.5 rounded-pill"
                    style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
                  >
                    <Ionicons name="call" size={14} color="#22C55E" />
                    <Text className="font-mont-semibold text-sm ml-1.5" style={{ color: "#22C55E" }}>
                      {resp.phone}
                    </Text>
                  </Pressable>
                )}

                <Text className="font-mont text-xs text-text-secondary mt-2">
                  {formatDate(resp.createdAt)}
                </Text>

                {/* Creator actions */}
                {isCreator && resp.status === "pending" && demand.status !== "completed" && (
                  <View className="flex-row gap-2 mt-3">
                    <View className="flex-1">
                      <Button
                        title="Accept"
                        onPress={() => setConfirmAccept({ responseId: resp._id, responderName: resp.responderName, priceQuote: resp.priceQuote })}
                        size="sm"
                        fullWidth
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="Decline"
                        onPress={() => declineResponse(resp._id)}
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

        {/* Response form */}
        {canRespond && (
          <View className="mx-4 mt-4">
            <Text className="font-mont-bold text-lg text-white mb-3">
              Submit Response
            </Text>
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="05XXXXXXXX"
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <TextInput
              label="Price Quote (DA)"
              value={priceQuote}
              onChangeText={setPriceQuote}
              placeholder="Enter your price quote"
              keyboardType="numeric"
              error={errors.priceQuote}
            />
            <TextInput
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your offer, delivery timeline..."
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top", minHeight: 80 }}
              error={errors.message}
            />
            <Button title="Submit Response" onPress={handleSubmitResponse} loading={submitting} fullWidth />
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <ConfirmModal
        visible={!!confirmAccept}
        title="Accept Response"
        message={`Accept response of ${confirmAccept ? formatPrice(confirmAccept.priceQuote) : ""} from ${confirmAccept?.responderName ?? ""}?`}
        confirmLabel="Accept"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleAcceptResponse}
        onCancel={() => setConfirmAccept(null)}
      />
    </ScreenContainer>
  );
}
