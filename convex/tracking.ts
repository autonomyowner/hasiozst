import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

const EVENT_TYPE = v.union(
  v.literal("product_view"),
  v.literal("reel_view"),
  v.literal("reel_watch"),
  v.literal("service_view"),
  v.literal("search_query"),
  v.literal("category_browse"),
  v.literal("add_to_cart"),
  v.literal("purchase"),
  v.literal("favorite_add"),
  v.literal("reel_like"),
  v.literal("reel_comment"),
  v.literal("reel_share"),
  v.literal("service_request"),
  v.literal("promotion_view"),
  v.literal("promotion_click")
);

// Signal weights for preference computation
const SIGNAL_WEIGHTS: Record<string, number> = {
  purchase: 5.0,
  favorite_add: 3.0,
  add_to_cart: 3.0,
  reel_share: 3.0,
  reel_comment: 2.5,
  reel_like: 2.0,
  service_request: 3.0,
  product_view: 1.0,
  reel_view: 0.5,
  reel_watch: 1.5,
  service_view: 1.0,
  search_query: 1.0,
  category_browse: 0.5,
  promotion_view: 0.3,
  promotion_click: 1.5,
};

// Heavy signals that trigger immediate preference recomputation
const HEAVY_SIGNALS = new Set([
  "purchase",
  "favorite_add",
  "add_to_cart",
  "reel_like",
  "reel_share",
  "service_request",
]);

/**
 * Fire-and-forget event tracking mutation.
 * Inserts a raw event and optionally schedules preference recomputation.
 */
export const trackEvent = mutation({
  args: {
    eventType: EVENT_TYPE,
    targetProductId: v.optional(v.id("products")),
    targetReelId: v.optional(v.id("reels")),
    targetServiceId: v.optional(v.id("freelanceServices")),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    pricePoint: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return; // Guest — silently skip

    await ctx.db.insert("userEvents", {
      userId: user._id,
      eventType: args.eventType,
      targetProductId: args.targetProductId,
      targetReelId: args.targetReelId,
      targetServiceId: args.targetServiceId,
      category: args.category,
      searchQuery: args.searchQuery,
      durationMs: args.durationMs,
      pricePoint: args.pricePoint,
      createdAt: Date.now(),
    });

    // Schedule preference update for heavy signals
    if (HEAVY_SIGNALS.has(args.eventType)) {
      await ctx.scheduler.runAfter(
        0,
        internal.tracking.updateUserPreferences,
        { userId: user._id }
      );
    }
  },
});

/**
 * Recompute user preferences from the last 90 days of events.
 * Called async via scheduler — never blocks UI.
 */
export const updateUserPreferences = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("userEvents")
      .withIndex("userId_createdAt", (q) =>
        q.eq("userId", args.userId).gte("createdAt", ninetyDaysAgo)
      )
      .take(5000);

    if (events.length === 0) return;

    // Aggregate category weights
    const categoryWeights: Record<string, number> = {};
    const serviceCategoryWeights: Record<string, number> = {};
    const prices: number[] = [];
    const searches: string[] = [];
    const viewedProducts: string[] = [];
    const viewedReels: string[] = [];
    const viewedServices: string[] = [];
    let productViews = 0;
    let reelViews = 0;
    let serviceViews = 0;
    let purchases = 0;

    for (const event of events) {
      const weight = SIGNAL_WEIGHTS[event.eventType] ?? 1.0;

      // Boost weight for product views with dwell time >10s
      const effectiveWeight =
        event.eventType === "product_view" &&
        event.durationMs &&
        event.durationMs > 10000
          ? 2.0
          : weight;

      // Boost reel_watch if >50% watched
      const reelWeight =
        event.eventType === "reel_watch" &&
        event.durationMs &&
        event.durationMs > 0
          ? weight
          : event.eventType === "reel_watch"
            ? 0.5
            : effectiveWeight;

      const finalWeight =
        event.eventType === "reel_watch" ? reelWeight : effectiveWeight;

      // Category weights
      if (event.category) {
        if (
          event.eventType === "service_view" ||
          event.eventType === "service_request"
        ) {
          serviceCategoryWeights[event.category] =
            (serviceCategoryWeights[event.category] ?? 0) + finalWeight;
        } else {
          categoryWeights[event.category] =
            (categoryWeights[event.category] ?? 0) + finalWeight;
        }
      }

      // Price tracking
      if (event.pricePoint && event.pricePoint > 0) {
        prices.push(event.pricePoint);
      }

      // Search terms
      if (event.eventType === "search_query" && event.searchQuery) {
        searches.push(event.searchQuery);
      }

      // Recently viewed tracking
      if (event.targetProductId) {
        const idStr = event.targetProductId as string;
        if (!viewedProducts.includes(idStr)) viewedProducts.push(idStr);
      }
      if (event.targetReelId) {
        const idStr = event.targetReelId as string;
        if (!viewedReels.includes(idStr)) viewedReels.push(idStr);
      }
      if (event.targetServiceId) {
        const idStr = event.targetServiceId as string;
        if (!viewedServices.includes(idStr)) viewedServices.push(idStr);
      }

      // Counters
      if (event.eventType === "product_view") productViews++;
      if (
        event.eventType === "reel_view" ||
        event.eventType === "reel_watch"
      )
        reelViews++;
      if (event.eventType === "service_view") serviceViews++;
      if (event.eventType === "purchase") purchases++;
    }

    // Compute top 3 categories
    const sortedCategories = Object.entries(categoryWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Compute price range
    const sortedPrices = prices.sort((a, b) => a - b);
    const avgPrice =
      prices.length > 0
        ? prices.reduce((s, p) => s + p, 0) / prices.length
        : undefined;
    const priceLow = sortedPrices.length > 0 ? sortedPrices[0] : undefined;
    const priceHigh =
      sortedPrices.length > 0
        ? sortedPrices[sortedPrices.length - 1]
        : undefined;

    // Build preferences doc
    const prefs = {
      userId: args.userId,
      categoryWeights,
      serviceCategoryWeights:
        Object.keys(serviceCategoryWeights).length > 0
          ? serviceCategoryWeights
          : undefined,
      avgPricePoint: avgPrice,
      priceRangeLow: priceLow,
      priceRangeHigh: priceHigh,
      favoriteCategories:
        sortedCategories.length > 0 ? sortedCategories : undefined,
      recentSearchTerms:
        searches.length > 0
          ? searches.slice(-10)
          : undefined,
      totalProductViews: productViews,
      totalReelViews: reelViews,
      totalServiceViews: serviceViews,
      totalPurchases: purchases,
      recentlyViewedProductIds:
        viewedProducts.length > 0
          ? viewedProducts.slice(-50)
          : undefined,
      recentlyViewedReelIds:
        viewedReels.length > 0 ? viewedReels.slice(-30) : undefined,
      recentlyViewedServiceIds:
        viewedServices.length > 0
          ? viewedServices.slice(-20)
          : undefined,
      updatedAt: Date.now(),
    };

    // Upsert
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, prefs);
    } else {
      await ctx.db.insert("userPreferences", prefs);
    }
  },
});

