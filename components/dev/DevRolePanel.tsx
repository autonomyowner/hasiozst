import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useUserRole } from "@/hooks/useUserRole";
import type { EffectiveRole } from "@/lib/types";

const devRoles: EffectiveRole[] = ["customer", "fournisseur", "freelancer", "importateur", "grossiste"];

export function DevRolePanel() {
  if (!__DEV__) return null;

  const { effectiveRole, devOverride, setDevRole } = useUserRole();
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleTap = () => {
    const next = tapCount + 1;
    if (next >= 5) {
      setVisible(!visible);
      setTapCount(0);
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount(0), 2000);
    }
  };

  const selectRole = (role: EffectiveRole | null) => {
    setDevRole(role);
    // Navigate to correct route group
    const isB2B = role === "importateur" || role === "grossiste";
    const wasB2B = effectiveRole === "importateur" || effectiveRole === "grossiste";
    if (role === null || isB2B !== wasB2B) {
      router.replace("/");
    }
  };

  return (
    <>
      {/* Role indicator — tap 5 times to toggle dev panel */}
      <Pressable
        onPress={handleTap}
        className="mx-4 mb-3 flex-row items-center justify-between rounded-card px-4 py-2.5"
        style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
      >
        <Text className="font-mont text-[10px] text-text-secondary">Role</Text>
        <View className="flex-row items-center">
          <Text className="font-mont-semibold text-sm text-white capitalize">
            {effectiveRole}
          </Text>
          {devOverride && (
            <Text className="font-mont text-[10px] text-[#FFD400] ml-1.5">(dev)</Text>
          )}
        </View>
      </Pressable>

      {/* Dev panel */}
      {visible && (
        <View
          className="mx-4 mb-3 rounded-card p-3"
          style={{ backgroundColor: "rgba(169,169,169,0.12)", borderWidth: 1, borderColor: "rgba(255,212,0,0.2)" }}
        >
          <Text className="font-mont text-[10px] text-[#FFD400] mb-2">
            Dev Role Override
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            <Pressable
              onPress={() => selectRole(null)}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: !devOverride ? "#FFD400" : "rgba(169,169,169,0.15)" }}
            >
              <Text
                className="font-mont-medium text-xs"
                style={{ color: !devOverride ? "#000" : "#898989" }}
              >
                Real
              </Text>
            </Pressable>
            {devRoles.map((role) => (
              <Pressable
                key={role}
                onPress={() => selectRole(role)}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: devOverride === role ? "#FFD400" : "rgba(169,169,169,0.15)" }}
              >
                <Text
                  className="font-mont-medium text-xs capitalize"
                  style={{ color: devOverride === role ? "#000" : "#898989" }}
                >
                  {role}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </>
  );
}
