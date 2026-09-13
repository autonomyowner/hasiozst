import { Pressable, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: "bg-primary",
  secondary: "bg-card",
  outline: "border border-primary bg-transparent",
  ghost: "bg-transparent",
};

const variantTextStyles = {
  primary: "text-black font-mont-bold",
  secondary: "text-white font-mont-semibold",
  outline: "text-primary font-mont-semibold",
  ghost: "text-primary font-mont-medium",
};

const sizeStyles = {
  sm: "px-3 py-2",
  md: "px-5 py-3",
  lg: "px-6 py-4",
};

const sizeTextStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-card ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#000000" : "#FFD400"}
          size="small"
        />
      ) : (
        <Text className={`${variantTextStyles[variant]} ${sizeTextStyles[size]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