/**
 * Recompute content popularity scores from recent events.
 * Called by cron every 15 minutes.
 */
export const computePopularity = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get recent events (last 7 days)
    const recentEvents = await ctx.db
      .query("userEvents")
      .withIndex("createdAt", (q) => q.gte("createdAt", sevenDaysAgo))
      .take(10000);

    // Aggregate per content item
    const contentStats: Record<
      string,
      {
        contentType: "product" | "reel" | "service";
        views24h: number;
        views7d: number;
        engagements: number;
        engagementWeighted: number;
      }
    > = {};

    for (const event of recentEvents) {
      let contentId: string | undefined;
      let contentType: "product" | "reel" | "service" | undefined;

      if (event.targetProductId) {
        contentId = event.targetProductId as string;
        contentType = "product";
      } else if (event.targetReelId) {
        contentId = event.targetReelId as string;
        contentType = "reel";
      } else if (event.targetServiceId) {
        contentId = event.targetServiceId as string;
        contentType = "service";
      }

      if (!contentId || !contentType) continue;

      if (!contentStats[contentId]) {
        contentStats[contentId] = {
          contentType,
          views24h: 0,
          views7d: 0,
          engagements: 0,
          engagementWeighted: 0,
        };
      }

      const stats = contentStats[contentId];
      const isView =
        event.eventType === "product_view" ||
        event.eventType === "reel_view" ||
        event.eventType === "service_view";

      if (isView) {
        stats.views7d++;
        if (event.createdAt >= twentyFourHoursAgo) stats.views24h++;
      }

      // Engagement scoring
      const engWeight = SIGNAL_WEIGHTS[event.eventType] ?? 1.0;
      stats.engagements++;
      stats.engagementWeighted += engWeight;
    }

    // Upsert popularity records
    for (const [contentId, stats] of Object.entries(contentStats)) {
      // Trending = (24h views × 3) + (7d engagement weighted) + recency bonus
      const trendingScore =
        stats.views24h * 3 + stats.engagementWeighted;
      const engagementScore = stats.engagementWeighted;

      const existing = await ctx.db
        .query("contentPopularity")
        .withIndex("contentId", (q) => q.eq("contentId", contentId))
        .first();

      const doc = {
        contentType: stats.contentType,
        contentId,
        viewCount24h: stats.views24h,
        viewCount7d: stats.views7d,
        engagementScore,
        trendingScore,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("contentPopularity", doc);
      }
    }

    // Clean stale popularity records (no events in 7 days)
    const allPopularity = await ctx.db
      .query("contentPopularity")
      .take(2000);

    for (const pop of allPopularity) {
      if (!contentStats[pop.contentId]) {
        // No recent events — decay the score
        if (pop.trendingScore <= 0.1) {
          await ctx.db.delete(pop._id);
        } else {
          await ctx.db.patch(pop._id, {
            trendingScore: pop.trendingScore * 0.5,
            viewCount24h: 0,
            updatedAt: now,
          });
        }
      }
    }
  },
});

/**
 * Delete events older than 90 days. Batches of 500.
 * Called by daily cron.
 */
export const pruneOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const oldEvents = await ctx.db
      .query("userEvents")
      .withIndex("createdAt", (q) => q.lt("createdAt", ninetyDaysAgo))
      .take(500);

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    // If there are more to prune, schedule another batch
    if (oldEvents.length === 500) {
      await ctx.scheduler.runAfter(
        100,
        internal.tracking.pruneOldEvents,
        {}
      );
    }
  },
});

/**
 * Re-aggregate preferences for users whose profiles are stale (>6 hours).
 * Called by hourly cron.
 */
export const refreshStalePreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

    const staleProfiles = await ctx.db
      .query("userPreferences")
      .filter((q) => q.lt(q.field("updatedAt"), sixHoursAgo))
      .take(50);

    for (const profile of staleProfiles) {
      await ctx.scheduler.runAfter(
        0,
        internal.tracking.updateUserPreferences,
        { userId: profile.userId }
      );
    }
  },
});
