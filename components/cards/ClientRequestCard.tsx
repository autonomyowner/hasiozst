import { View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { ClientRequest } from "@/lib/types";

interface ClientRequestCardProps {
  request: ClientRequest;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  new: {
    label: "New",
    color: "#1F9D55",
    bg: "rgba(31,157,85,0.15)",
  },
  in_progress: {
    label: "In Progress",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.18)",
  },
  completed: {
    label: "Completed",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.18)",
  },
  declined: {
    label: "Declined",
    color: "#5F6E63",
    bg: "rgba(95,110,99,0.18)",
  },
};

interface InfoChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

function InfoChip({ icon, iconColor, iconBg, label, value }: InfoChipProps) {
  return (
    <View
      className="flex-row items-center rounded-pill bg-surface px-3 py-2"
      style={{ gap: 10 }}
    >
      <View
        className="h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <View>
        <Text className="font-mont text-[9px] text-text-secondary">
          {label}
        </Text>
        <Text className="font-mont-semibold text-xs text-text-primary">{value}</Text>
      </View>
    </View>
  );
}

export function ClientRequestCard({
  request,
  onAccept,
  onDecline,
  onComplete,
}: ClientRequestCardProps) {
  const isNew = request.status === "new";
  const isAccepted = request.status === "in_progress";
  const isCompleted = request.status === "completed";
  const status = statusConfig[request.status];

  return (
    <View
      className="mx-4 mb-3 rounded-card bg-card p-4"
      style={{ borderWidth: 1, borderColor: "#E3DBCA" }}
    >
      {/* Header: avatar + name + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <AppImage
            source={request.clientAvatar}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <View className="ml-3">
            <Text className="font-mont text-[10px] text-text-secondary">
              Client Name
            </Text>
            <Text className="font-mont-semibold text-sm text-text-primary">
              {request.clientName}
            </Text>
          </View>
        </View>
        <View
          className="rounded-pill px-3 py-1"
          style={{ backgroundColor: status.bg }}
        >
          <Text
            className="font-mont-semibold text-[11px]"
            style={{ color: status.color }}
          >
            {status.label}
          </Text>
        </View>
      </View>

      {/* Title + yellow underline */}
      <Text className="font-mont-bold text-base text-text-primary mt-1">
        {request.title}
      </Text>
      <View
        className="mt-1.5 mb-2"
        style={{ height: 2, width: 32, backgroundColor: "#1A4B5F", borderRadius: 1 }}
      />

      {/* Description */}
      <Text
        className="font-mont text-xs text-text-secondary"
        numberOfLines={2}
      >
        {request.description}
      </Text>

      {/* Info chips row */}
      <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
        {isCompleted ? (
          <>
            <InfoChip
              icon="cash-outline"
              iconColor="#1F9D55"
              iconBg="rgba(31,157,85,0.18)"
              label="Final Amount"
              value={formatPrice(request.finalAmount ?? request.budget)}
            />
            <InfoChip
              icon="checkmark-circle-outline"
              iconColor="#1A4B5F"
              iconBg="rgba(26,75,95,0.18)"
              label="Completed On"
              value={
                request.completedAt ? formatDate(request.completedAt) : "N/A"
              }
            />
          </>
        ) : (
          <>
            <InfoChip
              icon="cash-outline"
              iconColor="#1F9D55"
              iconBg="rgba(31,157,85,0.18)"
              label="Budget"
              value={formatPrice(request.budget)}
            />
            <InfoChip
              icon="time-outline"
              iconColor="#1A4B5F"
              iconBg="rgba(26,75,95,0.18)"
              label="Delivery Time Requested"
              value={request.deliveryTime}
            />
            {isAccepted && request.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${request.phone}`)}
              >
                <InfoChip
                  icon="call-outline"
                  iconColor="#1F9D55"
                  iconBg="rgba(31,157,85,0.18)"
                  label="Phone"
                  value={request.phone}
                />
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Action buttons for new requests */}
      {isNew && (onAccept || onDecline) && (
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          {onAccept && (
            <Pressable
              onPress={onAccept}
              className="flex-1 items-center justify-center rounded-pill py-3"
              style={{ backgroundColor: "#1F9D55" }}
            >
              <Text className="font-mont-semibold text-xs text-text-primary">
                Accept
              </Text>
            </Pressable>
          )}
          {onDecline && (
            <Pressable
              onPress={onDecline}
              className="flex-1 items-center justify-center rounded-pill py-3"
              style={{
                borderWidth: 1.5,
                borderColor: "#DC2626",
              }}
            >
              <Text
                className="font-mont-semibold text-xs"
                style={{ color: "#DC2626" }}
              >
                Decline
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Complete button for in-progress requests */}
      {isAccepted && onComplete && (
        <Pressable
          onPress={onComplete}
          className="flex-row items-center justify-center rounded-pill bg-primary mt-4 py-3"
          style={{ gap: 6 }}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
          <Text className="font-mont-semibold text-xs text-white">
            Mark as Completed
          </Text>
        </Pressable>
      )}
    </View>
  );
}
