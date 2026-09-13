import { useEffect } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  /** Highlighted text inside the message (e.g. the item name) */
  highlight?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Show spinner on confirm button while async action runs */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  danger: { color: "#DC2626", bg: "rgba(220,38,38,0.10)", icon: "trash-outline" },
  warning: { color: "#1A4B5F", bg: "rgba(26,75,95,0.08)", icon: "warning-outline" },
  info: { color: "#1A4B5F", bg: "rgba(26,75,95,0.10)", icon: "information-circle-outline" },
};

export function ConfirmModal({
  visible,
  title,
  message,
  highlight,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 22, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      scale.value = 0.92;
      opacity.value = 0;
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const { color, bg, icon } = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <Animated.View style={cardStyle}>
          <Pressable
            onPress={() => {}}
            style={{
              width: 270,
              backgroundColor: "#F2EAD9",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(26,75,95,0.06)",
              overflow: "hidden",
            }}
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, alignItems: "center" }}>
              {/* Icon — small inline */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons name={icon} size={18} color={color} />
              </View>

              {/* Title */}
              <Text
                style={{
                  fontFamily: "Montserrat_700Bold",
                  fontSize: 15,
                  color: "#0D1A12",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontFamily: "Montserrat_400Regular",
                  fontSize: 12,
                  color: "#5F6E63",
                  textAlign: "center",
                  lineHeight: 17,
                }}
              >
                {highlight
                  ? message.split(highlight).map((part, i, arr) =>
                      i < arr.length - 1 ? (
                        <Text key={i}>
                          {part}
                          <Text
                            style={{
                              fontFamily: "Montserrat_600SemiBold",
                              color: "#0D1A12",
                            }}
                          >
                            {highlight}
                          </Text>
                        </Text>
                      ) : (
                        <Text key={i}>{part}</Text>
                      )
                    )
                  : message}
              </Text>
            </View>

            {/* Buttons — compact row */}
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: "rgba(26,75,95,0.05)",
              }}
            >
              <Pressable
                onPress={onCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 11,
                  borderRightWidth: 1,
                  borderRightColor: "rgba(26,75,95,0.05)",
                  opacity: loading ? 0.4 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Montserrat_500Medium",
                    fontSize: 13,
                    color: "#5F6E63",
                  }}
                >
                  {cancelLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 11,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={color} />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Montserrat_600SemiBold",
                      fontSize: 13,
                      color: color,
                    }}
                  >
                    {confirmLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
