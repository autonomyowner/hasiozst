import { FlatList, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { ReelCard } from "@/components/reels/ReelCard";
import { BackArrowIcon } from "@/components/reels/ReelIcons";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTracking } from "@/hooks/useTracking";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

interface ReelsContentProps {
  isFocused: boolean;
}

export function ReelsContent({ isFocused }: ReelsContentProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const reelsQuery = useQuery(api.recommendations.forYouReels, { limit: 30 });
  const blocked = useBlockedUsers();
  const reels = (reelsQuery ?? []).filter((r) => !blocked.has(r.posterId));
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trackEvent } = useTracking();

  const onLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    setContainerHeight((prev) => prev || h);
  }, []);

  // Track reel views + watch duration
  const reelViewStartRef = useRef<number>(Date.now());
  useEffect(() => {
    const watchDuration = Date.now() - reelViewStartRef.current;
    if (activeIndex > 0 && reels[activeIndex - 1]) {
      trackEvent({
        eventType: "reel_watch",
        targetReelId: reels[activeIndex - 1]._id,
        durationMs: watchDuration,
      });
    }
    reelViewStartRef.current = Date.now();
    if (reels[activeIndex]) {
      trackEvent({ eventType: "reel_view", targetReelId: reels[activeIndex]._id });
    }
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (reelsQuery === undefined) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View className="flex-1 bg-black">
        <EmptyState
          icon="videocam-outline"
          title="No reels yet"
          message="Be the first to share a video!"
          ctaLabel="Create Reel"
          onPress={() => router.push("/create-reel")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" onLayout={onLayout}>
      {containerHeight > 0 && (
        <FlatList
          data={reels}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={containerHeight}
          decelerationRate="fast"
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.y / containerHeight
            );
            setActiveIndex(index);
          }}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <ReelCard
              reel={item}
              isActive={index === activeIndex && isFocused}
              height={containerHeight}
            />
          )}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
        />
      )}

      {/* Header overlay */}
      <View
        className="absolute left-0 right-0"
        style={{ top: insets.top }}
        pointerEvents="box-none"
      >
        <View className="flex-row items-start px-4 pt-2" pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(0,0,0,0.45)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <BackArrowIcon color="#FFD400" size={20} />
          </Pressable>
          <View className="flex-1 items-center mr-10">
            <Text className="font-mont-bold text-base text-white">
              Discover & Watch
            </Text>
            <Text className="font-mont text-xs text-white/50 text-center mt-0.5">
              Explore short product videos{"\n"}and offers
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
