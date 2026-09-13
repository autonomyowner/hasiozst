import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";

interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  wilayaCode?: string;
  wilayaName?: string;
  commune?: string;
}

interface OrderItem {
  productName: string;
  quantity: number;
}

interface ShipOrderSheetProps {
  visible: boolean;
  onClose: () => void;
  order: {
    _id: string;
    buyerName: string;
    shippingAddress: ShippingAddress;
    total: number;
    items: OrderItem[];
  };
  deliverySettings: Array<{
    provider: string;
    apiKey: string;
    apiId?: string;
    pickupWilayaCode?: string;
  }>;
}

type DeliveryType = "home" | "stopdesk";

export function ShipOrderSheet({
  visible,
  onClose,
  order,
  deliverySettings,
}: ShipOrderSheetProps) {
  const { showSuccess, showError } = useToast();

  const fetchFees = useAction(api.delivery.fetchDeliveryFees);
  const createShipment = useAction(api.delivery.createShipment);

  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const [weight, setWeight] = useState("1");
  const [fee, setFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first provider
  useEffect(() => {
    if (deliverySettings.length > 0 && !selectedProvider) {
      setSelectedProvider(deliverySettings[0].provider);
    }
  }, [deliverySettings, selectedProvider]);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setFee(null);
      setLoadingFee(false);
      setSubmitting(false);
      setWeight("1");
      setDeliveryType("home");
      if (deliverySettings.length > 0) {
        setSelectedProvider(deliverySettings[0].provider);
      }
    }
  }, [visible, deliverySettings]);

  const handleFetchFee = useCallback(async () => {
    if (!selectedProvider || !order.shippingAddress.wilayaCode) return;

    const setting = deliverySettings.find((s) => s.provider === selectedProvider);
    if (!setting) return;

    setLoadingFee(true);
    setFee(null);
    try {
      const result = await fetchFees({
        provider: selectedProvider as "yalidine" | "zrexpress" | "maystro",
        apiKey: setting.apiKey,
        apiId: setting.apiId,
        fromWilayaCode: setting.pickupWilayaCode || "16",
        toWilayaCode: order.shippingAddress.wilayaCode,
        isStopDesk: deliveryType === "stopdesk",
      });
      setFee(result.fee);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "فشل في جلب تكلفة التوصيل"
      );
    } finally {
      setLoadingFee(false);
    }
  }, [
    selectedProvider,
    order.shippingAddress.wilayaCode,
    deliverySettings,
    fetchFees,
    deliveryType,
    showError,
  ]);

  // Fetch fee when provider, type, or weight changes
  useEffect(() => {
    if (visible && selectedProvider && order.shippingAddress.wilayaCode) {
      const timeout = setTimeout(() => {
        handleFetchFee();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [visible, selectedProvider, deliveryType, weight, handleFetchFee]);

  const handleConfirm = async () => {
    if (!selectedProvider || submitting) return;

    setSubmitting(true);
    try {
      await createShipment({
        orderId: order._id as any,
        provider: selectedProvider as "yalidine" | "zrexpress" | "maystro",
        isStopDesk: deliveryType === "stopdesk",
        weight: parseFloat(weight) || 1,
      });
      showSuccess("تم إنشاء الشحنة بنجاح");
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "فشل في إنشاء الشحنة");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-DZ").format(price) + " DA";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/70" onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="bg-surface rounded-t-[24px] max-h-[85%]"
      >
        {/* Drag Handle */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-[#444]" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-3 border-b border-[#333]">
          <Text className="font-mont-bold text-lg text-white">شحن الطلب</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-black/50 items-center justify-center"
          >
            <Text className="font-mont-bold text-base text-text-secondary">
              x
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Info */}
          <View className="mt-4 bg-card rounded-card p-4 border border-[#333]">
            <Text className="font-mont-semibold text-sm text-primary mb-2">
              معلومات العميل
            </Text>

            <InfoRow label="الاسم" value={order.shippingAddress.fullName} />
            <InfoRow
              label="الولاية"
              value={
                order.shippingAddress.wilayaName ||
                order.shippingAddress.wilayaCode ||
                order.shippingAddress.city
              }
            />
            {order.shippingAddress.commune && (
              <InfoRow label="البلدية" value={order.shippingAddress.commune} />
            )}
            <InfoRow label="العنوان" value={order.shippingAddress.address} />
            <InfoRow label="الهاتف" value={order.shippingAddress.phone} />
            <InfoRow label="المبلغ" value={formatPrice(order.total)} highlight />
          </View>

          {/* Items Summary */}
          <View className="mt-3 bg-card rounded-card p-4 border border-[#333]">
            <Text className="font-mont-semibold text-sm text-primary mb-2">
              المنتجات ({order.items.length})
            </Text>
            {order.items.map((item, idx) => (
              <View key={idx} className="flex-row justify-between mb-1.5">
                <Text
                  className="font-mont text-sm text-white flex-1 mr-2"
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>
                <Text className="font-mont-medium text-sm text-text-secondary">
                  x{item.quantity}
                </Text>
              </View>
            ))}
          </View>

          {/* Provider Selection */}
          <View className="mt-4">
            <Text className="font-mont-semibold text-sm text-white mb-2">
              شركة التوصيل
            </Text>
            {deliverySettings.length === 0 ? (
              <View className="bg-card rounded-card p-4 border border-[#333]">
                <Text className="font-mont text-sm text-text-secondary text-center">
                  لا توجد شركات توصيل مُعدّة
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {deliverySettings.map((setting) => {
                  const isSelected = selectedProvider === setting.provider;
                  return (
                    <Pressable
                      key={setting.provider}
                      onPress={() => setSelectedProvider(setting.provider)}
                      className={`flex-row items-center p-3.5 rounded-[14px] border ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-[#333] bg-card"
                      }`}
                    >
                      {/* Radio circle */}
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                          isSelected ? "border-primary" : "border-[#555]"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text
                        className={`font-mont-semibold text-sm capitalize ${
                          isSelected ? "text-primary" : "text-white"
                        }`}
                      >
                        {setting.provider}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Delivery Type Toggle */}
          <View className="mt-4">
            <Text className="font-mont-semibold text-sm text-white mb-2">
              نوع التوصيل
            </Text>
            <View className="flex-row bg-card rounded-[14px] border border-[#333] overflow-hidden">
              <DeliveryTypeButton
                label="توصيل للمنزل"
                active={deliveryType === "home"}
                onPress={() => setDeliveryType("home")}
              />
              <DeliveryTypeButton
                label="مكتب التوقف"
                active={deliveryType === "stopdesk"}
                onPress={() => setDeliveryType("stopdesk")}
              />
            </View>
          </View>

          {/* Weight Input */}
          <View className="mt-4">
            <Text className="font-mont-semibold text-sm text-white mb-2">
              الوزن (كغ)
            </Text>
            <TextInput
              value={weight}
              onChangeText={(t) => {
                // Allow only numbers and decimal
                const cleaned = t.replace(/[^0-9.]/g, "");
                setWeight(cleaned);
              }}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor="#666"
              className="bg-card rounded-[14px] border border-[#333] px-4 py-3 text-white font-mont text-sm"
            />
          </View>

          {/* Fee Estimate */}
          <View className="mt-4 bg-card rounded-card p-4 border border-[#333]">
            <Text className="font-mont-semibold text-sm text-white mb-2">
              تكلفة التوصيل
            </Text>
            {loadingFee ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#FFD400" />
                <Text className="font-mont text-sm text-text-secondary">
                  جاري الحساب...
                </Text>
              </View>
            ) : fee !== null ? (
              <View className="flex-row items-center justify-between">
                <Text className="font-mont-bold text-xl text-primary">
                  {formatPrice(fee)}
                </Text>
                <Pressable onPress={handleFetchFee}>
                  <Text className="font-mont text-xs text-text-secondary underline">
                    إعادة الحساب
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="font-mont text-sm text-text-secondary">
                {!order.shippingAddress.wilayaCode
                  ? "لا يوجد رمز ولاية للعميل"
                  : "اختر شركة التوصيل لحساب التكلفة"}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mt-6 gap-3">
            <Pressable
              onPress={handleConfirm}
              disabled={
                !selectedProvider || submitting || deliverySettings.length === 0
              }
              className="bg-primary rounded-[14px] py-4 items-center"
              style={{
                opacity:
                  selectedProvider && !submitting && deliverySettings.length > 0
                    ? 1
                    : 0.5,
                shadowColor: "#FFD400",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="font-mont-bold text-base text-black">
                  تأكيد الشحن
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={submitting}
              className="bg-card rounded-[14px] py-3.5 items-center border border-[#333]"
            >
              <Text className="font-mont-semibold text-sm text-text-secondary">
                إلغاء
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Sub-components ---

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center mb-1.5">
      <Text className="font-mont text-xs text-text-secondary">{label}</Text>
      <Text
        className={`font-mont-medium text-sm ${
          highlight ? "text-primary" : "text-white"
        }`}
        numberOfLines={1}
        style={{ maxWidth: "65%" }}
      >
        {value}
      </Text>
    </View>
  );
}

function DeliveryTypeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 items-center ${
        active ? "bg-primary/15" : "bg-transparent"
      }`}
      style={
        active
          ? {
              borderBottomWidth: 2,
              borderBottomColor: "#FFD400",
            }
          : undefined
      }
    >
      <Text
        className={`font-mont-semibold text-sm ${
          active ? "text-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
