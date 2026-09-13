import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { User, EffectiveRole, getEffectiveRole } from "@/lib/types";
import { AppImage } from "@/components/ui/AppImage";

interface ProfileHeaderProps {
  user: User;
}

const effectiveRoleLabel: Record<EffectiveRole, string> = {
  customer: "Customer",
  fournisseur: "Fournisseur",
  importateur: "Importateur",
  grossiste: "Grossiste",
  freelancer: "Freelancer",
  admin: "Admin",
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const role = getEffectiveRole(user);
  const router = useRouter();

  return (
    <View
      className="mx-4 mt-2 mb-4 rounded-card overflow-hidden"
      style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
    >
      {/* Cover banner */}
      <View style={{ height: 107 }}>
        <Image
          source={require("@/assets/media/photos/mountains.webp")}
          style={{ width: "100%", height: "100%", borderRadius: 9 }}
          resizeMode="cover"
        />
      </View>

      {/* Avatar overlapping cover — left-aligned like Figma */}
      <View className="px-4" style={{ marginTop: -35 }}>
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: 69,
            height: 69,
            borderWidth: 3,
            borderColor: "#F8F4ED",
            backgroundColor: user.avatar ? "transparent" : "#1A4B5F",
          }}
        >
          {user.avatar ? (
            <AppImage
              source={user.avatar}
              style={{ width: 63, height: 63, borderRadius: 32 }}
            />
          ) : (
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#FFFFFF" }}>
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          )}
        </View>
      </View>

      {/* Name row: name + edit button + role badge */}
      <View className="px-4 mt-2 flex-row items-center">
        <Text className="font-mont-bold text-[17px] text-text-primary">
          {user.name}
        </Text>

        {/* Edit icon circle */}
        <Pressable
          onPress={() => router.push("/edit-profile")}
          className="ml-2 items-center justify-center rounded-full"
          style={{
            width: 29,
            height: 29,
            backgroundColor: "rgba(26,75,95,0.14)",
          }}
        >
          <Ionicons name="pencil" size={14} color="#0D1A12" />
        </Pressable>

        {/* Role badge */}
        <View
          className="ml-auto rounded-pill px-3.5 py-1"
          style={{ backgroundColor: "#EDE3C2" }}
        >
          <Text className="font-mont-medium text-xs text-primary">
            {effectiveRoleLabel[role]}
          </Text>
        </View>
      </View>

      {/* Email */}
      <Text
        className="px-4 mt-0.5 font-mont text-xs"
        style={{ color: "#5F6E63", letterSpacing: 0.72 }}
      >
        {user.email}
      </Text>

      {/* Divider */}
      <View
        className="mx-4 mt-4"
        style={{ height: 1, backgroundColor: "rgba(26,75,95,0.14)" }}
      />

      {/* Bottom spacing */}
      <View style={{ height: 16 }} />
    </View>
  );
}
