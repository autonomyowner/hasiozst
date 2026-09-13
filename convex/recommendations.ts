import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";
import { Doc } from "./_generated/dataModel";

// --- Scoring Helpers ---

function categoryAffinity(
  category: string | undefined,
  weights: Record<string, number>
): number {
  if (!category || !weights || Object.keys(weights).length === 0) return 0;
  const maxWeight = Math.max(...Object.values(weights), 1);
  return (weights[category] ?? 0) / maxWeight;
}

function priceAffinity(
  price: number,
  avgPrice: number | undefined,
  priceLow: number | undefined,
  priceHigh: number | undefined
): number {
  if (!avgPrice) return 0.5; // Neutral for users with no price history
  if (priceLow !== undefined && priceHigh !== undefined && priceHigh > priceLow) {
    // In range = 1.0, distance from range decays
    if (price >= priceLow && price <= priceHigh) return 1.0;
    const range = priceHigh - priceLow;
    const distance =
      price < priceLow ? priceLow - price : price - priceHigh;
    return Math.max(0, 1 - distance / range);
  }
  // Fallback: distance from average
  const diff = Math.abs(price - avgPrice);
  return Math.max(0, 1 - diff / avgPrice);
}

function freshnessBonus(createdAt: number): number {
  const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  if (ageHours < 6) return 1.0;
  if (ageHours < 24) return 0.8;
  if (ageHours < 72) return 0.6;
  if (ageHours < 168) return 0.4; // 7 days
  return 0.2;
}

function notSeenBonus(
  contentId: string,
  recentlyViewed: string[] | undefined
): number {
  if (!recentlyViewed || recentlyViewed.length === 0) return 1.0;
  return recentlyViewed.includes(contentId) ? 0 : 1.0;
}

// --- Cold Start Strategy ---
type UserTier = "guest" | "new" | "warm" | "active";

function getUserTier(
  prefs: Doc<"userPreferences"> | null
): UserTier {
  if (!prefs) return "guest";
  const total =
    (prefs.totalProductViews ?? 0) +
    (prefs.totalReelViews ?? 0) +
    (prefs.totalServiceViews ?? 0) +
    (prefs.totalPurchases ?? 0);
  if (total < 5) return "new";
  if (total < 20) return "warm";
  return "active";
}

// --- Product Scoring ---

function scoreProduct(
  product: Doc<"products">,
  prefs: Doc<"userPreferences"> | null,
  popularityMap: Map<string, Doc<"contentPopularity">>,
  tier: UserTier
): number {
  if (tier === "guest") {
    // Guests: trending + freshness only
    const pop = popularityMap.get(product._id as string);
    const popScore = pop ? Math.min(pop.trendingScore / 50, 1.0) : 0;
    return popScore * 0.5 + freshnessBonus(product._creationTime) * 0.3 + (product.rating ?? 0) / 5 * 0.2;
  }

  const catAff = categoryAffinity(
    product.category,
    (prefs?.categoryWeights as Record<string, number>) ?? {}
  );
  const priceAff = priceAffinity(
    product.price,
    prefs?.avgPricePoint,
    prefs?.priceRangeLow,
    prefs?.priceRangeHigh
  );
  const fresh = freshnessBonus(product._creationTime);
  const pop = popularityMap.get(product._id as string);
  const popScore = pop ? Math.min(pop.trendingScore / 50, 1.0) : 0;
  const quality = (product.rating ?? 3) / 5;
  const notSeen = notSeenBonus(
    product._id as string,
    prefs?.recentlyViewedProductIds
  );

  // Adjust weights by tier
  if (tier === "new") {
    // 70% trending, 30% personalization
    return (
      catAff * 0.1 +
      priceAff * 0.05 +
      fresh * 0.15 +
      popScore * 0.5 +
      quality * 0.15 +
      notSeen * 0.05
    );
  }

  // Warm + Active: full personalization
  return (
    catAff * 0.35 +
    priceAff * 0.15 +
    fresh * 0.15 +
    popScore * 0.2 +
    quality * 0.1 +
    notSeen * 0.05
  );
}

