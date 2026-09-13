import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { AppImage } from "@/components/ui/AppImage";
import { Reel } from "@/lib/types";
import { ReelOverlay } from "./ReelOverlay";
import { ReelSidebar } from "./ReelSidebar";
import { CommentSheet } from "./CommentSheet";
import { PauseIcon } from "./ReelIcons";
import { useReelActions } from "@/hooks/useReels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGuest } from "@/providers/GuestProvider";
import { isValidHttpUrl } from "@/lib/isValidHttpUrl";

interface ReelVideoPlayerProps {
  videoUrl: string;
  isActive: boolean;
  paused: boolean;
  onTogglePause: () => void;
}

function ReelVideoPlayer({ videoUrl, isActive, paused, onTogglePause }: ReelVideoPlayerProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (!player) return;
    if (isActive && !paused) {
      player.muted = false;
      player.play();
    } else {
      player.muted = true;
      player.pause();
    }
  }, [isActive, paused, player]);

  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.muted = true;
          player.pause();
        } catch {
          // Player may already be released
        }
      }
    };
  }, [player]);

  return (
    <>
      <VideoView
        player={player}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable
        className="absolute inset-0 items-center justify-center"
        onPress={onTogglePause}
      >
        {paused && (
          <View className="items-center justify-center rounded-full bg-black/30 p-3">
            <PauseIcon color="white" size={48} />
          </View>
        )}
      </Pressable>
    </>
  );
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  height: number;
}

export function ReelCard({ reel, isActive, height }: ReelCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showAuthNudge, setShowAuthNudge] = useState(false);
  const nudgeY = useSharedValue(80);
  const nudgeOpacity = useSharedValue(0);
  const { isLiked, toggleLike, shareReel } = useReelActions(reel._id);
  const { isGuest, exitGuestMode } = useGuest();
  const { isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const needsAuth = isGuest || !isAuthenticated;
  const nudgeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const hasVideo = isValidHttpUrl(reel.videoUrl);

  const togglePause = () => {
    if (!hasVideo) return;
    setPaused((prev) => !prev);
  };

  const dismissNudge = useCallback(() => {
    setShowAuthNudge(false);
  }, []);

  const showNudge = useCallback(() => {
    // If already visible, just extend the dismiss timer
    if (showAuthNudge) {
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      // Cancel the pending fade-out and keep it visible
      cancelAnimation(nudgeY);
      cancelAnimation(nudgeOpacity);
      nudgeY.value = 0;
      nudgeOpacity.value = 1;
      // Schedule a new fade-out
      nudgeTimer.current = setTimeout(() => {
        nudgeY.value = withTiming(40, { duration: 300 });
        nudgeOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(dismissNudge)();
        });
      }, 3200);
      return;
    }
    setShowAuthNudge(true);
    nudgeY.value = 80;
    nudgeOpacity.value = 0;
    nudgeY.value = withSequence(
      withSpring(0, { damping: 20, stiffness: 300 }),
      withDelay(3200, withTiming(40, { duration: 300 }))
    );
    nudgeOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(3200, withTiming(0, { duration: 300 }, () => {
        runOnJS(dismissNudge)();
      }))
    );
  }, [nudgeY, nudgeOpacity, dismissNudge, showAuthNudge]);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: nudgeY.value }],
    opacity: nudgeOpacity.value,
  }));

  const handleLike = () => {
    if (needsAuth) {
      showNudge();
      return;
    }
    toggleLike();
  };

  const handleComment = () => {
    if (needsAuth) {
      showNudge();
      return;
    }
    setShowComments(true);
  };

  const handleSignIn = () => {
    setShowAuthNudge(false);
    exitGuestMode();
    router.replace("/sign-in");
  };

  // Overlay and sidebar positioned from bottom of the visible card
  const overlayBottom = 12;
  const sidebarBottom = 68;

  return (
    <View style={{ height }} className="relative bg-black">
      {/* Video or thumbnail */}
      {hasVideo ? (
        <ReelVideoPlayer
          videoUrl={reel.videoUrl!}
          isActive={isActive}
          paused={paused}
          onTogglePause={togglePause}
        />
      ) : (
        <>
          <AppImage
            source={reel.thumbnailUrl}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <Pressable
            className="absolute inset-0 items-center justify-center"
            onPress={() => setPaused((v) => !v)}
          >
            {paused && (
              <View className="items-center justify-center rounded-full bg-black/30 p-3">
                <PauseIcon color="white" size={48} />
              </View>
            )}
          </Pressable>
        </>
      )}

      {/* Bottom overlay - poster info + price */}
      <ReelOverlay reel={reel} bottomOffset={overlayBottom} />

      {/* Right sidebar - like/comment/share */}
      <ReelSidebar
        reel={reel}
        isLiked={isLiked}
        onLike={handleLike}
        onComment={handleComment}
        onShare={() => shareReel(reel.productName)}
        bottomOffset={sidebarBottom}
      />

      {/* Comment sheet */}
      <CommentSheet
        reelId={reel._id}
        visible={showComments}
        commentCount={reel.comments}
        onClose={() => setShowComments(false)}
      />

      {/* Guest auth nudge — lightweight bottom bar */}
      {showAuthNudge && (
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 100,
              left: 16,
              right: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: "rgba(17,17,17,0.85)",
              borderWidth: 1,
              borderColor: "rgba(255,212,0,0.15)",
            },
            nudgeStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: "Montserrat_500Medium",
              fontSize: 13,
              color: "#fff",
              flex: 1,
              marginRight: 12,
            }}
          >
            Sign in to interact
          </Text>
          <Pressable
            onPress={handleSignIn}
            style={{
              backgroundColor: "#FFD400",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "Montserrat_700Bold",
                fontSize: 12,
                color: "#000",
              }}
            >
              Sign In
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
