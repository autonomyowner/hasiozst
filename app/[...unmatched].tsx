import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#5F6E63" />
      <Text className="font-mont-bold text-xl text-text-primary mt-4">
        Page Not Found
      </Text>
      <Text className="font-mont text-sm text-text-secondary mt-2 text-center">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Pressable
        onPress={() => router.replace("/")}
        className="mt-6 bg-primary px-6 py-3 rounded-xl"
      >
        <Text className="font-mont-semibold text-sm text-white">
          Go Home
        </Text>
      </Pressable>
    </View>
  );
}
