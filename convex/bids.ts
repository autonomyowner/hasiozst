import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";

export const listByOffer = query({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    // Only importateur and grossiste can view bids
    if (user.role !== "seller" || !user.sellerType) return [];
    if (user.sellerType !== "importateur" && user.sellerType !== "grossiste" && user.sellerType !== "fournisseur") return [];

    return await ctx.db
      .query("bids")
      .withIndex("offerId", (q) => q.eq("offerId", args.offerId))
      .order("asc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    offerId: v.id("offers"),
    amount: v.number(),
    message: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Only grossistes can bid on offers
    if (user.role !== "seller" || user.sellerType !== "grossiste") {
      throw new Error("Only grossistes can place bids");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.status !== "open") throw new Error("Offer is not open");
    if (offer.creatorId === user._id) throw new Error("Cannot bid on your own offer");

    if (args.amount <= 0) throw new Error("Bid amount must be positive");
    if (args.amount < offer.minPrice) throw new Error("Bid below minimum price");
    if (args.message.length > 1000) throw new Error("Message too long");
    if (args.phone && !/^0[5-7][0-9]{8}$/.test(args.phone)) {
      throw new Error("رقم الهاتف غير صالح");
    }

    const bidId = await ctx.db.insert("bids", {
      offerId: args.offerId,
      bidderId: user._id,
      bidderName: user.name,
      phone: args.phone,
      amount: args.amount,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });

    // Update offer bidCount and currentBestBid
    const newBidCount = offer.bidCount + 1;
    const currentBest = offer.currentBestBid;
    const newBest =
      currentBest === undefined || args.amount < currentBest
        ? args.amount
        : currentBest;

    await ctx.db.patch(args.offerId, {
      bidCount: newBidCount,
      currentBestBid: newBest,
    });

    // Notify offer creator that a bid was received
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "bid_received",
      title: "New Bid Received",
      message: `${user.name} placed a bid of ${args.amount} DA on your offer "${offer.title}".`,
      relatedId: bidId,
      userId: offer.creatorId,
    });

    return bidId;
  },
});

export const accept = mutation({
  args: { bidId: v.id("bids") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const bid = await ctx.db.get(args.bidId);
    if (!bid) throw new Error("Bid not found");

    const offer = await ctx.db.get(bid.offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.creatorId !== user._id) throw new Error("Not authorized");

    // Guard: offer must still be open, bid must still be pending
    if (offer.status !== "open") throw new Error("Offer is no longer open");
    if (bid.status !== "pending") throw new Error("Bid is no longer pending");

    // Accept the winning bid
    await ctx.db.patch(args.bidId, { status: "accepted" });

    // Reject all other pending bids on this offer
    const otherPendingBids = await ctx.db
      .query("bids")
      .withIndex("offerId_status", (q) =>
        q.eq("offerId", bid.offerId).eq("status", "pending")
      )
      .collect();

    await Promise.all(
      otherPendingBids
        .filter((b) => b._id !== args.bidId)
        .map(async (b) => {
          await ctx.db.patch(b._id, { status: "rejected" });

          // Notify each rejected bidder
          await ctx.runMutation(internal.notifications.createNotification, {
            type: "bid_rejected",
            title: "Bid Not Selected",
            message: `Your bid on "${offer.title}" was not selected.`,
            relatedId: b._id,
            userId: b.bidderId,
          });
        })
    );

    // Close the offer
    await ctx.db.patch(bid.offerId, { status: "closed" });

    // Notify the accepted bidder
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "bid_accepted",
      title: "Bid Accepted",
      message: `Your bid of ${bid.amount} DA on "${offer.title}" was accepted.`,
      relatedId: args.bidId,
      userId: bid.bidderId,
    });

    // Notify the offer creator that the offer is now closed
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "offer_closed",
      title: "Offer Closed",
      message: `Your offer "${offer.title}" has been closed after accepting a bid.`,
      relatedId: bid.offerId,
      userId: offer.creatorId,
    });

    return args.bidId;
  },
});

export const reject = mutation({
  args: { bidId: v.id("bids") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const bid = await ctx.db.get(args.bidId);
    if (!bid) throw new Error("Bid not found");

    const offer = await ctx.db.get(bid.offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.creatorId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.bidId, { status: "rejected" });

    // Notify the bidder their bid was rejected
    await ctx.runMutation(internal.notifications.createNotification, {
      type: "bid_rejected",
      title: "Bid Rejected",
      message: `Your bid of ${bid.amount} DA on "${offer.title}" was rejected.`,
      relatedId: args.bidId,
      userId: bid.bidderId,
    });

    return args.bidId;
  },
});

export const getBidderPhone = query({
  args: { bidId: v.id("bids") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const bid = await ctx.db.get(args.bidId);
    if (!bid || !bid.phone) return null;

    // Bidder can always see own phone
    if (bid.bidderId === user._id) return bid.phone;

    // Offer creator can see bidder's phone when bid is accepted
    if (bid.status === "accepted") {
      const offer = await ctx.db.get(bid.offerId);
      if (offer && offer.creatorId === user._id) return bid.phone;
    }

    return null;
  },
});
