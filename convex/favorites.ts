import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(200);

    return favorites.map((f) => f.productId);
  },
});

export const listWithProducts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(200);

    const products = await Promise.all(
      favorites.map(async (f) => {
        const product = await ctx.db.get(f.productId);
        return product && product.isActive ? product : null;
      })
    );

    return products.filter((p) => p !== null);
  },
});

export const isFavorite = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    return existing !== null;
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      productId: args.productId,
    });
    return true;
  },
});
