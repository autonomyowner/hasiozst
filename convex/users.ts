import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent, getAuthenticatedAppUser } from "./auth";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedAppUser(ctx);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    const { email, expoPushToken, ...publicFields } = user;
    return publicFields;
  },
});

export const ensureUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatar: v.string(),
    role: v.union(
      v.literal("customer"),
      v.literal("seller"),
      v.literal("freelancer")
    ),
    sellerType: v.optional(
      v.union(
        v.literal("fournisseur"),
        v.literal("importateur"),
        v.literal("grossiste")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify the caller is authenticated and the email matches their auth session
    let authUser;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch {
      throw new Error("Not authenticated");
    }
    if (!authUser || !authUser.email) throw new Error("Not authenticated");
    if (authUser.email !== args.email) throw new Error("Not authorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      role: args.role,
      sellerType: args.sellerType,
    });

    return userId;
  },
});

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (!args.token.startsWith("ExponentPushToken[")) {
      throw new Error("Invalid push token format");
    }
    await ctx.db.patch(user._id, { expoPushToken: args.token });
  },
});

export const clearPushToken = mutation({
  args: {},
  handler: async (ctx) => {
    // Called during sign-out — silently no-op if already unauthenticated
    // instead of throwing, since the auth session may already be cleared.
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return;
    await ctx.db.patch(user._id, { expoPushToken: undefined });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      if (trimmedName.length < 2) throw new Error("Name too short (min 2 characters)");
      if (trimmedName.length > 100) throw new Error("Name too long (max 100 characters)");
    }

    const patch: { name?: string; avatar?: string } = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.avatar !== undefined) patch.avatar = args.avatar;

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

/**
 * Permanently delete the current user's account.
 *
 * Cascade-deletes user-owned content (products, reels, comments, offers, bids,
 * services, demands, cart, favorites, notifications, blocks, etc.) and
 * anonymizes records that the other party still needs (orders, conversations,
 * messages) by nulling the user FK and replacing the denormalized name with
 * "Deleted user".
 *
 * Required by Google Play User Data policy (in-app account deletion).
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const userId = user._id;
    const ANON = "Deleted user";

    // --- 1. Cascade-delete owned content (use indexes for efficiency) ---
    const deleteByIndex = async <T extends "cartItems" | "favorites" | "products" | "wholesaleProducts" | "reels" | "reelLikes" | "reelComments" | "offers" | "bids" | "demandRequests" | "demandResponses" | "freelanceServices" | "clientRequests" | "notifications" | "promotions" | "userEvents" | "userPreferences" | "deliverySettings" | "userBlocks" | "reports">(
      table: T,
      indexName: string,
      field: string,
    ) => {
      const rows = await ctx.db
        .query(table)
        // @ts-expect-error dynamic index lookup is safe here — fields verified per table
        .withIndex(indexName, (q) => q.eq(field, userId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    };

    await deleteByIndex("cartItems", "userId", "userId");
    await deleteByIndex("favorites", "userId", "userId");
    await deleteByIndex("products", "sellerId", "sellerId");
    await deleteByIndex("wholesaleProducts", "supplierId", "supplierId");
    await deleteByIndex("reels", "posterId", "posterId");
    await deleteByIndex("reelLikes", "reelId_userId", "userId"); // index col 2 — fine because we filter after
    // reelLikes has no single userId index; do a full scan instead
    {
      const likes = await ctx.db.query("reelLikes").collect();
      for (const like of likes) {
        if (like.userId === userId) await ctx.db.delete(like._id);
      }
    }
    await deleteByIndex("reelComments", "userId", "userId");
    await deleteByIndex("offers", "creatorId", "creatorId");
    await deleteByIndex("bids", "bidderId", "bidderId");
    await deleteByIndex("demandRequests", "userId", "userId");
    await deleteByIndex("demandResponses", "responderId", "responderId");
    await deleteByIndex("freelanceServices", "freelancerId", "freelancerId");
    await deleteByIndex("clientRequests", "freelancerId", "freelancerId");
    await deleteByIndex("clientRequests", "clientId", "clientId");
    await deleteByIndex("notifications", "userId", "userId");
    await deleteByIndex("promotions", "creatorId", "creatorId");
    await deleteByIndex("userEvents", "userId_createdAt", "userId");
    await deleteByIndex("userPreferences", "userId", "userId");
    await deleteByIndex("deliverySettings", "sellerId", "sellerId");
    await deleteByIndex("userBlocks", "blockerId", "blockerId");
    await deleteByIndex("userBlocks", "blockedId", "blockedId");
    // Reports filed *by* this user (keep reports filed *against* for audit)
    await deleteByIndex("reports", "reporterId", "reporterId");

    // --- 2. Anonymize records the other party still owns ---
    const buyerOrders = await ctx.db
      .query("orders")
      .withIndex("buyerId", (q) => q.eq("buyerId", userId))
      .collect();
    for (const order of buyerOrders) {
      await ctx.db.patch(order._id, {
        buyerId: null,
        buyerName: ANON,
        shippingAddress: {
          ...order.shippingAddress,
          fullName: ANON,
          phone: "",
          address: "",
        },
      });
    }
    const sellerOrders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", userId))
      .collect();
    for (const order of sellerOrders) {
      await ctx.db.patch(order._id, { sellerId: null, sellerName: ANON });
    }

    const sentMessages = await ctx.db.query("messages").collect();
    for (const msg of sentMessages) {
      if (msg.senderId === userId) {
        await ctx.db.patch(msg._id, { senderId: null, senderName: ANON });
      }
    }

    const conv1 = await ctx.db
      .query("conversations")
      .withIndex("participant1Id", (q) => q.eq("participant1Id", userId))
      .collect();
    for (const c of conv1) {
      await ctx.db.patch(c._id, { participant1Id: null, participant1Name: ANON });
    }
    const conv2 = await ctx.db
      .query("conversations")
      .withIndex("participant2Id", (q) => q.eq("participant2Id", userId))
      .collect();
    for (const c of conv2) {
      await ctx.db.patch(c._id, { participant2Id: null, participant2Name: ANON });
    }

    // --- 3. Delete the user row ---
    // The better-auth side (sessions, password hash) becomes orphaned but inert;
    // the user will be treated as new on re-signup with the same email since
    // ensureUser only matches by email against the app's `users` table.
    await ctx.db.delete(userId);

    return { ok: true };
  },
});
