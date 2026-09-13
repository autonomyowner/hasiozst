import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";

interface SupplierInfoProps {
  name: string;
  avatar?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  trustedCustomers?: number;
  verified?: boolean;
}

export function SupplierInfo({
  name,
  avatar,
  location,
  rating,
  reviewCount,
  trustedCustomers,
  verified = true,
}: SupplierInfoProps) {
  return (
    <View>
      {/* Supplier name + avatar */}
      <View className="flex-row items-center">
        {avatar ? (
          <AppImage
            source={avatar}
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        ) : (
          <View className="h-9 w-9 rounded-full bg-surface items-center justify-center">
            <Text className="font-mont-bold text-sm text-primary">
              {name.charAt(0)}
            </Text>
          </View>
        )}
        <Text className="font-mont-semibold text-sm text-white ml-2">
          {name}
        </Text>
        {verified && (
          <View className="ml-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          </View>
        )}
      </View>

      {/* Location */}
      {location && (
        <View className="flex-row items-center mt-1 ml-11">
          <Ionicons name="location-outline" size={12} color="#898989" />
          <Text className="font-mont text-xs text-text-secondary ml-1">
            {location}
          </Text>
        </View>
      )}

      {/* Rating + trusted customers */}
      {(rating || trustedCustomers) && (
        <View className="flex-row items-center mt-2" style={{ gap: 10 }}>
          {rating && (
            <View className="flex-row items-center rounded-pill bg-card px-2.5 py-1">
              <Ionicons name="star" size={12} color="#FFD400" />
              <Text className="font-mont-semibold text-xs text-white ml-1">
                {rating}
              </Text>
              {reviewCount && (
                <Text className="font-mont text-xs text-text-secondary ml-1">
                  ({reviewCount} reviews)
                </Text>
              )}
            </View>
          )}
          {trustedCustomers && (
            <Text className="font-mont text-xs text-text-secondary">
              Trusted by {trustedCustomers.toLocaleString()}+ customers
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
