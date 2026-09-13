import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.category && args.category !== "all") {
      return await ctx.db
        .query("products")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(limit);
    }
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    const seller = await ctx.db.get(product.sellerId);
    return {
      ...product,
      supplierAvatar: seller?.avatar,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(50);
  },
});

export const freshPicks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("isActive_isNew", (q) => q.eq("isActive", true).eq("isNew", true))
      .take(20);
  },
});

export const supplierSpecials = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.gte(q.field("rating"), 4.6))
      .take(20);
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category && args.category !== "all") {
      return await ctx.db
        .query("products")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .paginate(args.paginationOpts);
  },
});

// Combined product + similar products in one query (avoids waterfall)
export const getWithSimilar = query({
  args: { id: v.id("products"), similarLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    const seller = await ctx.db.get(product.sellerId);

    const limit = args.similarLimit ?? 8;
    // Fetch similar by same category first
    let similar = product.category
      ? await ctx.db
          .query("products")
          .withIndex("category", (q) => q.eq("category", product.category!))
          .filter((q) =>
            q.and(
              q.eq(q.field("isActive"), true),
              q.neq(q.field("_id"), args.id)
            )
          )
          .take(limit)
      : [];

    // Fill remaining with other active products if not enough
    if (similar.length < limit) {
      const remaining = limit - similar.length;
      const existingIds = new Set([args.id, ...similar.map((p) => p._id)]);
      const more = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("isActive"), true))
        .take(remaining + existingIds.size);
      for (const p of more) {
        if (!existingIds.has(p._id) && similar.length < limit) {
          similar.push(p);
        }
      }
    }

    return {
      product: { ...product, supplierAvatar: seller?.avatar },
      similar,
    };
  },
});

export const listBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("products")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(200);
  },
});

export const countBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const products = await ctx.db
      .query("products")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(1000);

    return products.length;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
    brand: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    seller: v.optional(v.string()),
    description: v.optional(v.string()),
    tagline: v.optional(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    expirationDate: v.optional(v.string()),
    storageCondition: v.optional(v.string()),
    specs: v.optional(
      v.object({
        power: v.optional(v.string()),
        capacity: v.optional(v.string()),
        warranty: v.optional(v.string()),
        material: v.optional(v.string()),
      })
    ),
    badge: v.optional(v.string()),
    supplierLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller") throw new Error("Only sellers can create products");
    if (user.sellerType === "grossiste") {
      throw new Error(
        "Grossistes must publish via wholesaleProducts.create, not products.create"
      );
    }

    if (args.price <= 0 || args.price > 100_000_000) {
      throw new Error("Price must be between 1 and 100,000,000");
    }
    if (args.name.length > 200) {
      throw new Error("Product name too long");
    }
    if (args.description && args.description.length > 5000) {
      throw new Error("Description too long (max 5000 characters)");
    }
    if (args.stockQuantity !== undefined) {
      if (
        !Number.isInteger(args.stockQuantity) ||
        args.stockQuantity < 0 ||
        args.stockQuantity > 1_000_000
      ) {
        throw new Error("Stock must be a whole number between 0 and 1,000,000");
      }
    }

    const productId = await ctx.db.insert("products", {
      ...args,
      seller: args.seller ?? user.name,
      sellerId: user._id,
      isActive: args.stockQuantity === 0 ? false : true,
    });

    // Auto-create a reel when the product has a video
    if (args.videoUrl) {
      const effectiveRole: "customer" | "fournisseur" | "importateur" | "grossiste" | "freelancer" =
        user.role === "seller"
          ? (user.sellerType ?? "fournisseur")
          : user.role === "freelancer"
            ? "freelancer"
            : "customer";

      await ctx.db.insert("reels", {
        videoUrl: args.videoUrl,
        thumbnailUrl: args.imageUrl,
        posterId: user._id,
        posterName: user.name,
        posterRole: effectiveRole,
        posterAvatar: user.avatar,
        productId,
        productName: args.name,
        price: args.price,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: Date.now(),
      });
    }

    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    seller: v.optional(v.string()),
    description: v.optional(v.string()),
    tagline: v.optional(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    expirationDate: v.optional(v.string()),
    storageCondition: v.optional(v.string()),
    specs: v.optional(
      v.object({
        power: v.optional(v.string()),
        capacity: v.optional(v.string()),
        warranty: v.optional(v.string()),
        material: v.optional(v.string()),
      })
    ),
    badge: v.optional(v.string()),
    supplierLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== user._id) throw new Error("Not authorized");

    if (args.price !== undefined && (args.price <= 0 || args.price > 100_000_000)) {
      throw new Error("Price must be between 1 and 100,000,000");
    }
    if (args.name !== undefined && args.name.length > 200) {
      throw new Error("Product name too long");
    }
    if (args.description !== undefined && args.description.length > 5000) {
      throw new Error("Description too long (max 5000 characters)");
    }
    if (args.stockQuantity !== undefined) {
      if (
        !Number.isInteger(args.stockQuantity) ||
        args.stockQuantity < 0 ||
        args.stockQuantity > 1_000_000
      ) {
        throw new Error("Stock must be a whole number between 0 and 1,000,000");
      }
    }

    const { id, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }

    // Auto-deactivate when seller manually sets stock to 0
    if (args.stockQuantity === 0) {
      patch.isActive = false;
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { isActive: false });

    // Auto-expire any active promotion on this product
    const activePromo = await ctx.db
      .query("promotions")
      .withIndex("productId", (q) => q.eq("productId", args.id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (activePromo) {
      await ctx.db.patch(activePromo._id, { status: "expired" });
    }

    return args.id;
  },
});

export const reactivate = mutation({
  args: {
    id: v.id("products"),
    stockQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.stockQuantity <= 0) throw new Error("Stock quantity must be greater than 0");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      isActive: true,
      stockQuantity: args.stockQuantity,
    });
    return args.id;
  },
});

export const permanentDelete = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== user._id) throw new Error("Not authorized");
    if (product.isActive) throw new Error("Cannot permanently delete an active product. Deactivate it first.");

    // Delete associated reels + their likes/comments
    const reels = await ctx.db
      .query("reels")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .take(500);
    for (const reel of reels) {
      const likes = await ctx.db
        .query("reelLikes")
        .withIndex("reelId", (q) => q.eq("reelId", reel._id))
        .take(500);
      for (const like of likes) await ctx.db.delete(like._id);

      const comments = await ctx.db
        .query("reelComments")
        .withIndex("reelId", (q) => q.eq("reelId", reel._id))
        .take(500);
      for (const comment of comments) await ctx.db.delete(comment._id);

      await ctx.db.delete(reel._id);
    }

    // Delete associated favorites
    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .take(500);
    for (const fav of favorites) await ctx.db.delete(fav._id);

    // Delete associated cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .take(500);
    for (const item of cartItems) await ctx.db.delete(item._id);

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const listInactiveBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("products")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .filter((q) => q.eq(q.field("isActive"), false))
      .take(200);
  },
});
