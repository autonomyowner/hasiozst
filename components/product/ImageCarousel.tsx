import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ViewToken,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "@/components/ui/AppImage";
import { Badge } from "@/components/ui/Badge";
import { isValidHttpUrl } from "@/lib/isValidHttpUrl";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const CARD_HEIGHT = 240;

type MediaItem = { type: "image"; uri: string } | { type: "video"; uri: string };

interface ImageCarouselProps {
  images: string[];
  videoUrl?: string;
  badge?: string;
  minOrder?: number;
  onBack: () => void;
}

function VideoSlide({
  uri,
  isActive,
}: {
  uri: string;
  isActive: boolean;
}) {
  const [started, setStarted] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Auto-pause when swiped away, resume when swiped back (if started)
  useEffect(() => {
    if (!isActive) {
      player.pause();
    } else if (started) {
      player.play();
    }
  }, [isActive, started, player]);

  const handleStart = useCallback(() => {
    player.play();
    setStarted(true);
  }, [player]);

  return (
    <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: "#000" }}>
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls={started}
        fullscreenOptions={{ enable: false }}
      />
      {/* Initial play button — once tapped, native controls take over */}
      {!started && (
        <Pressable
          onPress={handleStart}
          className="absolute inset-0 items-center justify-center"
        >
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <Ionicons name="play" size={28} color="#fff" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function ImageCarousel({
  images,
  videoUrl,
  badge,
  minOrder,
  onBack,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Build media items: images + optional video as last slide.
  // `isValidHttpUrl` rejects empty strings, "undefined"/"null" literals, and
  // anything without an http(s) scheme — protects expo-video from bad input.
  const mediaItems: MediaItem[] = [
    ...images.map((uri) => ({ type: "image" as const, uri })),
    ...(isValidHttpUrl(videoUrl) ? [{ type: "video" as const, uri: videoUrl }] : []),
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrent(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const scrollTo = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? Math.max(0, current - 1)
        : Math.min(mediaItems.length - 1, current + 1);
    flatListRef.current?.scrollToIndex({ index: newIndex });
  };

  return (
    <View
      className="relative overflow-hidden rounded-card mt-3"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginHorizontal: CARD_HORIZONTAL_MARGIN,
        backgroundColor: "#141A16",
      }}
    >
      <FlatList
        ref={flatListRef}
        data={mediaItems}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) =>
          item.type === "video" ? (
            <VideoSlide uri={item.uri} isActive={index === current} />
          ) : (
            <View
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: "#141A16",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppImage
                source={item.uri}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
          )
        }
      />

      {/* Back button — top-left of card */}
      <Pressable
        onPress={onBack}
        className="absolute top-3 left-3 h-9 w-9 items-center justify-center rounded-full bg-black/60"
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
      </Pressable>

      {/* Badge */}
      {badge && (
        <View className="absolute top-3 left-14 ml-1">
          <Badge
            label={badge}
            variant={
              badge === "Organic"
                ? "success"
                : badge === "Imported"
                ? "primary"
                : "new"
            }
          />
        </View>
      )}

      {/* Nav arrows */}
      {mediaItems.length > 1 && (
        <>
          <Pressable
            onPress={() => scrollTo("prev")}
            className="absolute left-2 top-1/2 -mt-4 h-8 w-8 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => scrollTo("next")}
            className="absolute right-2 top-1/2 -mt-4 h-8 w-8 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </>
      )}

      {/* Min order overlay */}
      {minOrder && (
        <View className="absolute bottom-2 left-4 rounded-pill bg-black/70 px-3 py-1">
          <Text className="font-mont text-xs text-white">
            Minimum Order: {minOrder} Units
          </Text>
        </View>
      )}

      {/* Dot indicators */}
      {mediaItems.length > 1 && (
        <View
          className="absolute bottom-2 right-4 flex-row items-center"
          style={{ gap: 4 }}
        >
          {mediaItems.map((item, i) => (
            <View key={i} className="relative">
              <View
                className={`h-1.5 rounded-full ${
                  i === current ? "w-4 bg-gold" : "w-1.5 bg-white/50"
                }`}
              />
              {item.type === "video" && (
                <View className="absolute -top-2.5 left-1/2 -ml-1">
                  <Ionicons name="videocam" size={8} color="#fff" />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
