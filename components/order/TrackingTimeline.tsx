import { useState } from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useToast } from "@/providers/ToastProvider";

interface TrackingHistoryEntry {
  status: string;
  date: string;
  location?: string;
}

interface TrackingTimelineProps {
  trackingNumber: string;
  provider: string;
  providerStatus: string;
  mappedOrderStatus: string;
  history?: TrackingHistoryEntry[];
  isStopDesk?: boolean;
  deliveryFee?: number;
}

const TIMELINE_STEPS = [
  { key: "pending", label: "تقديم الطلب" },
  { key: "processing", label: "تجهيز" },
  { key: "shipped", label: "شحن" },
  { key: "delivered", label: "تسليم" },
] as const;

type StepKey = (typeof TIMELINE_STEPS)[number]["key"];

const STATUS_ORDER: Record<StepKey, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function getActiveStepIndex(mappedStatus: string): number {
  const normalized = mappedStatus.toLowerCase() as StepKey;
  return STATUS_ORDER[normalized] ?? 0;
}

export default function TrackingTimeline({
  trackingNumber,
  provider,
  providerStatus,
  mappedOrderStatus,
  history,
  isStopDesk,
  deliveryFee,
}: TrackingTimelineProps) {
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  const activeIndex = getActiveStepIndex(mappedOrderStatus);

  const handleCopy = async () => {
    try {
      await Share.share({ message: trackingNumber });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-DZ").format(price) + " DA";

  return (
    <View className="bg-card rounded-card p-4 border border-[#333]">
      {/* Tracking Number Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="font-mont text-xs text-text-secondary mb-0.5">
            رقم التتبع
          </Text>
          <Text
            className="font-mont-bold text-sm text-white"
            selectable
            numberOfLines={1}
          >
            {trackingNumber}
          </Text>
        </View>
        <Pressable
          onPress={handleCopy}
          className={`px-3 py-1.5 rounded-[10px] border ${
            copied
              ? "border-[#22C55E] bg-[#22C55E]/10"
              : "border-[#333] bg-black/50"
          }`}
        >
          <Text
            className={`font-mont-medium text-xs ${
              copied ? "text-[#22C55E]" : "text-text-secondary"
            }`}
          >
            {copied ? "تم" : "مشاركة"}
          </Text>
        </Pressable>
      </View>

      {/* Provider Badge + Delivery Info */}
      <View className="flex-row items-center flex-wrap gap-2 mb-4">
        {/* Provider pill */}
        <View className="bg-primary/15 rounded-full px-3 py-1">
          <Text className="font-mont-semibold text-xs text-primary capitalize">
            {provider}
          </Text>
        </View>

        {/* Delivery type pill */}
        <View className="bg-black/50 rounded-full px-3 py-1 border border-[#333]">
          <Text className="font-mont text-xs text-text-secondary">
            {isStopDesk ? "مكتب التوقف" : "توصيل للمنزل"}
          </Text>
        </View>

        {/* Fee pill */}
        {deliveryFee !== undefined && deliveryFee > 0 && (
          <View className="bg-black/50 rounded-full px-3 py-1 border border-[#333]">
            <Text className="font-mont-medium text-xs text-white">
              {formatPrice(deliveryFee)}
            </Text>
          </View>
        )}
      </View>

      {/* Provider Status */}
      <View className="bg-black/40 rounded-[10px] px-3 py-2 mb-4 border border-[#222]">
        <Text className="font-mont text-xs text-text-secondary">
          حالة الناقل:{" "}
          <Text className="font-mont-semibold text-white">
            {providerStatus}
          </Text>
        </Text>
      </View>

      {/* 4-Step Vertical Timeline */}
      <View className="ml-1">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <View key={step.key} className="flex-row">
              {/* Circle + Line Column */}
              <View className="items-center mr-3" style={{ width: 24 }}>
                {/* Circle */}
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    isCompleted ? "bg-primary" : "bg-[#222] border border-[#444]"
                  }`}
                  style={
                    isActive
                      ? {
                          shadowColor: "#FFD400",
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.6,
                          shadowRadius: 8,
                          elevation: 6,
                        }
                      : undefined
                  }
                >
                  {isCompleted && (
                    <Text className="font-mont-bold text-[10px] text-black">
                      {index < activeIndex ? "\u2713" : index + 1}
                    </Text>
                  )}
                  {!isCompleted && (
                    <Text className="font-mont text-[10px] text-[#555]">
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Connecting Line */}
                {!isLast && (
                  <View
                    className={`w-0.5 flex-1 my-0.5 ${
                      index < activeIndex ? "bg-primary" : "bg-[#333]"
                    }`}
                    style={{ minHeight: 28 }}
                  />
                )}
              </View>

              {/* Label Column */}
              <View
                className="flex-1 pb-4"
                style={isLast ? { paddingBottom: 0 } : undefined}
              >
                <Text
                  className={`font-mont-semibold text-sm ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-white"
                        : "text-[#555]"
                  }`}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Text className="font-mont text-xs text-text-secondary mt-0.5">
                    الحالة الحالية
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* History Events */}
      {history && history.length > 0 && (
        <View className="mt-5 pt-4 border-t border-[#222]">
          <Text className="font-mont-semibold text-sm text-white mb-3">
            سجل التتبع
          </Text>
          {history.map((entry, idx) => (
            <View
              key={idx}
              className={`flex-row items-start ${
                idx < history.length - 1 ? "mb-3" : ""
              }`}
            >
              {/* Dot */}
              <View className="w-2 h-2 rounded-full bg-[#444] mt-1.5 mr-3" />

              {/* Content */}
              <View className="flex-1">
                <Text className="font-mont-medium text-sm text-white">
                  {entry.status}
                </Text>
                <View className="flex-row items-center mt-0.5 gap-2">
                  <Text className="font-mont text-xs text-text-secondary">
                    {entry.date}
                  </Text>
                  {entry.location && (
                    <Text className="font-mont text-xs text-text-secondary">
                      {entry.location}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
