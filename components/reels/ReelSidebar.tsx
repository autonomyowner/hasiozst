import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reel } from "@/lib/types";
import { formatCompactNumber } from "@/lib/formatters";
import { LikeIcon, CommentIcon, ShareIcon } from "./ReelIcons";
import { ContentMenu } from "@/components/ui/ContentMenu";

interface ReelSidebarProps {
  reel: Reel;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  bottomOffset: number;
}

export function ReelSidebar({
  reel,
  isLiked,
  onLike,
  onComment,
  onShare,
  bottomOffset,
}: ReelSidebarProps) {
  return (
    <View
      className="absolute right-3 items-center gap-3"
      style={{ bottom: bottomOffset }}
    >
      {/* Like */}
      <Pressable onPress={onLike} className="items-center">
        <LikeIcon color={isLiked ? "#EF4444" : "#fff"} size={26} />
        <Text className="font-mont text-white mt-1" style={{ fontSize: 12 }}>
          {formatCompactNumber(reel.likes)}
        </Text>
      </Pressable>

      {/* Comment */}
      <Pressable onPress={onComment} className="items-center">
        <CommentIcon color="white" size={24} />
        <Text className="font-mont text-white mt-1" style={{ fontSize: 12 }}>
          {formatCompactNumber(reel.comments)}
        </Text>
      </Pressable>

      {/* Share */}
      <Pressable onPress={onShare} className="items-center">
        <ShareIcon color="white" size={24} />
        <Text className="font-mont text-white mt-1" style={{ fontSize: 12 }}>
          {formatCompactNumber(reel.shares)}
        </Text>
      </Pressable>

      {/* Report / block */}
      <ContentMenu
        targetType="reel"
        targetId={reel._id}
        ownerId={reel.posterId}
        ownerName={reel.posterName}
        trigger={(open) => (
          <Pressable onPress={open} className="items-center">
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </Pressable>
        )}
      />
    </View>
  );
}
