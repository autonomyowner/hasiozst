import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";
import type { Id } from "./_generated/dataModel";

/** Always order participant IDs consistently for dedup index. */
function orderParticipants(
  id1: Id<"users">,
  id2: Id<"users">
): [Id<"users">, Id<"users">] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

const contextTypeValidator = v.union(
  v.literal("product"),
  v.literal("order"),
  v.literal("service"),
  v.literal("offer"),
  v.literal("wholesaleProduct")
);

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Fetch from both participant indexes
    const [asP1, asP2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("participant1_lastMessage", (q) =>
          q.eq("participant1Id", user._id)
        )
        .order("desc")
        .take(50),
      ctx.db
        .query("conversations")
        .withIndex("participant2_lastMessage", (q) =>
          q.eq("participant2Id", user._id)
        )
        .order("desc")
        .take(50),
    ]);

    // Merge, deduplicate, filter to only conversations with messages, sort by lastMessageAt desc
    const seen = new Set<string>();
    const all = [...asP1, ...asP2].filter((c) => {
      if (seen.has(c._id)) return false;
      seen.add(c._id);
      return c.lastMessageAt !== undefined;
    });

    all.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
    return all.slice(0, 50);
  },
});

export const getUnreadTotal = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const [asP1, asP2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("participant1Id", (q) =>
          q.eq("participant1Id", user._id)
        )
        .take(100),
      ctx.db
        .query("conversations")
        .withIndex("participant2Id", (q) =>
          q.eq("participant2Id", user._id)
        )
        .take(100),
    ]);

    let total = 0;
    const seen = new Set<string>();
    for (const c of [...asP1, ...asP2]) {
      if (seen.has(c._id)) continue;
      seen.add(c._id);
      if (c.participant1Id === user._id) {
        total += c.participant1Unread;
      } else {
        total += c.participant2Unread;
      }
    }
    return total;
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const conv = await ctx.db.get(args.id);
    if (!conv) return null;
    if (conv.participant1Id !== user._id && conv.participant2Id !== user._id) {
      return null;
    }
    return conv;
  },
});

export const getOrCreate = mutation({
  args: {
    otherUserId: v.id("users"),
    contextType: contextTypeValidator,
    contextId: v.string(),
    contextTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.otherUserId === user._id) {
      throw new Error("Cannot message yourself");
    }

    const [p1Id, p2Id] = orderParticipants(user._id, args.otherUserId);

    // Check for existing conversation with same context
    const existing = await ctx.db
      .query("conversations")
      .withIndex("dedup", (q) =>
        q
          .eq("participant1Id", p1Id)
          .eq("participant2Id", p2Id)
          .eq("contextType", args.contextType)
          .eq("contextId", args.contextId)
      )
      .first();

    if (existing) return existing._id;

    // Fetch other user's info for denormalized fields
    const otherUser = await ctx.db.get(args.otherUserId);
    if (!otherUser) throw new Error("User not found");

    const p1IsMe = p1Id === user._id;

    const conversationId = await ctx.db.insert("conversations", {
      participant1Id: p1Id,
      participant2Id: p2Id,
      participant1Name: p1IsMe ? user.name : otherUser.name,
      participant1Avatar: p1IsMe ? user.avatar : otherUser.avatar,
      participant2Name: p1IsMe ? otherUser.name : user.name,
      participant2Avatar: p1IsMe ? otherUser.avatar : user.avatar,
      contextType: args.contextType,
      contextId: args.contextId,
      contextTitle: args.contextTitle,
      participant1Unread: 0,
      participant2Unread: 0,
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const conv = await ctx.db.get(args.id);
    if (!conv) return;
    if (conv.participant1Id !== user._id && conv.participant2Id !== user._id) {
      throw new Error("Not authorized");
    }

    // Reset my unread counter
    const isP1 = conv.participant1Id === user._id;
    await ctx.db.patch(args.id, isP1 ? { participant1Unread: 0 } : { participant2Unread: 0 });

    // Mark unread messages from the other person as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("conversationId_isRead_senderId", (q) =>
        q
          .eq("conversationId", args.id)
          .eq("isRead", false)
      )
      .take(200);

    // Only mark messages sent by the OTHER user as read
    const toMark = unreadMessages.filter((m) => m.senderId !== user._id);
    await Promise.all(toMark.map((m) => ctx.db.patch(m._id, { isRead: true })));
  },
});

export const deleteConversation = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const conv = await ctx.db.get(args.id);
    if (!conv) return;
    if (conv.participant1Id !== user._id && conv.participant2Id !== user._id) {
      throw new Error("Not authorized");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("conversationId_createdAt", (q) =>
        q.eq("conversationId", args.id)
      )
      .take(500);

    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));
    await ctx.db.delete(args.id);
  },
});
