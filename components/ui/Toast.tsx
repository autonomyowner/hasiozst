import { useEffect, useState } from "react";
import { Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant: ToastVariant;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: "#22C55E",
  error: "#EF4444",
  info: "#898989",
};

export function Toast({
  message,
  variant,
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      // Auto-dismiss
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, () => {
          runOnJS(onDismiss)();
        })
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 300 }));
    } else {
      translateY.value = -100;
      opacity.value = 0;
      // Unmount after animation completes
      const timer = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && !mounted) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          backgroundColor: VARIANT_COLORS[variant],
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          zIndex: 9999,
          elevation: 9999,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onDismiss}>
        <Text
          style={{
            color: "#fff",
            fontFamily: "Montserrat_600SemiBold",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
