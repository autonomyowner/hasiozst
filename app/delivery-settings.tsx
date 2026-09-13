import { useState, useCallback } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/providers/ToastProvider";
import { getWilayaOptions } from "@/lib/algeriaData";

type ProviderId = "yalidine" | "maystro" | "zrexpress";

interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameAr: string;
  hasApiId: boolean;
  hasPickup: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "yalidine",
    name: "Yalidine",
    nameAr: "ياليدين",
    hasApiId: true,
    hasPickup: true,
  },
  {
    id: "maystro",
    name: "Maystro Delivery",
    nameAr: "مايسترو",
    hasApiId: false,
    hasPickup: false,
  },
  {
    id: "zrexpress",
    name: "ZR Express",
    nameAr: "زد آر إكسبريس",
    hasApiId: true,
    hasPickup: false,
  },
];

interface ProviderState {
  apiKey: string;
  apiId: string;
  pickupWilaya: string;
  pickupAddress: string;
  testing: boolean;
  saving: boolean;
  testResult: "success" | "error" | null;
}

const emptyState: ProviderState = {
  apiKey: "",
  apiId: "",
  pickupWilaya: "",
  pickupAddress: "",
  testing: false,
  saving: false,
  testResult: null,
};

export default function DeliverySettingsScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const settings = useQuery(api.delivery.getMySettings);
  const validateKeys = useAction(api.delivery.validateApiKeys);
  const saveSettings = useMutation(api.delivery.saveSettings);
  const removeSettings = useMutation(api.delivery.removeSettings);

  const [expanded, setExpanded] = useState<ProviderId | null>(null);
  const [states, setStates] = useState<Record<ProviderId, ProviderState>>({
    yalidine: { ...emptyState },
    maystro: { ...emptyState },
    zrexpress: { ...emptyState },
  });
  const [confirmRemove, setConfirmRemove] = useState<ProviderId | null>(null);

  const wilayaOptions = getWilayaOptions();

  const isConnected = useCallback(
    (providerId: ProviderId): boolean => {
      if (!settings) return false;
      const s = settings.find((s: { provider: string }) => s.provider === providerId);
      return !!s;
    },
    [settings]
  );

  const updateState = (
    providerId: ProviderId,
    updates: Partial<ProviderState>
  ) => {
    setStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], ...updates },
    }));
  };

  const toggleExpand = (providerId: ProviderId) => {
    setExpanded((prev) => (prev === providerId ? null : providerId));
  };

  const handleTest = async (provider: ProviderConfig) => {
    const state = states[provider.id];
    if (!state.apiKey.trim()) {
      showError("يرجى إدخال مفتاح API");
      return;
    }
    if (provider.hasApiId && !state.apiId.trim()) {
      showError("يرجى إدخال معرف API");
      return;
    }

    updateState(provider.id, { testing: true, testResult: null });
    try {
      const result = await validateKeys({
        provider: provider.id,
        apiKey: state.apiKey.trim(),
        apiId: provider.hasApiId ? state.apiId.trim() : undefined,
      });
      if (result.success) {
        updateState(provider.id, { testing: false, testResult: "success" });
        showSuccess("تم الاتصال بنجاح");
      } else {
        updateState(provider.id, { testing: false, testResult: "error" });
        showError("فشل الاتصال");
      }
    } catch {
      updateState(provider.id, { testing: false, testResult: "error" });
      showError("فشل اختبار الاتصال");
    }
  };

  const handleSave = async (provider: ProviderConfig) => {
    const state = states[provider.id];
    if (!state.apiKey.trim()) {
      showError("يرجى إدخال مفتاح API");
      return;
    }
    if (provider.hasApiId && !state.apiId.trim()) {
      showError("يرجى إدخال معرف API");
      return;
    }
    if (provider.hasPickup && !state.pickupWilaya) {
      showError("يرجى اختيار ولاية الاستلام");
      return;
    }

    updateState(provider.id, { saving: true });
    try {
      await saveSettings({
        provider: provider.id,
        apiKey: state.apiKey.trim(),
        apiId: provider.hasApiId ? state.apiId.trim() : undefined,
        pickupWilayaCode: provider.hasPickup ? state.pickupWilaya : undefined,
        pickupAddress: provider.hasPickup
          ? state.pickupAddress.trim() || undefined
          : undefined,
      });
      showSuccess("تم حفظ الإعدادات");
    } catch {
      showError("فشل حفظ الإعدادات");
    } finally {
      updateState(provider.id, { saving: false });
    }
  };

  const handleRemove = async (providerId: ProviderId) => {
    try {
      await removeSettings({ provider: providerId });
      updateState(providerId, { ...emptyState });
      showSuccess("تم حذف الإعدادات");
    } catch {
      showError("فشل حذف الإعدادات");
    }
    setConfirmRemove(null);
  };

  const renderProvider = (provider: ProviderConfig) => {
    const state = states[provider.id];
    const connected = isConnected(provider.id);
    const isExpanded = expanded === provider.id;

    return (
      <View
        key={provider.id}
        className={`bg-card rounded-card p-4 mb-3 border ${
          connected ? "border-[#FFD400]/30" : "border-[#333]"
        }`}
      >
        {/* Header */}
        <Pressable
          onPress={() => toggleExpand(provider.id)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            {connected && (
              <View className="w-2.5 h-2.5 rounded-full bg-[#22C55E] mr-3" />
            )}
            <View className="flex-1">
              <Text className="font-mont-semibold text-base text-white">
                {provider.name}
              </Text>
              <Text className="font-mont text-xs text-text-secondary mt-0.5">
                {provider.nameAr}
                {connected ? " - متصل" : ""}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#898989"
          />
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-[#333]">
            {/* API Key */}
            <TextInput
              label="مفتاح API"
              value={state.apiKey}
              onChangeText={(text) =>
                updateState(provider.id, { apiKey: text, testResult: null })
              }
              placeholder="أدخل مفتاح API"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* API ID (Yalidine + ZR Express) */}
            {provider.hasApiId && (
              <TextInput
                label="معرف API"
                value={state.apiId}
                onChangeText={(text) =>
                  updateState(provider.id, { apiId: text, testResult: null })
                }
                placeholder="أدخل معرف API"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            {/* Pickup Wilaya (Yalidine only) */}
            {provider.hasPickup && (
              <>
                <Dropdown
                  label="ولاية الاستلام"
                  options={wilayaOptions}
                  value={state.pickupWilaya}
                  onSelect={(value) =>
                    updateState(provider.id, { pickupWilaya: value })
                  }
                  placeholder="اختر الولاية..."
                />

                <TextInput
                  label="عنوان الاستلام"
                  value={state.pickupAddress}
                  onChangeText={(text) =>
                    updateState(provider.id, { pickupAddress: text })
                  }
                  placeholder="أدخل عنوان نقطة الاستلام"
                />
              </>
            )}

            {/* Test Result Indicator */}
            {state.testResult && (
              <View
                className={`flex-row items-center rounded-card px-3 py-2 mb-3 ${
                  state.testResult === "success"
                    ? "bg-[#22C55E]/10"
                    : "bg-[#EF4444]/10"
                }`}
              >
                <Ionicons
                  name={
                    state.testResult === "success"
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={18}
                  color={
                    state.testResult === "success" ? "#22C55E" : "#EF4444"
                  }
                />
                <Text
                  className={`font-mont text-sm ml-2 ${
                    state.testResult === "success"
                      ? "text-[#22C55E]"
                      : "text-[#EF4444]"
                  }`}
                >
                  {state.testResult === "success"
                    ? "الاتصال ناجح"
                    : "فشل الاتصال"}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-1">
              <View className="flex-1">
                <Button
                  title={state.testing ? "" : "اختبار الاتصال"}
                  onPress={() => handleTest(provider)}
                  variant="outline"
                  size="md"
                  loading={state.testing}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  title="حفظ"
                  onPress={() => handleSave(provider)}
                  variant="primary"
                  size="md"
                  loading={state.saving}
                  fullWidth
                />
              </View>
            </View>

            {/* Remove Button */}
            {connected && (
              <Pressable
                onPress={() => setConfirmRemove(provider.id)}
                className="flex-row items-center justify-center mt-3 py-2"
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="font-mont-medium text-sm text-[#EF4444] ml-1.5">
                  حذف
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <Text className="font-mont-bold text-lg text-white flex-1 text-center mr-10">
            إعدادات التوصيل
          </Text>
        </View>

        {/* Content */}
        {settings === undefined ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FFD400" size="large" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View className="bg-surface rounded-card p-4 mb-4 border border-[#333]">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#898989"
                />
                <Text className="font-mont text-xs text-text-secondary ml-2 flex-1 leading-5">
                  قم بربط حساب شركة التوصيل الخاصة بك لتتبع الطرود تلقائيا
                  وإنشاء بوالص الشحن من لوحة التحكم.
                </Text>
              </View>
            </View>

            {/* Provider Cards */}
            {PROVIDERS.map(renderProvider)}
          </ScrollView>
        )}
      </ScreenContainer>

      {/* Confirm Remove Modal */}
      <ConfirmModal
        visible={confirmRemove !== null}
        title="حذف الإعدادات"
        message="هل أنت متأكد من حذف إعدادات هذه الشركة؟ سيتم قطع الاتصال نهائيا."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </>
  );
}
