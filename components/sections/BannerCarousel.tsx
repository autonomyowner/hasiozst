import { View, Dimensions, FlatList, Pressable } from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { AppImage } from "@/components/ui/AppImage";
import { Banner } from "@/lib/types";
import { useRouter } from "expo-router";
import { isValidHttpUrl } from "@/lib/isValidHttpUrl";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 204;

interface BannerCarouselProps {
  banners: Banner[];
}

function BannerVideoItem({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const scrollToIndex = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToOffset({
        offset: index * (BANNER_WIDTH + 12),
        animated: true,
      });
    },
    []
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      setActiveIndex(nextIndex);
      scrollToIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, banners.length, scrollToIndex]);

  if (banners.length === 0) return null;

  const handlePress = (banner: Banner) => {
    if (banner.linkUrl) {
      router.push(banner.linkUrl as never);
    }
  };

  return (
    <View className="mt-3">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12)
          );
          setActiveIndex(index);
        }}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            className="mr-3 overflow-hidden rounded-card"
            style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
          >
            {item.mediaType === "video" && isValidHttpUrl(item.videoUrl) ? (
              <BannerVideoItem videoUrl={item.videoUrl} />
            ) : (
              <AppImage
                source={item.imageUrl}
                style={{ width: "100%", height: "100%" }}
              />
            )}
          </Pressable>
        )}
      />
      {banners.length > 1 && (
        <View className="mt-3 flex-row items-center justify-center">
          {banners.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-1.5 rounded-pill ${
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-text-secondary"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
