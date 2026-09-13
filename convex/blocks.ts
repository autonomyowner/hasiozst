import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const toggleBlock = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user._id === args.targetUserId) {
      throw new Error("You cannot block yourself");
    }

    const existing = await ctx.db
      .query("userBlocks")
      .withIndex("blockerId_blockedId", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.targetUserId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { blocked: false };
    }

    await ctx.db.insert("userBlocks", {
      blockerId: user._id,
      blockedId: args.targetUserId,
      createdAt: Date.now(),
    });
    return { blocked: true };
  },
});

export const isBlocked = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return false;

    const existing = await ctx.db
      .query("userBlocks")
      .withIndex("blockerId_blockedId", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.targetUserId),
      )
      .first();
    return Boolean(existing);
  },
});

export const listBlockedIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const blocks = await ctx.db
      .query("userBlocks")
      .withIndex("blockerId", (q) => q.eq("blockerId", user._id))
      .collect();
    return blocks.map((b) => b.blockedId);
  },
});
