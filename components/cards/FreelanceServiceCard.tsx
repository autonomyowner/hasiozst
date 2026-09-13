import { memo } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { FreelanceService } from "@/lib/types";
import { formatPrice } from "@/lib/formatters";

interface FreelanceServiceCardProps {
  service: FreelanceService;
}

export const FreelanceServiceCard = memo(function FreelanceServiceCard({ service }: FreelanceServiceCardProps) {
  const imageCount = service.images?.length ?? 1;
  const hasVideo = !!service.videoUrl;

  return (
    <Pressable className="mr-3 w-48">
      <View className="overflow-hidden rounded-card bg-card">
        <View className="relative">
          <AppImage
            source={service.imageUrl}
            className="h-32 w-full"
          />
          {/* Centered play button for video */}
          {hasVideo && (
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Ionicons name="play" size={16} color="#fff" />
              </View>
            </View>
          )}
          {/* Image count badge */}
          {imageCount > 1 && (
            <View className="absolute top-2 right-2">
              <View className="flex-row items-center bg-black/60 rounded-full px-1.5 py-0.5">
                <Ionicons name="images-outline" size={10} color="#fff" />
                <Text className="font-mont text-[10px] text-white ml-0.5">
                  {imageCount}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View className="p-3" style={{ gap: 4 }}>
          <Text
            className="font-mont-medium text-sm text-white"
            numberOfLines={1}
          >
            {service.title}
          </Text>
          <View className="flex-row items-center gap-2">
            {service.freelancerAvatar ? (
              <Image
                source={{ uri: service.freelancerAvatar }}
                style={{ width: 16, height: 16, borderRadius: 8 }}
              />
            ) : null}
            <Text
              className="font-mont text-xs text-text-secondary"
              numberOfLines={1}
            >
              {service.freelancerName}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-sm text-primary">
              {formatPrice(service.price)}
            </Text>
            <Text className="font-mont text-xs text-text-secondary">
              {service.rating} ({service.completedJobs})
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
