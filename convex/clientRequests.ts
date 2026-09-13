import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

export const listForFreelancer = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("declined")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    if (args.status) {
      return await ctx.db
        .query("clientRequests")
        .withIndex("freelancerId_status", (q) =>
          q.eq("freelancerId", user._id).eq("status", args.status!)
        )
        .order("desc")
        .take(50);
    }

    return await ctx.db
      .query("clientRequests")
      .withIndex("freelancerId", (q) => q.eq("freelancerId", user._id))
      .order("desc")
      .take(50);
  },
});

export const countNewForFreelancer = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return 0;

    const newRequests = await ctx.db
      .query("clientRequests")
      .withIndex("freelancerId_status", (q) =>
        q.eq("freelancerId", user._id).eq("status", "new")
      )
      .take(50);

    return newRequests.length;
  },
});

export const create = mutation({
  args: {
    freelancerId: v.id("users"),
    serviceTitle: v.string(),
    description: v.string(),
    budget: v.number(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.description.length > 2000) {
      throw new Error("Description too long (max 2000 characters)");
    }
    if (args.budget <= 0 || args.budget > 100000000) {
      throw new Error("Budget must be between 1 and 100,000,000");
    }
    if (args.phone && !/^0[5-7][0-9]{8}$/.test(args.phone)) {
      throw new Error("Invalid phone number format");
    }

    const requestId = await ctx.db.insert("clientRequests", {
      freelancerId: args.freelancerId,
      clientId: user._id,
      clientName: user.name,
      clientAvatar: user.avatar || "",
      phone: args.phone,
      title: args.serviceTitle,
      description: args.description,
      budget: args.budget,
      deliveryTime: "",
      status: "new",
      createdAt: Date.now(),
    });

    // Notify freelancer
    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      type: "service_request_received",
      title: "طلب خدمة جديد",
      message: `${user.name} طلب خدمة "${args.serviceTitle}"`,
      relatedId: requestId,
      userId: args.freelancerId,
    });

    return requestId;
  },
});

export const accept = mutation({
  args: { requestId: v.id("clientRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.freelancerId !== user._id) throw new Error("Not authorized");
    if (request.status !== "new") throw new Error("Request is not in 'new' status");

    await ctx.db.patch(args.requestId, { status: "in_progress" });

    // Notify client
    if (request.clientId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        type: "service_request_accepted",
        title: "تم قبول طلبك",
        message: `${user.name} قبل طلبك لخدمة "${request.title}"`,
        relatedId: args.requestId,
        userId: request.clientId,
      });
    }
  },
});

export const decline = mutation({
  args: { requestId: v.id("clientRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.freelancerId !== user._id) throw new Error("Not authorized");
    if (request.status !== "new") throw new Error("Request is not in 'new' status");

    await ctx.db.patch(args.requestId, { status: "declined" });

    // Notify client
    if (request.clientId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        type: "service_request_declined",
        title: "تم رفض طلبك",
        message: `${user.name} رفض طلبك لخدمة "${request.title}"`,
        relatedId: args.requestId,
        userId: request.clientId,
      });
    }
  },
});

export const complete = mutation({
  args: { requestId: v.id("clientRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.freelancerId !== user._id) throw new Error("Not authorized");
    if (request.status !== "in_progress") throw new Error("Request is not in 'in_progress' status");

    await ctx.db.patch(args.requestId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Notify client
    if (request.clientId) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        type: "service_request_completed",
        title: "تم إكمال طلبك",
        message: `${user.name} أكمل خدمة "${request.title}"`,
        relatedId: args.requestId,
        userId: request.clientId,
      });
    }
  },
});

export const listByClient = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("clientRequests")
      .withIndex("clientId", (q) => q.eq("clientId", user._id))
      .order("desc")
      .take(50);
  },
});

export const remove = mutation({
  args: { requestId: v.id("clientRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // Both client and freelancer can delete
    if (request.freelancerId !== user._id && request.clientId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.requestId);
  },
});

export const clearAllForFreelancer = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const requests = await ctx.db
      .query("clientRequests")
      .withIndex("freelancerId", (q) => q.eq("freelancerId", user._id))
      .take(200);

    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    return requests.length;
  },
});
