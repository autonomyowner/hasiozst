import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Reel } from "@/lib/types";
import { formatPrice } from "@/lib/formatters";
import { ArrowRightIcon } from "./ReelIcons";

interface ReelOverlayProps {
  reel: Reel;
  bottomOffset: number;
}

export function ReelOverlay({ reel, bottomOffset }: ReelOverlayProps) {
  const router = useRouter();

  const priceText = formatPrice(reel.price);
  const priceNumber = priceText.replace(/\s*DA\s*$/, "").trim();

  return (
    <View
      className="absolute left-0 right-0 px-4"
      style={{ bottom: bottomOffset }}
    >
      {/* Name row with avatar */}
      <View className="flex-row items-center mb-2">
        {/* User avatar / fallback icon */}
        {reel.posterAvatar ? (
          <Image
            source={{ uri: reel.posterAvatar }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: "#333",
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#333",
            }}
          >
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}

        <Text
          className="font-mont-semibold text-white ml-3 flex-1"
          style={{ fontSize: 14 }}
          numberOfLines={1}
        >
          {reel.posterName}
        </Text>
      </View>

      {/* Product description + price row */}
      <View className="flex-row items-center">
        <View className="flex-1 mr-3">
          <Text
            className="font-mont-medium text-white"
            style={{ fontSize: 13 }}
            numberOfLines={1}
          >
            {reel.productName}
          </Text>
        </View>

        {/* Price */}
        <View className="flex-row items-baseline mr-2">
          <Text
            className="font-mont-semibold text-primary"
            style={{ fontSize: 20 }}
          >
            {priceNumber}
          </Text>
          <Text
            className="font-mont-semibold text-primary ml-1"
            style={{ fontSize: 10 }}
          >
            DA
          </Text>
        </View>

        {/* Arrow button */}
        <Pressable
          onPress={() => {
            if (reel.productId) router.push(`/product/${reel.productId}`);
          }}
          style={{
            width: 31,
            height: 31,
            borderRadius: 16,
            backgroundColor: "#FFD400",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FFD400",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <ArrowRightIcon color="#000" size={16} />
        </Pressable>
      </View>
    </View>
  );
}
