import { View, TextInput, Pressable, Text } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  showFilterIcon?: boolean;
  onFilterPress?: () => void;
}

export function SearchBar({
  placeholder = "Search products, brands, or services...",
  onPress,
  onChangeText,
  editable = true,
  showFilterIcon = false,
  onFilterPress,
}: SearchBarProps) {
  const [value, setValue] = useState("");

  if (onPress && !editable) {
    return (
      <Pressable
        onPress={onPress}
        className="mx-4 flex-row items-center rounded-card bg-card px-4 py-3"
        style={{ gap: 10 }}
      >
        <Ionicons name="search-outline" size={18} color="#1A4B5F" />
        <Text className="flex-1 font-mont text-sm text-text-secondary">
          {placeholder}
        </Text>
        {showFilterIcon && (
          <Ionicons name="funnel" size={16} color="#1A4B5F" />
        )}
      </Pressable>
    );
  }

  return (
    <View
      className="mx-4 flex-row items-center rounded-card bg-card px-4 py-3"
      style={{ gap: 10 }}
    >
      <Ionicons name="search-outline" size={18} color="#1A4B5F" />
      <TextInput
        value={value}
        onChangeText={(text) => {
          setValue(text);
          onChangeText?.(text);
        }}
        placeholder={placeholder}
        placeholderTextColor="#5F6E63"
        className="flex-1 font-mont text-sm text-text-primary"
        autoCapitalize="none"
      />
      {showFilterIcon && (
        <Pressable onPress={onFilterPress} hitSlop={8}>
          <Ionicons name="funnel" size={16} color="#1A4B5F" />
        </Pressable>
      )}
    </View>
  );
}
