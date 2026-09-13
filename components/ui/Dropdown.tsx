import { useState } from "react";
import { View, Text, Pressable, FlatList, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Dropdown({
  label,
  options,
  value,
  onSelect,
  placeholder = "Select...",
  error,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="mb-3">
      <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-card bg-card px-4 py-3 ${
          error ? "border border-error" : ""
        }`}
      >
        <Text
          className={`font-mont text-sm ${
            selected ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#5F6E63" />
      </Pressable>
      {error ? (
        <Text className="font-mont text-xs text-error mt-1">{error}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-background/60 justify-end"
          onPress={() => setOpen(false)}
        >
          <View
            className="bg-surface rounded-t-2xl max-h-[50%]"
            onStartShouldSetResponder={() => true}
          >
            <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
              <Text className="font-mont-semibold text-base text-text-primary">
                {label}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color="#5F6E63" />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  className={`px-5 py-3.5 flex-row items-center justify-between ${
                    item.value === value ? "bg-card" : ""
                  }`}
                >
                  <Text
                    className={`font-mont text-sm ${
                      item.value === value ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color="#1A4B5F" />
                  )}
                </Pressable>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
