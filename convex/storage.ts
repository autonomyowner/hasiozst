import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedAppUser } from "./auth";

/**
 * Generate a presigned upload URL for Convex built-in file storage.
 * The client POSTs the file to this URL and receives a storageId.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the serving URL for a storage ID (reactive query).
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");
    return url;
  },
});

/**
 * Get the serving URL for a storage ID (imperative, for use after upload).
 */
export const resolveUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");
    return url;
  },
});
