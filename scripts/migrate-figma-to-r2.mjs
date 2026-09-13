#!/usr/bin/env node
/**
 * Migrate Convex storage images to Cloudflare R2 for CDN distribution.
 *
 * Prerequisites:
 * 1. Set R2 env vars in Convex dashboard:
 *    - R2_ENDPOINT (e.g. https://<account>.r2.cloudflarestorage.com)
 *    - R2_ACCESS_KEY_ID
 *    - R2_SECRET_ACCESS_KEY
 *    - R2_BUCKET_NAME
 *    - R2_PUBLIC_URL (e.g. https://cdn.yourdomain.com)
 * 2. Run `npx convex dev` to deploy the HTTP upload endpoint
 *
 * Usage: node scripts/migrate-figma-to-r2.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// Read Convex site URL from .env.local
function getConvexSiteUrl() {
  try {
    const envPath = join(PROJECT_ROOT, ".env.local");
    const env = readFileSync(envPath, "utf-8");
    const match = env.match(/EXPO_PUBLIC_CONVEX_SITE_URL=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  return null;
}

const CONVEX_SITE_URL = getConvexSiteUrl();
if (!CONVEX_SITE_URL) {
  console.error("ERROR: Could not read EXPO_PUBLIC_CONVEX_SITE_URL from .env.local");
  process.exit(1);
}

// All image assets — now permanently stored in Convex storage (migrated from Figma MCP)
const STORAGE_ASSETS = {
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

const STORAGE_BASE = "https://silent-chipmunk-103.eu-west-1.convex.cloud/api/storage";

async function migrateImage(name, storageId) {
  const sourceUrl = `${STORAGE_BASE}/${storageId}`;

  // 1. Download from Convex storage
  process.stdout.write(`  [${name}] Downloading... `);
  const imgRes = await fetch(sourceUrl, { redirect: "follow" });
  if (!imgRes.ok) {
    throw new Error(`Download failed: ${imgRes.status} ${imgRes.statusText}`);
  }

  const rawType = imgRes.headers.get("content-type") || "image/png";
  // Normalize to types accepted by our R2 endpoint
  const contentType = rawType.includes("jpeg") || rawType.includes("jpg")
    ? "image/jpeg"
    : rawType.includes("webp")
      ? "image/webp"
      : "image/png";

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const sizeKB = (buffer.length / 1024).toFixed(1);
  process.stdout.write(`${sizeKB} KB (${contentType})\n`);

  // 2. Get presigned URL from Convex HTTP endpoint
  process.stdout.write(`  [${name}] Requesting presigned URL... `);
  const urlRes = await fetch(`${CONVEX_SITE_URL}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "seed", contentType }),
  });

  if (!urlRes.ok) {
    const errText = await urlRes.text().catch(() => urlRes.statusText);
    throw new Error(`Presigned URL failed (${urlRes.status}): ${errText}`);
  }

  const { uploadUrl, publicUrl } = await urlRes.json();
  process.stdout.write("OK\n");

  // 3. Upload to R2
  process.stdout.write(`  [${name}] Uploading to R2... `);
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
  }

  console.log(`Done → ${publicUrl}`);
  return publicUrl;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Migrate Convex Storage Images → Cloudflare R2  ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`Convex site: ${CONVEX_SITE_URL}`);
  console.log(`Images to migrate: ${Object.keys(STORAGE_ASSETS).length}\n`);

  const r2Urls = {};
  const errors = [];

  for (const [name, storageId] of Object.entries(STORAGE_ASSETS)) {
    try {
      r2Urls[name] = await migrateImage(name, storageId);
    } catch (err) {
      console.log(`  [${name}] FAILED: ${err.message}`);
      errors.push({ name, error: err.message });
    }
    console.log("");
  }

  // Save mapping file
  const outputPath = join(__dirname, "r2-urls.json");
  writeFileSync(outputPath, JSON.stringify(r2Urls, null, 2));

  console.log("═══════════════════════════════════════════════════");
  console.log(`Uploaded: ${Object.keys(r2Urls).length} / ${Object.keys(STORAGE_ASSETS).length}`);
  if (errors.length > 0) {
    console.log(`Failed:   ${errors.length}`);
    errors.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
  }
  console.log(`\nURL mapping saved to: scripts/r2-urls.json`);
  console.log("\nNext steps:");
  console.log("  1. Run: node scripts/apply-r2-urls.mjs");
  console.log("     (updates all source files with R2 URLs)");
  console.log("  2. Run: npx convex dev");
  console.log("  3. Clear database from Convex dashboard");
  console.log("  4. Run: npx convex run seed:seed");
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
