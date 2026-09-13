import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("userId_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Not found");
    if (notification.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("userId_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();

    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { read: true })));
  },
});

export const deleteOne = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification) return;
    if (notification.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(200);

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return notifications.length;
  },
});

export const createNotification = internalMutation({
  args: {
    type: v.union(
      v.literal("order_placed"),
      v.literal("order_status_changed"),
      v.literal("bid_received"),
      v.literal("bid_accepted"),
      v.literal("bid_rejected"),
      v.literal("offer_closed"),
      v.literal("service_request_received"),
      v.literal("service_request_accepted"),
      v.literal("service_request_completed"),
      v.literal("service_request_declined"),
      v.literal("demand_response_received"),
      v.literal("demand_response_accepted"),
      v.literal("demand_response_declined"),
      v.literal("reel_comment"),
      v.literal("stock_depleted"),
      v.literal("shipment_created"),
      v.literal("shipment_delivered"),
      v.literal("shipment_failed"),
      v.literal("message_received"),
      v.literal("report_submitted"),
      v.literal("report_received"),
      v.literal("content_removed")
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      type: args.type,
      title: args.title,
      message: args.message,
      relatedId: args.relatedId,
      userId: args.userId,
      read: false,
      createdAt: Date.now(),
    });

    // Schedule push notification (fire-and-forget)
    await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      data: { type: args.type, relatedId: args.relatedId },
    });

    return notificationId;
  },
});

// --- Push notification internals ---

export const getUserPushToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.expoPushToken ?? null;
  },
});

export const clearUserPushToken = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { expoPushToken: undefined });
  },
});

export const sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.object({
      type: v.string(),
      relatedId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.notifications.getUserPushToken, {
      userId: args.userId,
    });

    if (!token) return;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: args.title,
        body: args.body,
        data: args.data,
        sound: "default",
        channelId: "default",
      }),
    });

    const result = await response.json();

    // Clean up invalid tokens
    if (result.data?.status === "error" && result.data?.details?.error === "DeviceNotRegistered") {
      await ctx.runMutation(internal.notifications.clearUserPushToken, {
        userId: args.userId,
      });
    }
  },
});