// --- Reel Scoring ---

function scoreReel(
  reel: Doc<"reels">,
  prefs: Doc<"userPreferences"> | null,
  popularityMap: Map<string, Doc<"contentPopularity">>,
  tier: UserTier
): number {
  const pop = popularityMap.get(reel._id as string);
  const popScore = pop ? Math.min(pop.trendingScore / 50, 1.0) : 0;
  const engVelocity = pop ? Math.min(pop.engagementScore / 30, 1.0) : 0;
  const fresh = freshnessBonus(reel.createdAt);

  if (tier === "guest") {
    return popScore * 0.4 + engVelocity * 0.3 + fresh * 0.3;
  }

  // Viral score: likes + comments + shares normalized
  const totalEngagement = reel.likes + reel.comments + reel.shares;
  const viralScore = Math.min(totalEngagement / 100, 1.0);

  const notSeen = notSeenBonus(
    reel._id as string,
    prefs?.recentlyViewedReelIds
  );

  if (tier === "new") {
    return (
      engVelocity * 0.3 +
      popScore * 0.3 +
      fresh * 0.2 +
      viralScore * 0.15 +
      notSeen * 0.05
    );
  }

  // Check if user has affinity for this reel's product category
  const catAff = reel.productId
    ? 0.5 // Boost reels that have products (more relevant)
    : 0;

  return (
    catAff * 0.15 +
    engVelocity * 0.25 +
    fresh * 0.2 +
    popScore * 0.15 +
    viralScore * 0.15 +
    notSeen * 0.1
  );
}

// --- Service Scoring ---

function scoreService(
  service: Doc<"freelanceServices">,
  prefs: Doc<"userPreferences"> | null,
  popularityMap: Map<string, Doc<"contentPopularity">>,
  tier: UserTier
): number {
  const pop = popularityMap.get(service._id as string);
  const popScore = pop ? Math.min(pop.trendingScore / 50, 1.0) : 0;
  const quality = service.rating / 5;
  const completedScore = Math.min(service.completedJobs / 50, 1.0);

  if (tier === "guest") {
    return quality * 0.4 + popScore * 0.3 + completedScore * 0.3;
  }

  const catAff = categoryAffinity(
    service.category,
    (prefs?.serviceCategoryWeights as Record<string, number>) ?? {}
  );

  const priceAff = priceAffinity(
    service.price,
    prefs?.avgPricePoint,
    prefs?.priceRangeLow,
    prefs?.priceRangeHigh
  );

  const notSeen = notSeenBonus(
    service._id as string,
    prefs?.recentlyViewedServiceIds
  );

  if (tier === "new") {
    return (
      catAff * 0.1 +
      quality * 0.3 +
      popScore * 0.3 +
      completedScore * 0.2 +
      notSeen * 0.1
    );
  }

  return (
    catAff * 0.3 +
    quality * 0.25 +
    priceAff * 0.15 +
    popScore * 0.2 +
    completedScore * 0.1
  );
}

// --- Public Queries ---

/**
 * Personalized product feed. Falls back to trending for guests.
 */
