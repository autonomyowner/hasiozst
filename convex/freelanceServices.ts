import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const list = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("freelanceServices")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .take(100);
    }
    return await ctx.db.query("freelanceServices").take(100);
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("freelanceServices")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("freelanceServices").paginate(args.paginationOpts);
  },
});

export const search = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("freelanceServices")
      .withSearchIndex("search_title", (q) => q.search("title", args.searchQuery))
      .take(50);
  },
});

export const getById = query({
  args: { id: v.id("freelanceServices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByFreelancer = query({
  args: { freelancerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("freelanceServices")
      .withIndex("freelancerId", (q) =>
        q.eq("freelancerId", args.freelancerId)
      )
      .take(100);
  },
});

export const getFreelancerStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) {
      return {
        activeServices: 0,
        totalRevenue: 0,
        completedProjects: 0,
        ongoingProjects: 0,
        pendingRequests: 0,
        revenueThisMonth: 0,
        completedThisMonth: 0,
        servicesThisMonth: 0,
      };
    }

    // Active services
    const services = await ctx.db
      .query("freelanceServices")
      .withIndex("freelancerId", (q) => q.eq("freelancerId", user._id))
      .take(100);

    // All client requests for this freelancer
    const allRequests = await ctx.db
      .query("clientRequests")
      .withIndex("freelancerId", (q) => q.eq("freelancerId", user._id))
      .take(200);

    const completed = allRequests.filter((r) => r.status === "completed");
    const ongoing = allRequests.filter((r) => r.status === "in_progress");
    const pending = allRequests.filter((r) => r.status === "new");

    // Revenue = sum of budgets from completed requests
    const totalRevenue = completed.reduce((sum, r) => sum + (r.finalAmount ?? r.budget), 0);

    // This month calculations
    const now = Date.now();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStart = startOfMonth.getTime();

    const completedThisMonth = completed.filter(
      (r) => r.completedAt && r.completedAt >= monthStart
    ).length;

    const revenueThisMonth = completed
      .filter((r) => r.completedAt && r.completedAt >= monthStart)
      .reduce((sum, r) => sum + (r.finalAmount ?? r.budget), 0);

    const servicesThisMonth = services.filter(
      (s) => s._creationTime >= monthStart
    ).length;

    return {
      activeServices: services.length,
      totalRevenue,
      completedProjects: completed.length,
      ongoingProjects: ongoing.length,
      pendingRequests: pending.length,
      revenueThisMonth,
      completedThisMonth,
      servicesThisMonth,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "freelancer") throw new Error("Only freelancers can create services");

    // Input validation
    if (args.title.trim().length < 2 || args.title.trim().length > 200) throw new Error("العنوان يجب أن يكون بين 2 و 200 حرف");
    if (args.description.trim().length < 2 || args.description.trim().length > 5000) throw new Error("الوصف يجب أن يكون بين 2 و 5000 حرف");
    if (args.price <= 0 || args.price > 100_000_000) throw new Error("السعر غير صالح");
    if (args.images && args.images.length > 10) throw new Error("الحد الأقصى 10 صور");

    const defaultImg = "https://pub-f997105a40ef4c4c82ce45ee4be0b31e.r2.dev/defaults/service-placeholder.webp";
    const coverImage = args.images?.[0] ?? args.imageUrl ?? defaultImg;
    const images = args.images ?? [coverImage];

    return await ctx.db.insert("freelanceServices", {
      title: args.title,
      description: args.description,
      price: args.price,
      category: args.category,
      imageUrl: coverImage,
      images,
      videoUrl: args.videoUrl,
      freelancerId: user._id,
      freelancerName: user.name,
      freelancerAvatar: user.avatar,
      rating: 0,
      completedJobs: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("freelanceServices"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const service = await ctx.db.get(args.id);
    if (!service || service.freelancerId !== user._id) throw new Error("Not authorized");

    // Input validation
    if (args.title !== undefined && (args.title.trim().length < 2 || args.title.trim().length > 200)) throw new Error("العنوان يجب أن يكون بين 2 و 200 حرف");
    if (args.description !== undefined && (args.description.trim().length < 2 || args.description.trim().length > 5000)) throw new Error("الوصف يجب أن يكون بين 2 و 5000 حرف");
    if (args.price !== undefined && (args.price <= 0 || args.price > 100_000_000)) throw new Error("السعر غير صالح");
    if (args.images && args.images.length > 10) throw new Error("الحد الأقصى 10 صور");

    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    // Keep imageUrl in sync with images[0]
    if (fields.images && fields.images.length > 0) {
      updates.imageUrl = fields.images[0];
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("freelanceServices") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const service = await ctx.db.get(args.id);
    if (!service || service.freelancerId !== user._id) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
  },
});
