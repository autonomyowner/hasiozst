import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./auth";

// ─── Users ──────────────────────────────────────────────

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    roleFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let users;
    if (args.roleFilter) {
      users = await ctx.db
        .query("users")
        .withIndex("role", (q) => q.eq("role", args.roleFilter as "customer" | "seller" | "freelancer" | "admin"))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    if (args.search) {
      const s = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    return users;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("customer"),
      v.literal("seller"),
      v.literal("freelancer"),
      v.literal("admin")
    ),
    sellerType: v.optional(
      v.union(v.literal("fournisseur"), v.literal("importateur"), v.literal("grossiste"))
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      role: args.role,
      sellerType: args.role === "seller" ? args.sellerType : undefined,
    });
  },
});

export const updateUserPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { plan: args.plan });
  },
});

// ─── Platform Analytics ─────────────────────────────────

export const getPlatformAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allOrders = await ctx.db.query("orders").take(1000);
    const allUsers = await ctx.db.query("users").take(1000);
    const allProducts = await ctx.db.query("products").take(1000);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const totalOrders = allOrders.length;
    const totalUsers = allUsers.length;
    const totalProducts = allProducts.length;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const o of allOrders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    // Users by role
    const usersByRole: Record<string, number> = {};
    for (const u of allUsers) {
      usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1;
    }

    // Monthly revenue (last 6 months)
    const now = Date.now();
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1).getTime();
      const end = new Date(year, month + 1, 1).getTime();
      const rev = allOrders
        .filter((o) => o.createdAt >= start && o.createdAt < end)
        .reduce((sum, o) => sum + (o.total ?? 0), 0);
      const label = `${year}-${String(month + 1).padStart(2, "0")}`;
      monthlyRevenue.push({ month: label, revenue: rev });
    }

    // Top cities
    const cityMap: Record<string, number> = {};
    for (const o of allOrders) {
      const city = o.shippingAddress?.city ?? "غير محدد";
      cityMap[city] = (cityMap[city] ?? 0) + 1;
    }
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      ordersByStatus,
      usersByRole,
      monthlyRevenue,
      topCities,
    };
  },
});

// ─── Orders ─────────────────────────────────────────────

export const listAllOrders = query({
  args: { statusFilter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.statusFilter) {
      return await ctx.db
        .query("orders")
        .withIndex("status", (q) =>
          q.eq("status", args.statusFilter as "pending" | "processing" | "shipped" | "delivered")
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db.query("orders").order("desc").take(200);
  },
});

export const adminUpdateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// ─── Content Moderation: Products ───────────────────────

export const listAllProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("products").order("desc").take(200);
  },
});

export const adminRemoveProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const adminRestoreProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { isActive: true });
  },
});

// ─── Content Moderation: Reels ──────────────────────────

export const listAllReels = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("reels").order("desc").take(200);
  },
});

export const adminRemoveReel = mutation({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const reel = await ctx.db.get(args.id);
    if (!reel) throw new Error("Reel not found");

    // Delete likes
    const likes = await ctx.db
      .query("reelLikes")
      .withIndex("reelId", (q) => q.eq("reelId", args.id))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete comments
    const comments = await ctx.db
      .query("reelComments")
      .withIndex("reelId", (q) => q.eq("reelId", args.id))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.id);
  },
});

// ─── Content Moderation: Offers ─────────────────────────

export const listAllOffers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("offers").order("desc").take(200);
  },
});

export const adminCloseOffer = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const offer = await ctx.db.get(args.id);
    if (!offer) throw new Error("Offer not found");
    await ctx.db.patch(args.id, { status: "closed" });
  },
});

// ─── Content Moderation: Freelance Services ─────────────

export const listAllFreelanceServices = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("freelanceServices").order("desc").take(200);
  },
});

export const adminRemoveFreelanceService = mutation({
  args: { id: v.id("freelanceServices") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const service = await ctx.db.get(args.id);
    if (!service) throw new Error("Service not found");
    await ctx.db.delete(args.id);
  },
});

// ─── Content Moderation: Wholesale Products ─────────────

export const listAllWholesaleProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("wholesaleProducts").order("desc").take(200);
  },
});

export const adminRemoveWholesaleProduct = mutation({
  args: { id: v.id("wholesaleProducts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const wp = await ctx.db.get(args.id);
    if (!wp) throw new Error("Wholesale product not found");
    await ctx.db.delete(args.id);
  },
});

// ─── Categories ─────────────────────────────────────────

export const createCategory = mutation({
  args: {
    slug: v.string(),
    label: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("Category slug already exists");

    await ctx.db.insert("categories", {
      slug: args.slug,
      label: args.label,
      sortOrder: args.sortOrder,
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    slug: v.optional(v.string()),
    label: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cat = await ctx.db.get(args.id);
    if (!cat) throw new Error("Category not found");

    if (args.slug && args.slug !== cat.slug) {
      const dup = await ctx.db
        .query("categories")
        .withIndex("slug", (q) => q.eq("slug", args.slug!))
        .first();
      if (dup) throw new Error("Category slug already exists");
    }

    const patch: Record<string, string | number> = {};
    if (args.slug !== undefined) patch.slug = args.slug;
    if (args.label !== undefined) patch.label = args.label;
    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
    await ctx.db.patch(args.id, patch);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cat = await ctx.db.get(args.id);
    if (!cat) throw new Error("Category not found");
    await ctx.db.delete(args.id);
  },
});

// ─── Banners ────────────────────────────────────────────

export const listAllBanners = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("banners").collect();
  },
});

export const createBanner = mutation({
  args: {
    imageUrl: v.string(),
    videoUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("gif"))),
    title: v.string(),
    titleArabic: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.insert("banners", args);
  },
});

