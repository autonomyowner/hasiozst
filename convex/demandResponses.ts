import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

const PHONE_REGEX = /^0[5-7][0-9]{8}$/;

export const create = mutation({
  args: {
    demandId: v.id("demandRequests"),
    phone: v.string(),
    message: v.string(),
    priceQuote: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Only B2B sellers can respond
    if (user.role !== "seller" || !user.sellerType) {
      throw new Error("Only B2B sellers can respond to demands");
    }
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") {
      throw new Error("Only B2B sellers can respond to demands");
    }

    // Validate phone
    if (!PHONE_REGEX.test(args.phone)) {
      throw new Error("رقم الهاتف غير صالح (يجب أن يبدأ بـ 05/06/07)");
    }

    if (args.message.length > 1000) throw new Error("Message too long (max 1000)");
    if (args.priceQuote <= 0) throw new Error("Price quote must be positive");

    const demand = await ctx.db.get(args.demandId);
    if (!demand) throw new Error("Demand not found");

    // Cannot respond to own demand
    if (demand.userId === user._id) {
      throw new Error("Cannot respond to your own demand");
    }

    // Prevent duplicate responses (compound index lookup)
    const alreadyResponded = await ctx.db
      .query("demandResponses")
      .withIndex("responderId_demandId", (q) =>
        q.eq("responderId", user._id).eq("demandId", args.demandId)
      )
      .first();
    if (alreadyResponded) {
      throw new Error("لقد أرسلت رداً على هذا الطلب مسبقاً");
    }

    const responseId = await ctx.db.insert("demandResponses", {
      demandId: args.demandId,
      responderId: user._id,
      responderName: user.name,
      phone: args.phone,
      message: args.message,
      priceQuote: args.priceQuote,
      status: "pending",
      createdAt: Date.now(),
    });

    // Increment responseCount
    const currentCount = demand.responseCount ?? 0;
    const patch: Record<string, unknown> = { responseCount: currentCount + 1 };
    // Auto-set to in_progress if new
    if (demand.status === "new") {
      patch.status = "in_progress";
    }
    await ctx.db.patch(args.demandId, patch);

    // Notify demand creator
    if (demand.userId) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "demand_response_received",
        title: "رد جديد على طلبك",
        message: `${user.name} أرسل عرض سعر ${args.priceQuote} دج على طلبك "${demand.title}"`,
        relatedId: responseId,
        userId: demand.userId,
      });
    }

    return responseId;
  },
});

export const accept = mutation({
  args: { responseId: v.id("demandResponses") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const demand = await ctx.db.get(response.demandId);
    if (!demand) throw new Error("Demand not found");

    // Only demand creator can accept
    if (demand.userId !== user._id) throw new Error("Not authorized");
    if (response.status !== "pending") throw new Error("Response already processed");

    await ctx.db.patch(args.responseId, { status: "accepted" });

    // Notify responder
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "demand_response_accepted",
      title: "تم قبول عرضك",
      message: `تم قبول عرضك على طلب "${demand.title}". يمكنك الآن رؤية رقم هاتف صاحب الطلب.`,
      relatedId: args.responseId,
      userId: response.responderId,
    });

    return args.responseId;
  },
});

export const decline = mutation({
  args: { responseId: v.id("demandResponses") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const demand = await ctx.db.get(response.demandId);
    if (!demand) throw new Error("Demand not found");

    // Only demand creator can decline
    if (demand.userId !== user._id) throw new Error("Not authorized");
    if (response.status !== "pending") throw new Error("Response already processed");

    await ctx.db.patch(args.responseId, { status: "declined" });

    // Notify responder
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "demand_response_declined",
      title: "تم رفض عرضك",
      message: `تم رفض عرضك على طلب "${demand.title}".`,
      relatedId: args.responseId,
      userId: response.responderId,
    });

    return args.responseId;
  },
});

export const listByDemand = query({
  args: { demandId: v.id("demandRequests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const demand = await ctx.db.get(args.demandId);
    if (!demand) return [];

    const responses = await ctx.db
      .query("demandResponses")
      .withIndex("demandId", (q) => q.eq("demandId", args.demandId))
      .order("desc")
      .take(50);

    // Demand creator sees all responses; others see only their own
    if (demand.userId === user._id) {
      return responses;
    }
    return responses.filter((r) => r.responderId === user._id);
  },
});

export const listByResponder = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("demandResponses")
      .withIndex("responderId", (q) => q.eq("responderId", user._id))
      .order("desc")
      .take(50);
  },
});
