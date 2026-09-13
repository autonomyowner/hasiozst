import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only importateur and grossiste can see demand requests
    if (user.role !== "seller" || !user.sellerType) return [];
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return [];

    return await ctx.db
      .query("demandRequests")
      .order("desc")
      .take(50);
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only importateur and grossiste can see demand requests
    if (user.role !== "seller" || !user.sellerType) return [];
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return [];

    return await ctx.db
      .query("demandRequests")
      .withIndex("status", (q) => q.eq("status", args.status))
      .take(50);
  },
});

export const getById = query({
  args: { id: v.id("demandRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    // Only importateur and grossiste can view demand requests
    if (user.role !== "seller" || !user.sellerType) return null;
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return null;

    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    budget: v.number(),
    deadline: v.string(),
    category: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Only importateur and grossiste can create demand requests
    if (user.role !== "seller" || !user.sellerType) {
      throw new Error("Only importateurs and grossistes can create demand requests");
    }
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste") {
      throw new Error("Only importateurs and grossistes can create demand requests");
    }

    if (args.title.length > 200) {
      throw new Error("Title too long (max 200 characters)");
    }
    if (args.description && args.description.length > 2000) {
      throw new Error("Description too long (max 2000 characters)");
    }
    if (args.budget <= 0 || args.budget > 100000000) {
      throw new Error("Budget must be between 1 and 100,000,000");
    }
    if (args.phone && !/^0[5-7][0-9]{8}$/.test(args.phone)) {
      throw new Error("رقم الهاتف غير صالح");
    }

    return await ctx.db.insert("demandRequests", {
      title: args.title,
      description: args.description,
      buyerName: user.name,
      userId: user._id,
      phone: args.phone,
      budget: args.budget,
      deadline: args.deadline,
      category: args.category,
      creatorSellerType: user.sellerType as "importateur" | "grossiste",
      responseCount: 0,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("demandRequests"),
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const demand = await ctx.db.get(args.id);
    if (!demand) throw new Error("Demand request not found");
    // Prefer userId check; fall back to buyerName for legacy records
    const isOwner = demand.userId
      ? demand.userId === user._id
      : demand.buyerName === user.name;
    if (!isOwner) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { status: args.status });
  },
});
