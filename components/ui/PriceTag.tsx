import { Text } from "react-native";
import { formatPrice } from "@/lib/formatters";

interface PriceTagProps {
  price: number;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

export function PriceTag({ price, size = "md" }: PriceTagProps) {
  return (
    <Text className={`font-mont-bold text-primary ${sizeStyles[size]}`}>
      {formatPrice(price)}
    </Text>
  );
}