export const updateBanner = mutation({
  args: {
    id: v.id("banners"),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("gif"))),
    title: v.optional(v.string()),
    titleArabic: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const banner = await ctx.db.get(args.id);
    if (!banner) throw new Error("Banner not found");

    const { id, ...updates } = args;
    const patch: Record<string, string | number | boolean> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

export const deleteBanner = mutation({
  args: { id: v.id("banners") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const banner = await ctx.db.get(args.id);
    if (!banner) throw new Error("Banner not found");
    await ctx.db.delete(args.id);
  },
});

// ─── Bootstrap: Promote first admin ─────────────────────

export const promoteToAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error(`User with email ${args.email} not found`);
    await ctx.db.patch(user._id, { role: "admin" });
    return { success: true, userId: user._id, name: user.name };
  },
});

// ─── Play Store review: assign roles to pre-signed-up reviewer accounts ─────────
//
// Better-auth owns password hashes in its own tables, so we can't create sign-in
// credentials from a mutation. Workflow:
//   1. Sign up each email below through the app (email/password, >=8 chars).
//   2. Run once:  npx convex run --prod admin:setupReviewers
//   3. Paste the same five emails + password into Play Console → App content →
//      App access, with instructions: "Each account demos one role."
export const setupReviewers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const reviewers: Array<{
      email: string;
      role: "customer" | "seller" | "freelancer";
      sellerType?: "fournisseur" | "importateur" | "grossiste";
    }> = [
      { email: "reviewer.customer@hasio.com",     role: "customer" },
      { email: "reviewer.fournisseur@hasio.com",  role: "seller", sellerType: "fournisseur" },
      { email: "reviewer.importateur@hasio.com",  role: "seller", sellerType: "importateur" },
      { email: "reviewer.grossiste@hasio.com",    role: "seller", sellerType: "grossiste" },
      { email: "reviewer.freelancer@hasio.com",   role: "freelancer" },
    ];

    const results: Array<{ email: string; status: string }> = [];
    for (const r of reviewers) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", r.email))
        .first();
      if (!user) {
        results.push({ email: r.email, status: "MISSING — sign up this email first" });
        continue;
      }
      await ctx.db.patch(user._id, {
        role: r.role,
        sellerType: r.sellerType,
        plan: "pro",
      });
      results.push({ email: r.email, status: `ok (${r.role}${r.sellerType ? `/${r.sellerType}` : ""})` });
    }
    return results;
  },
});

// Upsert a row in the app `users` table keyed by email. No auth check — callable
// only via `internal.*` (internalMutation) from trusted server code.
export const upsertReviewerUserRow = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("customer"), v.literal("seller"), v.literal("freelancer")),
    sellerType: v.optional(
      v.union(v.literal("fournisseur"), v.literal("importateur"), v.literal("grossiste")),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        sellerType: args.sellerType,
        plan: "pro",
      });
      return { inserted: false, userId: existing._id };
    }
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      avatar: "",
      role: args.role,
      sellerType: args.sellerType,
      plan: "pro",
    });
    return { inserted: true, userId };
  },
});

// One-shot action: creates five reviewer accounts via better-auth sign-up HTTP
// endpoint, then upserts the app `users` rows with the right role/sellerType.
//
//   npx convex run --prod admin:createReviewerAccounts '{"password":"SomePw12345"}'
//
// Idempotent-ish: better-auth returns an error for already-existing emails,
// which we report but do not treat as fatal — the user row is still upserted.
export const createReviewerAccounts = internalAction({
  args: { password: v.string() },
  handler: async (ctx, args): Promise<Array<{ email: string; status: string }>> => {
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) throw new Error("CONVEX_SITE_URL env var not set");
    if (args.password.length < 8) throw new Error("password must be >= 8 chars");

    const reviewers: Array<{
      email: string;
      name: string;
      role: "customer" | "seller" | "freelancer";
      sellerType?: "fournisseur" | "importateur" | "grossiste";
    }> = [
      { email: "reviewer.customer@hasio.com",     name: "Reviewer Customer",     role: "customer" },
      { email: "reviewer.fournisseur@hasio.com",  name: "Reviewer Fournisseur",  role: "seller", sellerType: "fournisseur" },
      { email: "reviewer.importateur@hasio.com",  name: "Reviewer Importateur",  role: "seller", sellerType: "importateur" },
      { email: "reviewer.grossiste@hasio.com",    name: "Reviewer Grossiste",    role: "seller", sellerType: "grossiste" },
      { email: "reviewer.freelancer@hasio.com",   name: "Reviewer Freelancer",   role: "freelancer" },
    ];

    const results: Array<{ email: string; status: string }> = [];
    for (const r of reviewers) {
      let signupStatus = "";
      try {
        const res = await fetch(`${siteUrl}/api/auth/sign-up/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: r.email, password: args.password, name: r.name }),
        });
        if (res.ok) {
          signupStatus = "signed up";
        } else {
          const body = await res.text();
          signupStatus = `signup ${res.status}: ${body.slice(0, 120)}`;
        }
      } catch (e: unknown) {
        signupStatus = `signup error: ${(e as Error).message}`;
      }

      const upsert = await ctx.runMutation(internal.admin.upsertReviewerUserRow, {
        email: r.email,
        name: r.name,
        role: r.role,
        sellerType: r.sellerType,
      });

      results.push({
        email: r.email,
        status: `${signupStatus}; row ${upsert.inserted ? "inserted" : "patched"} (${r.role}${r.sellerType ? `/${r.sellerType}` : ""})`,
      });
    }
    return results;
  },
});
