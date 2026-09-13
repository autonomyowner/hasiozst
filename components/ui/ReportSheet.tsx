import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";

export type ReportTargetType =
  | "reel"
  | "reelComment"
  | "product"
  | "wholesaleProduct"
  | "freelanceService"
  | "offer"
  | "demandRequest"
  | "user";

type Reason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "sexual"
  | "illegal"
  | "intellectual_property"
  | "scam"
  | "other";

const REASONS: { value: Reason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual", label: "Sexual or nudity" },
  { value: "illegal", label: "Illegal goods or activity" },
  { value: "intellectual_property", label: "Intellectual property" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Other" },
];

interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

export function ReportSheet({
  visible,
  targetType,
  targetId,
  onClose,
}: ReportSheetProps) {
  const submit = useMutation(api.reports.submit);
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setReason(null);
    setDetails("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await submit({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      showSuccess("Report submitted. Thank you.");
      handleClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <View
          className="bg-surface rounded-t-3xl"
          style={{ maxHeight: "80%", paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-card">
            <Text className="font-mont-bold text-base text-white">Report</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#898989" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="font-mont text-sm text-text-secondary mb-3">
              Why are you reporting this?
            </Text>
            <View style={{ gap: 8 }}>
              {REASONS.map((r) => {
                const selected = reason === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    className={`flex-row items-center rounded-card px-4 py-3 ${
                      selected ? "bg-card border border-primary" : "bg-card"
                    }`}
                  >
                    <View
                      className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-3 ${
                        selected ? "border-primary" : "border-text-secondary"
                      }`}
                    >
                      {selected && (
                        <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text
                      className={`font-mont-medium text-sm ${
                        selected ? "text-primary" : "text-white"
                      }`}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="font-mont text-sm text-text-secondary mt-5 mb-2">
              Additional details (optional)
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Share any context that helps our team review this..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
              className="bg-card rounded-card px-4 py-3 text-white font-mont text-sm"
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
            <Text className="font-mont text-xs text-text-secondary text-right mt-1">
              {details.length}/500
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!reason || submitting}
              className="bg-primary rounded-card py-3.5 mt-4 items-center"
              style={{ opacity: reason && !submitting ? 1 : 0.5 }}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="font-mont-bold text-sm text-black">
                  Submit report
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
