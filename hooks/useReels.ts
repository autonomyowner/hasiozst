import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Share } from "react-native";
import type { Id } from "../convex/_generated/dataModel";

export function useReelActions(reelId: Id<"reels">) {
  const isLiked = useQuery(api.reels.getLikedByUser, { id: reelId }) ?? false;
  const toggleLikeMutation = useMutation(api.reels.toggleLike);
  const addCommentMutation = useMutation(api.reels.addComment);
  const incrementSharesMutation = useMutation(api.reels.incrementShares);

  const toggleLike = async () => {
    try {
      await toggleLikeMutation({ id: reelId });
    } catch {
      // Silent — like toggle is non-critical
    }
  };

  const addComment = async (text: string) => {
    if (!text.trim()) return;
    try {
      await addCommentMutation({ id: reelId, text: text.trim() });
    } catch {
      throw new Error("Failed to add comment");
    }
  };

  const shareReel = async (productName: string) => {
    const webUrl = `https://www.hasio.com/reels/${reelId}`;
    try {
      const result = await Share.share({
        message: `Check out "${productName}" on HASIO!\n\n${webUrl}`,
        url: webUrl,
        title: `${productName} — HASIO`,
      });
      if (result.action === Share.sharedAction) {
        await incrementSharesMutation({ id: reelId });
      }
    } catch {
      // User cancelled share
    }
  };

  return { isLiked, toggleLike, addComment, shareReel };
}
