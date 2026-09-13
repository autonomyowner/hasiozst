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
  primary: "text-black",
  success: "text-white",
  error: "text-white",
  neutral: "text-white",
  new: "text-white",
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
