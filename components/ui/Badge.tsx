import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "primary" | "success" | "error" | "neutral" | "new";
}

const variantStyles: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  error: "bg-error",
  neutral: "bg-card",
  new: "bg-badge-new",
};

const textStyles: Record<string, string> = {
  primary: "text-white",
  success: "text-text-primary",
  error: "text-text-primary",
  neutral: "text-text-primary",
  new: "text-text-primary",
};

export function Badge({ label, variant = "primary" }: BadgeProps) {
  return (
    <View className={`rounded-pill px-2 py-0.5 ${variantStyles[variant]}`}>
      <Text className={`font-mont-semibold text-xs ${textStyles[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
