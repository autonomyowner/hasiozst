import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

// ==================== B2C CART ====================

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    // Filter to B2C items only
    const b2cItems = cartItems.filter((item) => !item.isWholesale && item.productId);

    const results = await Promise.all(
      b2cItems.map(async (item) => {
        const product = await ctx.db.get(item.productId!);
        if (!product) return null;
        return {
          _id: item._id,
          productId: item.productId!,
          quantity: item.quantity,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        };
      })
    );

    return results.filter((item) => item !== null);
  },
});

export const getTotal = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    // B2C total only
    let total = 0;
    for (const item of cartItems) {
      if (item.isWholesale || !item.productId) continue;
      const product = await ctx.db.get(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    }

    return total;
  },
});

export const getItemCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    // B2C count only
    return cartItems
      .filter((item) => !item.isWholesale && item.productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },
});

// Consolidated B2C cart summary — single query replaces get + getTotal + getItemCount
export const getCartSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    const b2cItems = cartItems.filter((item) => !item.isWholesale && item.productId);

    let total = 0;
    let itemCount = 0;
    const items = await Promise.all(
      b2cItems.map(async (item) => {
        const product = await ctx.db.get(item.productId!);
        if (!product) return null;
        total += product.price * item.quantity;
        itemCount += item.quantity;
        const seller = await ctx.db.get(product.sellerId);
        return {
          _id: item._id,
          productId: item.productId!,
          quantity: item.quantity,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            sellerName: seller?.name ?? seller?.email ?? "Seller",
            sellerCity: "",
          },
        };
      })
    );

    return {
      items: items.filter((item) => item !== null),
      total,
      itemCount,
    };
  },
});

export const addItem = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (!product.isActive) throw new Error("This product is no longer available");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    const currentQty = existing?.quantity ?? 0;
    const nextQty = currentQty + 1;

    if (product.stockQuantity !== undefined && nextQty > product.stockQuantity) {
      throw new Error(
        `Only ${product.stockQuantity} in stock${currentQty > 0 ? ` (${currentQty} already in cart)` : ""}`
      );
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: Math.min(nextQty, 999),
      });
      return existing._id;
    }

    return await ctx.db.insert("cartItems", {
      userId: user._id,
      productId: args.productId,
      quantity: 1,
    });
  },
});

export const removeItem = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const updateQuantity = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (!existing) return;

    if (args.quantity <= 0) {
      await ctx.db.delete(existing._id);
      return;
    }

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const requested = Math.min(Math.floor(args.quantity), 999);

    if (product.stockQuantity !== undefined && requested > product.stockQuantity) {
      throw new Error(`Only ${product.stockQuantity} in stock`);
    }

    await ctx.db.patch(existing._id, { quantity: requested });
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    // Only clear B2C items
    const b2cItems = cartItems.filter((item) => !item.isWholesale);
    await Promise.all(b2cItems.map((item) => ctx.db.delete(item._id)));
  },
});

// ==================== WHOLESALE CART ====================

export const getWholesaleItems = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    const wholesaleItems = cartItems.filter(
      (item) => item.isWholesale && item.wholesaleProductId
    );

    const results = await Promise.all(
      wholesaleItems.map(async (item) => {
        const product = await ctx.db.get(item.wholesaleProductId!);
        if (!product) return null;
        return {
          _id: item._id,
          wholesaleProductId: item.wholesaleProductId!,
          quantity: item.quantity,
          product: {
            _id: product._id,
            name: product.name,
            pricePerUnit: product.pricePerUnit,
            minOrder: product.minOrder,
            imageUrl: product.imageUrl,
            supplierName: product.supplierName,
            supplierId: product.supplierId,
          },
        };
      })
    );

    return results.filter((item) => item !== null);
  },
});

export const getWholesaleTotal = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    let total = 0;
    for (const item of cartItems) {
      if (!item.isWholesale || !item.wholesaleProductId) continue;
      const product = await ctx.db.get(item.wholesaleProductId);
      if (product) {
        total += product.pricePerUnit * item.quantity;
      }
    }

    return total;
  },
});

export const getWholesaleItemCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    return cartItems
      .filter((item) => item.isWholesale && item.wholesaleProductId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },
});

// Consolidated wholesale cart summary — single query replaces getWholesaleItems + getWholesaleTotal + getWholesaleItemCount
export const getWholesaleCartSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    const wholesaleItems = cartItems.filter(
      (item) => item.isWholesale && item.wholesaleProductId
    );

    let total = 0;
    let itemCount = 0;
    const items = await Promise.all(
      wholesaleItems.map(async (item) => {
        const product = await ctx.db.get(item.wholesaleProductId!);
        if (!product) return null;
        total += product.pricePerUnit * item.quantity;
        itemCount += item.quantity;
        return {
          _id: item._id,
          wholesaleProductId: item.wholesaleProductId!,
          quantity: item.quantity,
          product: {
            _id: product._id,
            name: product.name,
            pricePerUnit: product.pricePerUnit,
            minOrder: product.minOrder,
            imageUrl: product.imageUrl,
            supplierName: product.supplierName,
            supplierId: product.supplierId,
          },
        };
      })
    );

    return {
      items: items.filter((item) => item !== null),
      total,
      itemCount,
    };
  },
});

export const addWholesaleItem = mutation({
  args: {
    wholesaleProductId: v.id("wholesaleProducts"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (
      user.role !== "seller" ||
      !user.sellerType ||
      (user.sellerType !== "grossiste" &&
        user.sellerType !== "importateur" &&
        user.sellerType !== "fournisseur")
    ) {
      throw new Error("Only B2B sellers can add wholesale items to cart");
    }

    const product = await ctx.db.get(args.wholesaleProductId);
    if (!product) throw new Error("Product not found");

    if (args.quantity < product.minOrder) {
      throw new Error(`Minimum order quantity is ${product.minOrder}`);
    }

    // Check if item already in wholesale cart using compound index
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("userId_wholesaleProductId", (q) =>
        q.eq("userId", user._id).eq("wholesaleProductId", args.wholesaleProductId)
      )
      .first();

    const cappedQuantity = Math.min(args.quantity, 99999);

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: cappedQuantity });
      return existing._id;
    }

    return await ctx.db.insert("cartItems", {
      userId: user._id,
      wholesaleProductId: args.wholesaleProductId,
      isWholesale: true,
      quantity: cappedQuantity,
    });
  },
});

export const removeWholesaleItem = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.cartItemId);
    if (!item || item.userId !== user._id) throw new Error("Not found");

    await ctx.db.delete(args.cartItemId);
  },
});

export const clearWholesale = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .take(500);

    const wholesaleItems = cartItems.filter((item) => item.isWholesale);
    await Promise.all(wholesaleItems.map((item) => ctx.db.delete(item._id)));
  },
});
