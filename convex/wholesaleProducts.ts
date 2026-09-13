import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {
    location: v.optional(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only B2B sellers can see wholesale products (fournisseur, importateur, grossiste)
    if (user.role !== "seller" || !user.sellerType) return [];
    if (!["fournisseur", "importateur", "grossiste"].includes(user.sellerType)) return [];

    if (args.productType) {
      return await ctx.db
        .query("wholesaleProducts")
        .withIndex("productType", (q) => q.eq("productType", args.productType!))
        .take(100);
    }
    if (args.location && args.location !== "All") {
      return await ctx.db
        .query("wholesaleProducts")
        .withIndex("supplierLocation", (q) =>
          q.eq("supplierLocation", args.location!)
        )
        .take(100);
    }
    return await ctx.db.query("wholesaleProducts").take(100);
  },
});

export const getById = query({
  args: { id: v.id("wholesaleProducts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    // Only B2B sellers can view wholesale products
    if (user.role !== "seller" || !user.sellerType) return null;
    if (!["fournisseur", "importateur", "grossiste"].includes(user.sellerType)) return null;

    return await ctx.db.get(args.id);
  },
});

export const listBySupplier = query({
  args: { supplierId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only B2B sellers can see wholesale products
    if (user.role !== "seller" || !user.sellerType) return [];
    if (!["fournisseur", "importateur", "grossiste"].includes(user.sellerType)) return [];

    const targetId = args.supplierId ?? user._id;
    return await ctx.db
      .query("wholesaleProducts")
      .withIndex("supplierId", (q) => q.eq("supplierId", targetId))
      .take(200);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    pricePerUnit: v.number(),
    minOrder: v.number(),
    imageUrl: v.string(),
    images: v.optional(v.array(v.string())),
    supplierLocation: v.string(),
    rating: v.optional(v.number()),
    hasVideo: v.optional(v.boolean()),
    videoUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Only grossistes can create wholesale products
    if (user.role !== "seller" || user.sellerType !== "grossiste") {
      throw new Error("Only grossistes can create wholesale products");
    }

    return await ctx.db.insert("wholesaleProducts", {
      name: args.name,
      description: args.description,
      category: args.category,
      pricePerUnit: args.pricePerUnit,
      minOrder: args.minOrder,
      imageUrl: args.imageUrl,
      images: args.images,
      supplierId: user._id,
      supplierName: user.name,
      supplierAvatar: user.avatar,
      supplierLocation: args.supplierLocation,
      supplierRating: args.rating ?? 0,
      supplierSellerType: "grossiste",
      rating: args.rating ?? 0,
      hasVideo: args.videoUrl ? true : args.hasVideo,
      videoUrl: args.videoUrl,
      tags: args.tags,
      productType: args.productType,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("wholesaleProducts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    pricePerUnit: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    supplierLocation: v.optional(v.string()),
    supplierRating: v.optional(v.number()),
    rating: v.optional(v.number()),
    hasVideo: v.optional(v.boolean()),
    videoUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Not found");
    if (product.supplierId !== user._id) throw new Error("Not authorized");

    const { id, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("wholesaleProducts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Not found");
    if (product.supplierId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