export const forYouProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    const user = await getAuthenticatedAppUser(ctx);

    // Load user preferences
    let prefs: Doc<"userPreferences"> | null = null;
    if (user) {
      prefs = await ctx.db
        .query("userPreferences")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .first();
    }

    const tier = getUserTier(prefs);

    // Load candidate products
    const candidates = await ctx.db
      .query("products")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .take(200);

    // Load popularity data
    const pops = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "product")
      )
      .order("desc")
      .take(200);

    const popularityMap = new Map<string, Doc<"contentPopularity">>();
    for (const p of pops) popularityMap.set(p.contentId, p);

    // Fetch active promoted product IDs for score boosting
    const activePromos = await ctx.db
      .query("promotions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .take(200);
    const promotedIds = new Set(
      activePromos
        .filter((p) => p.productId && (!p.expiresAt || p.expiresAt > Date.now()))
        .map((p) => p.productId as string)
    );

    // Score and sort (promoted products get 1.4x boost)
    const scored = candidates.map((product) => {
      let score = scoreProduct(product, prefs, popularityMap, tier);
      if (promotedIds.has(product._id as string)) score *= 1.4;
      return { product, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Add diversity: don't show too many from same category in a row
    const result: Doc<"products">[] = [];
    const categoryCounts: Record<string, number> = {};
    const maxPerCategory = Math.max(3, Math.ceil(limit / 5));

    for (const { product } of scored) {
      if (result.length >= limit) break;
      const cat = product.category;
      if ((categoryCounts[cat] ?? 0) < maxPerCategory) {
        result.push(product);
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
      }
    }

    // Fill remaining if diversity filtering removed too many
    if (result.length < limit) {
      for (const { product } of scored) {
        if (result.length >= limit) break;
        if (!result.includes(product)) {
          result.push(product);
        }
      }
    }

    return result;
  },
});

/**
 * Personalized reel feed.
 */
export const forYouReels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const user = await getAuthenticatedAppUser(ctx);

    let prefs: Doc<"userPreferences"> | null = null;
    if (user) {
      prefs = await ctx.db
        .query("userPreferences")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .first();
    }

    const tier = getUserTier(prefs);

    const candidates = await ctx.db
      .query("reels")
      .order("desc")
      .take(100);

    const pops = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "reel")
      )
      .order("desc")
      .take(100);

    const popularityMap = new Map<string, Doc<"contentPopularity">>();
    for (const p of pops) popularityMap.set(p.contentId, p);

    const scored = candidates.map((reel) => ({
      reel,
      score: scoreReel(reel, prefs, popularityMap, tier),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.reel);
  },
});

/**
 * Personalized service feed.
 */
export const forYouServices = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const user = await getAuthenticatedAppUser(ctx);

    let prefs: Doc<"userPreferences"> | null = null;
    if (user) {
      prefs = await ctx.db
        .query("userPreferences")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .first();
    }

    const tier = getUserTier(prefs);

    const candidates = await ctx.db
      .query("freelanceServices")
      .take(100);

    const pops = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "service")
      )
      .order("desc")
      .take(100);

    const popularityMap = new Map<string, Doc<"contentPopularity">>();
    for (const p of pops) popularityMap.set(p.contentId, p);

    const scored = candidates.map((service) => ({
      service,
      score: scoreService(service, prefs, popularityMap, tier),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.service);
  },
});

/**
 * Global trending products (fallback for guest/cold start).
 */
export const trendingProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const trending = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "product")
      )
      .order("desc")
      .take(limit);

    const products: Doc<"products">[] = [];
    for (const t of trending) {
      try {
        const product = await ctx.db.get(t.contentId as any);
        if (product && (product as Doc<"products">).isActive) {
          products.push(product as Doc<"products">);
        }
      } catch {
        // Invalid ID — skip
      }
    }

    return products;
  },
});

/**
 * Global trending reels.
 */
export const trendingReels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const trending = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "reel")
      )
      .order("desc")
      .take(limit);

    const reels: Doc<"reels">[] = [];
    for (const t of trending) {
      try {
        const reel = await ctx.db.get(t.contentId as any);
        if (reel) reels.push(reel as Doc<"reels">);
      } catch {
        // Invalid ID — skip
      }
    }

    return reels;
  },
});

/**
 * Global trending services.
 */
export const trendingServices = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const trending = await ctx.db
      .query("contentPopularity")
      .withIndex("contentType_trendingScore", (q) =>
        q.eq("contentType", "service")
      )
      .order("desc")
      .take(limit);

    const services: Doc<"freelanceServices">[] = [];
    for (const t of trending) {
      try {
        const service = await ctx.db.get(t.contentId as any);
        if (service) services.push(service as Doc<"freelanceServices">);
      } catch {
        // Invalid ID — skip
      }
    }

    return services;
  },
});
