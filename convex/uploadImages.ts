import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// TODO(hasio): legacy import helper. Empty by default so it cannot pull from
// another project's deployment; set LEGACY_STORAGE_BASE to re-import old assets.
const STORAGE_BASE = `${process.env.LEGACY_STORAGE_BASE ?? ""}/api/storage`;

// All image assets — now permanently stored in Convex storage (migrated from Figma MCP)
const STORAGE_ASSETS: Record<string, string> = {
  banner:           "68352d85-3efc-44c1-8bcd-435f40c0c501",
  warehouseBg:      "b46f16bd-6422-47f6-ba06-0d7e1cd2ae50",
  logo:             "cf0c088e-d26a-48eb-bb59-e7b1d94aeba0",
  officeChair:      "ce76e2b0-9b00-4f1a-aa01-dfb93106ca72",
  groceryRice:      "fb4a7c6d-4124-43e7-aa3f-2d201889d141",
  coffeeMachine:    "0a7c7fa5-ed92-4783-a340-e1514a0be942",
  headphones:       "d8b3afec-d168-4352-a941-562abcbc5d9f",
  smartwatch:       "a4bb52bc-6488-4494-a22d-91415bd0167e",
  officeChairCard:  "fd96e89e-c377-4115-a20c-7296dac2ba83",
  supplierAvatar:   "8d5291ac-b694-403a-94fc-6d16421994ac",
  sellerProfile:    "ceb2bf88-5f4a-4c2b-ae8a-0fe1a6081192",
  grocerySupplier:  "6809012e-2022-424c-8a0a-b5fd32584651",
  importerSupplier: "b71ad660-57a4-4bec-b71a-a81f747a3127",
};

/**
 * Re-download images from Convex storage and re-store them.
 * Migration from Figma MCP is complete — images are now in Convex storage.
 * Run with: npx convex run uploadImages:migrate
 */
export const migrate = internalAction({
  args: {},
  handler: async (ctx) => {
    const urls: Record<string, string> = {};
    const errors: string[] = [];

    for (const [name, existingId] of Object.entries(STORAGE_ASSETS)) {
      try {
        console.log(`Downloading ${name}...`);
        const res = await fetch(`${STORAGE_BASE}/${existingId}`, { redirect: "follow" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const blob = await res.blob();
        console.log(`  ${(blob.size / 1024).toFixed(1)} KB — storing in Convex...`);

        const newStorageId = await ctx.storage.store(blob);
        const url = await ctx.storage.getUrl(newStorageId);

        if (!url) {
          throw new Error("Failed to get storage URL");
        }

        urls[name] = url;
        console.log(`  ✓ ${name} → ${url}`);
      } catch (err: unknown) {
        const msg = `${name}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`  ✗ ${msg}`);
        errors.push(msg);
      }
    }

    // Save the URL mapping to the database for reference
    await ctx.runMutation(internal.uploadImages.saveUrlMapping, { urls });

    console.log(`\nDone: ${Object.keys(urls).length} uploaded, ${errors.length} failed`);
    if (errors.length > 0) {
      console.log("Failures:", errors.join(", "));
    }

    return urls;
  },
});

/**
 * Store the URL mapping in a system table so we can reference it later.
 */
export const saveUrlMapping = internalMutation({
  args: { urls: v.any() },
  handler: async (ctx, args) => {
    // Store in a simple key-value approach — check if mapping already exists
    const existing = await ctx.db.query("imageAssets").first();
    if (existing) {
      await ctx.db.patch(existing._id, { urls: args.urls, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("imageAssets", { urls: args.urls, updatedAt: Date.now() });
    }
  },
});

/**
 * Get the stored URL mapping.
 */
export const getUrlMapping = internalMutation({
  args: {},
  handler: async (ctx) => {
    const mapping = await ctx.db.query("imageAssets").first();
    return mapping?.urls ?? null;
  },
});
