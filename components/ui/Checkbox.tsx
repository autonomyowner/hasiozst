import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center"
    >
      <View
        className={`h-5 w-5 rounded items-center justify-center border ${
          checked ? "bg-primary border-primary" : "border-text-secondary"
        }`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <Text className="font-mont text-sm text-text-secondary ml-2">
        {label}
      </Text>
    </Pressable>
  );
}
