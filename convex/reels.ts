import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reels")
      .withIndex("createdAt")
      .order("desc")
      .take(100);
  },
});

export const getById = query({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.string(),
    productId: v.optional(v.id("products")),
    productName: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Derive posterRole from user fields — not from client args
    const posterRole: "customer" | "fournisseur" | "importateur" | "grossiste" | "freelancer" | "admin" =
      user.role === "seller"
        ? (user.sellerType ?? "fournisseur")
        : user.role === "freelancer"
          ? "freelancer"
          : user.role === "admin"
            ? "admin"
            : "customer";

    return await ctx.db.insert("reels", {
      videoUrl: args.videoUrl,
      thumbnailUrl: args.thumbnailUrl,
      productId: args.productId,
      productName: args.productName,
      price: args.price,
      posterName: user.name,
      posterRole,
      posterAvatar: user.avatar,
      likes: 0,
      comments: 0,
      shares: 0,
      posterId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const toggleLike = mutation({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const reel = await ctx.db.get(args.id);
    if (!reel) throw new Error("Reel not found");

    const existing = await ctx.db
      .query("reelLikes")
      .withIndex("reelId_userId", (q) =>
        q.eq("reelId", args.id).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.id, { likes: Math.max(0, reel.likes - 1) });
      return false;
    }

    await ctx.db.insert("reelLikes", { reelId: args.id, userId: user._id });
    await ctx.db.patch(args.id, { likes: reel.likes + 1 });
    return true;
  },
});

export const getLikedByUser = query({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    try {
      const user = await getAuthenticatedAppUser(ctx);
      if (!user) return false;

      const existing = await ctx.db
        .query("reelLikes")
        .withIndex("reelId_userId", (q) =>
          q.eq("reelId", args.id).eq("userId", user._id)
        )
        .first();

      return existing !== null;
    } catch {
      return false;
    }
  },
});

export const addComment = mutation({
  args: { id: v.id("reels"), text: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.text.length > 500) throw new Error("Comment too long");

    const reel = await ctx.db.get(args.id);
    if (!reel) throw new Error("Reel not found");

    await ctx.db.insert("reelComments", {
      reelId: args.id,
      userId: user._id,
      userName: user.name,
      text: args.text,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.id, { comments: reel.comments + 1 });

    // Notify reel poster (skip if commenting on own reel)
    if (reel.posterId !== user._id) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "reel_comment",
        title: "تعليق جديد",
        message: `${user.name} علّق على الريل الخاص بك`,
        relatedId: args.id,
        userId: reel.posterId,
      });
    }
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("reelComments") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== user._id) throw new Error("Not authorized");

    const reel = await ctx.db.get(comment.reelId);
    if (reel) {
      await ctx.db.patch(comment.reelId, { comments: Math.max(0, reel.comments - 1) });
    }

    await ctx.db.delete(args.commentId);
  },
});

export const listComments = query({
  args: {
    id: v.id("reels"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // Backwards-compat: older clients call without paginationOpts
    if (!args.paginationOpts) {
      const comments = await ctx.db
        .query("reelComments")
        .withIndex("reelId", (q) => q.eq("reelId", args.id))
        .order("desc")
        .take(50);
      return { page: comments, isDone: true, continueCursor: "" };
    }
    return await ctx.db
      .query("reelComments")
      .withIndex("reelId", (q) => q.eq("reelId", args.id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Combined query: comments + isLiked in one call (avoids 2 queries per swipe)
export const getReelInteractions = query({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("reelComments")
      .withIndex("reelId", (q) => q.eq("reelId", args.id))
      .order("desc")
      .take(50);

    let isLiked = false;
    try {
      const user = await getAuthenticatedAppUser(ctx);
      if (user) {
        const existing = await ctx.db
          .query("reelLikes")
          .withIndex("reelId_userId", (q) =>
            q.eq("reelId", args.id).eq("userId", user._id)
          )
          .first();
        isLiked = existing !== null;
      }
    } catch {
      // Not authenticated
    }

    return { comments, isLiked };
  },
});

export const incrementShares = mutation({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const reel = await ctx.db.get(args.id);
    if (!reel) throw new Error("Reel not found");

    await ctx.db.patch(args.id, { shares: reel.shares + 1 });
  },
});
