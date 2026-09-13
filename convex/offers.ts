import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

export const getById = query({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    // Only importateur and grossiste can view offers
    if (user.role !== "seller" || !user.sellerType) return null;
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return null;

    return await ctx.db.get(args.id);
  },
});

// Returns open offers created by importateurs — visible to grossistes (and importateurs to manage their own)
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only importateur and grossiste can see offers
    if (user.role !== "seller" || !user.sellerType) return [];
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return [];

    const offers = await ctx.db
      .query("offers")
      .withIndex("status", (q) => q.eq("status", "open"))
      .take(200);

    // Only return offers created by importateurs (the import market flow)
    return offers.filter((o) => o.creatorSellerType === "importateur");
  },
});

export const listByCreator = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("offers")
      .withIndex("creatorId", (q) => q.eq("creatorId", user._id))
      .take(100);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    productName: v.string(),
    quantity: v.number(),
    unit: v.string(),
    type: v.union(v.literal("auction"), v.literal("negotiable")),
    minPrice: v.number(),
    deadline: v.string(),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Only importateurs can create offers
    if (user.role !== "seller" || user.sellerType !== "importateur") {
      throw new Error("Only importateurs can create offers");
    }

    if (args.title.length > 200) throw new Error("Title too long");
    if (args.description.length > 2000) throw new Error("Description too long");
    if (args.minPrice <= 0) throw new Error("Minimum price must be positive");
    if (args.quantity <= 0) throw new Error("Quantity must be positive");
    if (args.phone && !/^0[5-7][0-9]{8}$/.test(args.phone)) {
      throw new Error("رقم الهاتف غير صالح");
    }

    const { phone, category, ...rest } = args;
    return await ctx.db.insert("offers", {
      ...rest,
      phone: phone,
      category: category,
      creatorId: user._id,
      creatorName: user.name,
      creatorSellerType: "importateur",
      status: "open",
      bidCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const getCreatorPhone = query({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const offer = await ctx.db.get(args.offerId);
    if (!offer || !offer.phone) return null;

    // Creator can always see own phone
    if (offer.creatorId === user._id) return offer.phone;

    // Accepted bidder can see creator's phone
    const acceptedBids = await ctx.db
      .query("bids")
      .withIndex("offerId_status", (q) =>
        q.eq("offerId", args.offerId).eq("status", "accepted")
      )
      .collect();

    const isAcceptedBidder = acceptedBids.some((b) => b.bidderId === user._id);
    if (isAcceptedBidder) return offer.phone;

    return null;
  },
});

export const close = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.id);
    if (!offer) throw new Error("Offer not found");
    if (offer.creatorId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { status: "closed" });
    return args.id;
  },
});
