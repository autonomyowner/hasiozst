import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGuest } from "@/providers/GuestProvider";
import { ScreenContainer } from "@/components/layout/ScreenContainer";

interface GuestSignInPromptProps {
  message?: string;
}

export function GuestSignInPrompt({
  message = "Sign in to access this feature",
}: GuestSignInPromptProps) {
  const { exitGuestMode } = useGuest();
  const router = useRouter();

  const handleSignIn = () => {
    exitGuestMode();
    router.replace("/sign-in");
  };

  return (
    <ScreenContainer>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "rgba(255,212,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="lock-open-outline" size={30} color="#FFD400" />
        </View>

        {/* Message */}
        <Text
          style={{
            fontFamily: "Montserrat_500Medium",
            fontSize: 15,
            color: "#898989",
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          {message}
        </Text>

        {/* Sign In button */}
        <Pressable
          onPress={handleSignIn}
          style={{
            backgroundColor: "#FFD400",
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "Montserrat_700Bold",
              fontSize: 14,
              color: "#000",
            }}
          >
            Sign In
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
