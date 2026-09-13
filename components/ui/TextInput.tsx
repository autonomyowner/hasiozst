import { useState } from "react";
import { View, Text, TextInput as RNTextInput, TextInputProps, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StyledTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextInput({ label, error, secureTextEntry, ...props }: StyledTextInputProps) {
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View className="mb-3">
      <Text className="font-mont-medium text-sm text-white mb-1.5">
        {label}
      </Text>
      <View style={{ position: "relative", justifyContent: "center" }}>
        <RNTextInput
          className={`rounded-card bg-card px-4 py-3 font-mont text-sm text-white ${
            error ? "border border-error" : ""
          }`}
          placeholderTextColor="#898989"
          secureTextEntry={isPassword ? hidden : undefined}
          style={isPassword ? { paddingRight: 48 } : undefined}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            style={{ position: "absolute", right: 14 }}
          >
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color="#898989" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="font-mont text-xs text-error mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
