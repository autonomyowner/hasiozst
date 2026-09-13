import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const banners = await ctx.db
      .query("banners")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return banners.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
