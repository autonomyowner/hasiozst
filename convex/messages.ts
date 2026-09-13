import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Verify participant
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return [];
    if (conv.participant1Id !== user._id && conv.participant2Id !== user._id) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(50);
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const text = args.text.trim();
    if (text.length === 0) throw new Error("Message cannot be empty");
    if (text.length > 1000) throw new Error("Message too long (max 1000 characters)");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.participant1Id !== user._id && conv.participant2Id !== user._id) {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    // Insert message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      senderName: user.name,
      text,
      isRead: false,
      createdAt: now,
    });

    // Update conversation preview + increment recipient's unread counter
    const isP1 = conv.participant1Id === user._id;
    await ctx.db.patch(args.conversationId, {
      lastMessageText: text.slice(0, 100),
      lastMessageSenderId: user._id,
      lastMessageAt: now,
      ...(isP1
        ? { participant2Unread: conv.participant2Unread + 1 }
        : { participant1Unread: conv.participant1Unread + 1 }),
    });

    // Send push notification to recipient (skip if account deleted)
    const recipientId = isP1 ? conv.participant2Id : conv.participant1Id;
    if (recipientId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        type: "message_received",
        title: `💬 ${user.name}`,
        message: text.slice(0, 100),
        relatedId: args.conversationId,
        userId: recipientId,
      });
    }
  },
});

export const deleteMessage = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.id);
    if (!message) return;
    if (message.senderId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
