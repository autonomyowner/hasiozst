import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  query,
  mutation,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { getAuthenticatedAppUser, requireAdmin } from "./auth";

const targetTypeValidator = v.union(
  v.literal("reel"),
  v.literal("reelComment"),
  v.literal("product"),
  v.literal("wholesaleProduct"),
  v.literal("freelanceService"),
  v.literal("offer"),
  v.literal("demandRequest"),
  v.literal("user"),
);

const reasonValidator = v.union(
  v.literal("spam"),
  v.literal("harassment"),
  v.literal("hate"),
  v.literal("violence"),
  v.literal("sexual"),
  v.literal("illegal"),
  v.literal("intellectual_property"),
  v.literal("scam"),
  v.literal("other"),
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("reviewing"),
  v.literal("dismissed"),
  v.literal("action_taken"),
);

type TargetType = Doc<"reports">["targetType"];

const TABLE_BY_TARGET: Record<
  TargetType,
  | "reels"
  | "reelComments"
  | "products"
  | "wholesaleProducts"
  | "freelanceServices"
  | "offers"
  | "demandRequests"
  | "users"
> = {
  reel: "reels",
  reelComment: "reelComments",
  product: "products",
  wholesaleProduct: "wholesaleProducts",
  freelanceService: "freelanceServices",
  offer: "offers",
  demandRequest: "demandRequests",
  user: "users",
};

async function resolveTargetOwnerId(
  ctx: QueryCtx | MutationCtx,
  targetType: TargetType,
  targetId: string,
): Promise<Id<"users"> | undefined> {
  const tableName = TABLE_BY_TARGET[targetType];
  // We don't trust the supplied id format — bail silently if invalid.
  let row: Record<string, unknown> | null = null;
  try {
    row = (await ctx.db.get(targetId as Id<"reels">)) as Record<string, unknown> | null;
  } catch {
    return undefined;
  }
  if (!row) return undefined;
  switch (targetType) {
    case "reel":
    case "reelComment":
      return (row.posterId ?? row.userId) as Id<"users"> | undefined;
    case "product":
      return row.sellerId as Id<"users"> | undefined;
    case "wholesaleProduct":
      return row.supplierId as Id<"users"> | undefined;
    case "freelanceService":
      return row.freelancerId as Id<"users"> | undefined;
    case "offer":
      return row.creatorId as Id<"users"> | undefined;
    case "demandRequest":
      return row.userId as Id<"users"> | undefined;
    case "user":
      return targetId as Id<"users">;
    default:
      return undefined;
  }
  void tableName;
}

export const submit = mutation({
  args: {
    targetType: targetTypeValidator,
    targetId: v.string(),
    reason: reasonValidator,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (args.details && args.details.length > 500) {
      throw new Error("Details too long (max 500 characters)");
    }

    const targetOwnerId = await resolveTargetOwnerId(
      ctx,
      args.targetType,
      args.targetId,
    );

    if (targetOwnerId && targetOwnerId === user._id) {
      throw new Error("You cannot report your own content");
    }

    // Block duplicates from the same reporter on the same target within 24h.
    const existing = await ctx.db
      .query("reports")
      .withIndex("reporterId_targetType_targetId", (q) =>
        q
          .eq("reporterId", user._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId),
      )
      .order("desc")
      .first();
    if (existing && Date.now() - existing.createdAt < 24 * 60 * 60 * 1000) {
      throw new Error("You already reported this recently");
    }

    const reportId = await ctx.db.insert("reports", {
      reporterId: user._id,
      targetType: args.targetType,
      targetId: args.targetId,
      targetOwnerId,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify all admins (fire and forget for each).
    const admins = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "report_received",
        title: "New content report",
        message: `${user.name} reported a ${args.targetType} (${args.reason}).`,
        relatedId: reportId,
        userId: admin._id,
      });
    }

    return reportId;
  },
});

export const listForAdmin = query({
  args: {
    status: v.optional(statusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const reports = args.status
      ? await ctx.db
          .query("reports")
          .withIndex("status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("reports").order("desc").take(limit);

    return await Promise.all(
      reports.map(async (r) => {
        const reporter = await ctx.db.get(r.reporterId);
        const owner = r.targetOwnerId
          ? await ctx.db.get(r.targetOwnerId)
          : null;
        return {
          ...r,
          reporterName: reporter?.name ?? "Unknown",
          targetOwnerName: owner?.name ?? null,
        };
      }),
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("reports"),
    status: statusValidator,
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Report not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      adminNotes: args.adminNotes,
      resolvedAt:
        args.status === "dismissed" || args.status === "action_taken"
          ? Date.now()
          : undefined,
      resolvedBy:
        args.status === "dismissed" || args.status === "action_taken"
          ? admin._id
          : undefined,
    });
  },
});

export const removeReportedContent = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    let removed = false;
    try {
      const targetDoc = await ctx.db.get(
        report.targetId as Id<"reels">,
      );
      if (targetDoc) {
        await ctx.db.delete(targetDoc._id);
        removed = true;
      }
    } catch {
      removed = false;
    }

    await ctx.db.patch(args.reportId, {
      status: "action_taken",
      resolvedAt: Date.now(),
      resolvedBy: admin._id,
      adminNotes: removed
        ? "Content removed by admin"
        : "Content already deleted",
    });

    if (removed && report.targetOwnerId) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "content_removed",
        title: "Content removed",
        message: `Your ${report.targetType} was removed for violating community guidelines.`,
        relatedId: args.reportId,
        userId: report.targetOwnerId,
      });
    }

    return { removed };
  },
});
