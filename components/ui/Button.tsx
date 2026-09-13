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
  primary: "text-white font-mont-bold",
  secondary: "text-text-primary font-mont-semibold",
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
          color={variant === "primary" ? "#FFFFFF" : "#1A4B5F"}
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
