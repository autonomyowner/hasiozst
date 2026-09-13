import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("expired"))
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("promotions")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .take(100);
    }
    return await ctx.db.query("promotions").take(100);
  },
});

export const listByCreator = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("promotions")
      .withIndex("creatorId", (q) => q.eq("creatorId", user._id))
      .take(100);
  },
});

/**
 * Returns active promotions joined with their linked products.
 * Skips promotions without a productId (legacy) or with deleted/inactive products.
 * Each returned product includes `isPromoted: true` and `promotionId`.
 */
export const listActiveWithProducts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const promos = await ctx.db
      .query("promotions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .take(100);

    const results: Array<{
      _id: string;
      name: string;
      price: number;
      imageUrl: string;
      category: string;
      sellerId: string;
      seller?: string;
      isActive: boolean;
      description?: string;
      isNew?: boolean;
      oldPrice?: number;
      rating?: number;
      brand?: string;
      images?: string[];
      videoUrl?: string;
      productType?: string;
      isPromoted: true;
      promotionId: string;
    }> = [];

    for (const promo of promos) {
      // Skip legacy promotions without productId
      if (!promo.productId) continue;
      // Skip expired (cron may not have run yet)
      if (promo.expiresAt && promo.expiresAt <= now) continue;

      const product = await ctx.db.get(promo.productId);
      if (!product || !product.isActive) continue;

      results.push({
        _id: product._id as string,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        sellerId: product.sellerId as string,
        seller: product.seller,
        isActive: product.isActive,
        description: product.description,
        isNew: product.isNew,
        oldPrice: product.oldPrice,
        rating: product.rating,
        brand: product.brand,
        images: product.images,
        videoUrl: product.videoUrl,
        productType: product.productType,
        isPromoted: true,
        promotionId: promo._id as string,
      });
    }

    return results;
  },
});

/**
 * Returns product IDs that have active promotions.
 * Used by recommendation engine for score boosting.
 */
export const getActivePromotedProductIds = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const promos = await ctx.db
      .query("promotions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .take(200);

    return promos
      .filter((p) => p.productId && (!p.expiresAt || p.expiresAt > now))
      .map((p) => p.productId as string);
  },
});

/**
 * Create a product-linked promotion.
 * Validates product ownership, active status, and no duplicate active promotions.
 */
export const create = mutation({
  args: {
    productId: v.id("products"),
    description: v.optional(v.string()),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller") throw new Error("Only sellers can create promotions");
    if (user.plan !== "pro") throw new Error("Pro plan required to create promotions");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== user._id) throw new Error("Not authorized — you can only promote your own products");
    if (!product.isActive) throw new Error("Cannot promote an inactive product");

    // Check no existing active promotion on same product
    const existing = await ctx.db
      .query("promotions")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      throw new Error("This product already has an active promotion");
    }

    const durationDays = args.durationDays ?? 30;
    if (durationDays < 7 || durationDays > 90) {
      throw new Error("Duration must be between 7 and 90 days");
    }

    return await ctx.db.insert("promotions", {
      productId: args.productId,
      title: product.name,
      description: args.description ?? product.description,
      imageUrl: product.imageUrl,
      category: product.category,
      price: product.price,
      priceLow: product.price,
      priceHigh: product.oldPrice ?? product.price,
      deliveryTime: "",
      creatorId: user._id,
      creatorName: user.name,
      status: "active",
      impressions: 0,
      clicks: 0,
      expiresAt: Date.now() + durationDays * 86400000,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const promotion = await ctx.db.get(args.id);
    if (!promotion) return; // Already deleted — no-op
    if (promotion.creatorId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

/**
 * Record an impression on a promotion (fire-and-forget).
 */
export const recordImpression = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.id);
    if (!promo || promo.status !== "active") return;
    await ctx.db.patch(args.id, {
      impressions: (promo.impressions ?? 0) + 1,
    });
  },
});

/**
 * Record a click on a promotion (fire-and-forget).
 */
export const recordClick = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.id);
    if (!promo || promo.status !== "active") return;
    await ctx.db.patch(args.id, {
      clicks: (promo.clicks ?? 0) + 1,
    });
  },
});

/**
 * Expire stale promotions. Called by hourly cron.
 */
export const expireStalePromotions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("promotions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .take(500);

    for (const promo of active) {
      if (promo.expiresAt && promo.expiresAt <= now) {
        await ctx.db.patch(promo._id, { status: "expired" });
      }
    }
  },
});
