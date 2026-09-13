import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { betterAuth } from "better-auth";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  throw new Error("SITE_URL environment variable is required");
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    trustedOrigins: [
      "hasio://",
      "exp://",
      "https://hasio.com",
      "https://www.hasio.com",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:8081", "http://localhost:19006", "http://localhost:5173", "http://localhost:3000"]
        : []),
    ],
    advanced: {
      // CSRF protection requires an Origin header, which React Native doesn't send.
      // This is safe: CSRF is browser-only; mobile apps aren't vulnerable, and the
      // web app uses same-origin /api/auth/* routes (SameSite cookies mitigate CSRF).
      disableCSRFCheck: true,
    },
    emailAndPassword: {
      enabled: true,
      // TODO: Enable email verification once email provider is configured
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    plugins: [convex({ authConfig })],
  });
};

/**
 * Require the caller to be an admin. Throws if not authenticated or not admin role.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedAppUser(ctx);
  if (!user || user.role !== "admin") throw new Error("Admin access required");
  return user;
}

/**
 * Look up the authenticated app user from the `users` table.
 * Wraps `authComponent.getAuthUser` in a try-catch because it throws
 * when the caller is not authenticated rather than returning null.
 */
export async function getAuthenticatedAppUser(ctx: QueryCtx | MutationCtx) {
  try {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser || !authUser.email) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();

    return user ?? null;
  } catch {
    // Not authenticated — return null instead of propagating the error
    return null;
  }
}
