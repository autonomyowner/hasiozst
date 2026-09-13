import { View, Text, Pressable } from "react-native";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioButtonProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: "horizontal" | "vertical";
}

export function RadioButton({
  options,
  value,
  onChange,
  direction = "vertical",
}: RadioButtonProps) {
  return (
    <View
      className={direction === "horizontal" ? "flex-row" : ""}
      style={direction === "horizontal" ? { gap: 12 } : { gap: 8 }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-row items-center rounded-card px-4 py-3 ${
              isSelected ? "bg-card border border-primary" : "bg-card"
            } ${direction === "horizontal" ? "flex-1" : ""}`}
          >
            <View
              className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-3 ${
                isSelected ? "border-primary" : "border-text-secondary"
              }`}
            >
              {isSelected && (
                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`font-mont-medium text-sm ${
                  isSelected ? "text-primary" : "text-text-primary"
                }`}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text className="font-mont text-xs text-text-secondary mt-0.5">
                  {option.description}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
