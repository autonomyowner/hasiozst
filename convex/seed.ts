import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Permanent image assets stored in Convex storage ──
// These URLs are permanent and do not expire.

const STORAGE = "https://secret-toad-401.eu-west-1.convex.cloud/api/storage";

// ── Convex storage image assets (originally extracted from Figma design file XZvvee3bk05zr9IEzb9NFM) ──
const figmaImgs = {
  // Home screen banner (Yassir Arabic banner — man on couch + shopping bag)
  banner:           `${STORAGE}/68352d85-3efc-44c1-8bcd-435f40c0c501`,
  // Auth screen warehouse background
  warehouseBg:      `${STORAGE}/b46f16bd-6422-47f6-ba06-0d7e1cd2ae50`,
  // HASIO logo (yellow bird icon)
  logo:             `${STORAGE}/cf0c088e-d26a-48eb-bb59-e7b1d94aeba0`,
  // Product images (from product detail pages)
  officeChair:      `${STORAGE}/ce76e2b0-9b00-4f1a-aa01-dfb93106ca72`,  // Express variant main
  groceryRice:      `${STORAGE}/fb4a7c6d-4124-43e7-aa3f-2d201889d141`,  // Grocery variant main (rice bags)
  coffeeMachine:    `${STORAGE}/0a7c7fa5-ed92-4783-a340-e1514a0be942`,  // Importer variant main (coffee machine)
  // Product card images (from home screen + similar products)
  headphones:       `${STORAGE}/d8b3afec-d168-4352-a941-562abcbc5d9f`,  // Wireless headphones
  smartwatch:       `${STORAGE}/a4bb52bc-6488-4494-a22d-91415bd0167e`,  // Smart fitness watch
  officeChairCard:  `${STORAGE}/fd96e89e-c377-4115-a20c-7296dac2ba83`,  // Office chair (card size)
  // Avatars & profiles
  supplierAvatar:   `${STORAGE}/8d5291ac-b694-403a-94fc-6d16421994ac`,  // Global Import Co. supplier
  sellerProfile:    `${STORAGE}/ceb2bf88-5f4a-4c2b-ae8a-0fe1a6081192`,  // Seller profile (golden abstract)
  grocerySupplier:  `${STORAGE}/6809012e-2022-424c-8a0a-b5fd32584651`,  // GreenMart supplier avatar
  importerSupplier: `${STORAGE}/b71ad660-57a4-4bec-b71a-a81f747a3127`,  // Global Trade Co. supplier avatar
};

// Avatars — use Convex storage supplier avatars + seller profile
const avatars = {
  user1: figmaImgs.supplierAvatar,     // Ahmed / seller avatar
  user2: figmaImgs.grocerySupplier,    // Fatima / grocery supplier
  user3: figmaImgs.importerSupplier,   // Karim / importer supplier
  user4: figmaImgs.sellerProfile,      // Nadia / seller profile (golden)
};

// Products — all from Convex storage, reusing across variants
const productImgs = {
  headphones:    figmaImgs.headphones,
  smartwatch:    figmaImgs.smartwatch,
  officeChair:   figmaImgs.officeChair,
  officeChairSm: figmaImgs.officeChairCard,
  groceryRice:   figmaImgs.groceryRice,
  coffeeMachine: figmaImgs.coffeeMachine,
  // Reuse product images for remaining products
  sneakers:      figmaImgs.smartwatch,       // reuse watch image as placeholder
  sofa:          figmaImgs.officeChair,       // reuse chair image
  skincare:      figmaImgs.coffeeMachine,     // reuse importer image
  perfume:       figmaImgs.headphones,        // reuse headphones image
  food:          figmaImgs.groceryRice,       // reuse rice image
  spices:        figmaImgs.groceryRice,       // reuse rice image
  lamp:          figmaImgs.officeChairCard,   // reuse chair card image
};

// Banners — Yassir banner from Convex storage
const bannerImgs = {
  banner1: figmaImgs.banner,
  banner2: figmaImgs.banner,       // reuse same banner
  banner3: figmaImgs.banner,       // reuse same banner
};

// Reels — product images from Convex storage
const reelImgs = {
  reel1: figmaImgs.officeChair,
  reel2: figmaImgs.headphones,
  reel3: figmaImgs.smartwatch,
  reel4: figmaImgs.coffeeMachine,
  reel5: figmaImgs.groceryRice,
};

// Wholesale — product images from Convex storage
const wholesaleImgs = {
  bulk1: figmaImgs.officeChair,
  bulk2: figmaImgs.smartwatch,
  bulk3: figmaImgs.headphones,
  bulk4: figmaImgs.groceryRice,
  bulk5: figmaImgs.coffeeMachine,
  bulk6: figmaImgs.officeChairCard,
};

// Transfer an image from a URL to production storage and update a banner record
export const transferBannerImage = internalAction({
  args: {},
  handler: async (ctx) => {
    const DEV_URL = "https://silent-chipmunk-103.eu-west-1.convex.cloud/api/storage/68352d85-3efc-44c1-8bcd-435f40c0c501";

    // Download image from dev storage
    const response = await fetch(DEV_URL);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const blob = await response.blob();

    // Upload to production storage
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get storage URL");

    // Update all banners that have the old broken URL
    await ctx.runMutation(internal.seed.fixBannerUrls, { newUrl: url });

    console.log(`Transferred banner image. New URL: ${url}`);
    return url;
  },
});

export const fixBannerUrls = internalMutation({
  args: { newUrl: v.string() },
  handler: async (ctx, args) => {
    const banners = await ctx.db.query("banners").collect();
    for (const banner of banners) {
      if (banner.imageUrl.includes("68352d85-3efc-44c1-8bcd-435f40c0c501")) {
        await ctx.db.patch(banner._id, { imageUrl: args.newUrl });
        console.log(`Updated banner ${banner._id} with new URL`);
      }
    }
  },
});

// Insert default banners (safe to run multiple times — skips if banners exist)
export const seedBanners = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("banners").collect();
    if (existing.length > 0) {
      console.log(`Banners already exist (${existing.length}). Skipping seed.`);
      return;
    }

    const banners = [
      {
        imageUrl: `${STORAGE}/68352d85-3efc-44c1-8bcd-435f40c0c501`,
        mediaType: "image" as const,
        title: "Yassir",
        titleArabic: "مع يسير بسر حياتك",
        subtitle: "تسوق بسهولة",
        isActive: true,
        sortOrder: 0,
      },
    ];

    for (const banner of banners) {
      await ctx.db.insert("banners", banner);
    }
    console.log(`Seeded ${banners.length} banners.`);
  },
});

// Clear content (products, services, reels) but keep users, orders, notifications
export const clearContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "products", "wholesaleProducts", "freelanceServices",
      "reels", "reelLikes", "reelComments",
      "offers", "bids", "demandRequests",
      "banners", "favorites", "cartItems", "clientRequests", "promotions",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      if (docs.length > 0) console.log(`  Cleared ${table}: ${docs.length} docs`);
    }
    console.log("Content cleared. Users, orders, and notifications preserved.");
  },
});

// One-shot migration: move any products in the B2C `products` table whose
// seller is a grossiste into the B2B `wholesaleProducts` table, then delete
// the original. Idempotent — safe to re-run.
export const migrateGrossisteProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let migrated = 0;
    let deletedReels = 0;

    for (const p of products) {
      const seller = await ctx.db.get(p.sellerId);
      if (!seller) continue;
      if (seller.sellerType !== "grossiste") continue;

      await ctx.db.insert("wholesaleProducts", {
        name: p.name,
        description: p.description,
        category: p.category,
        pricePerUnit: p.price,
        minOrder: p.minOrder ?? 1,
        imageUrl: p.imageUrl,
        images: p.images,
        supplierId: seller._id,
        supplierName: seller.name,
        supplierAvatar: seller.avatar,
        supplierLocation: p.supplierLocation ?? "Algiers",
        supplierRating: 0,
        supplierSellerType: "grossiste",
        rating: p.rating ?? 0,
        hasVideo: p.videoUrl ? true : undefined,
        tags: [],
        productType: p.productType,
      });

      // Drop any auto-created reels referencing this B2C product
      const reels = await ctx.db
        .query("reels")
        .filter((q) => q.eq(q.field("productId"), p._id))
        .collect();
      for (const r of reels) {
        await ctx.db.delete(r._id);
        deletedReels++;
      }

      await ctx.db.delete(p._id);
      migrated++;
    }

    console.log(
      `Migrated ${migrated} grossiste products → wholesaleProducts. ` +
        `Deleted ${deletedReels} associated reels.`
    );
    return { migrated, deletedReels };
  },
});

// Clear all tables so we can re-seed with updated images
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users", "products", "wholesaleProducts", "categories", "banners",
      "cartItems", "favorites", "orders", "offers", "bids", "reels",
      "reelLikes", "reelComments", "freelanceServices", "notifications",
      "demandRequests", "clientRequests", "promotions",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      if (docs.length > 0) console.log(`  Cleared ${table}: ${docs.length} docs`);
    }
    console.log("All tables cleared.");
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping. Run seed:clearAll first to re-seed.");
      return;
    }

    // --- Users ---
    const userIds: Record<string, Id<"users">> = {};

    userIds["1"] = await ctx.db.insert("users", {
      name: "Ahmed Benali",
      email: "ahmed.benali@email.com",
      avatar: avatars.user1,
      role: "customer",
    });

    userIds["2"] = await ctx.db.insert("users", {
      name: "Fatima Zahra",
      email: "fatima.zahra@email.com",
      avatar: avatars.user2,
      role: "seller",
      sellerType: "fournisseur",
    });

    userIds["3"] = await ctx.db.insert("users", {
      name: "Karim Hadj",
      email: "karim.hadj@email.com",
      avatar: avatars.user3,
      role: "freelancer",
    });

    userIds["4"] = await ctx.db.insert("users", {
      name: "Nadia Boumediene",
      email: "nadia.b@email.com",
      avatar: avatars.user4,
      role: "seller",
      sellerType: "importateur",
    });

    userIds["5"] = await ctx.db.insert("users", {
      name: "Omar Sellami",
      email: "omar.s@email.com",
      avatar: avatars.user1,
      role: "seller",
      sellerType: "grossiste",
    });

    // --- Categories ---
    const categoryData = [
      { slug: "all", label: "All", sortOrder: 0 },
      { slug: "electronics", label: "Electronics", sortOrder: 1 },
      { slug: "fashion", label: "Fashion", sortOrder: 2 },
      { slug: "home", label: "Home & Living", sortOrder: 3 },
      { slug: "b2b", label: "B2B Wholesale", sortOrder: 4 },
      { slug: "beauty", label: "Beauty", sortOrder: 5 },
      { slug: "food", label: "Food", sortOrder: 6 },
      { slug: "sports", label: "Sports", sortOrder: 7 },
    ];

    for (const cat of categoryData) {
      await ctx.db.insert("categories", cat);
    }

    // --- Banners ---
    const bannerData = [
      {
        imageUrl: bannerImgs.banner1,
        title: "Summer Sale",
        titleArabic: "تخفيضات الصيف",
        subtitle: "Up to 50% off",
        isActive: true,
        sortOrder: 0,
      },
      {
        imageUrl: bannerImgs.banner2,
        title: "New Arrivals",
        titleArabic: "وصل حديثا",
        subtitle: "Fresh picks for you",
        isActive: true,
        sortOrder: 1,
      },
      {
        imageUrl: bannerImgs.banner3,
        title: "Free Delivery",
        titleArabic: "توصيل مجاني",
        subtitle: "On orders over 5,000 DA",
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const banner of bannerData) {
      await ctx.db.insert("banners", banner);
    }

    // --- Products (matching Figma design) ---
    const productData = [
      // Express products
      { name: "Premium Office Chair Ergonomic Design", price: 6000, oldPrice: 7500, imageUrl: productImgs.officeChair, category: "home", brand: "HASIO", isNew: true, rating: 4.9, seller: "Global Import Co.", sellerId: userIds["2"], isActive: true, productType: "express" as const, tagline: "Restore. Strengthen. Shine.", reviewCount: 44, trustedCustomers: 1000, supplierLocation: "Algiers", description: "Upgrade your workspace with this ergonomic office chair designed for comfort and productivity.\nFeatures include adjustable lumbar support, 360° rotation, breathable mesh material, and reinforced wheels for smooth movement.\nIdeal for offices, startups, and home workspaces." },
      { name: "Wireless Headphones", price: 12900, oldPrice: 14900, imageUrl: productImgs.headphones, category: "electronics", brand: "HASIO", isNew: true, rating: 4.8, seller: "TechStore DZ", sellerId: userIds["2"], isActive: true, productType: "express" as const, tagline: "Crystal clear sound.", reviewCount: 120, trustedCustomers: 2000, supplierLocation: "Algiers" },
      { name: "Smart Fitness Watch", price: 18900, oldPrice: 22900, imageUrl: productImgs.smartwatch, category: "electronics", brand: "HASIO", isNew: true, rating: 4.5, seller: "GadgetWorld", sellerId: userIds["2"], isActive: true, productType: "express" as const, tagline: "Track your fitness goals.", reviewCount: 89, trustedCustomers: 1500, supplierLocation: "Oran" },
      { name: "Classic Sneakers", price: 6500, imageUrl: productImgs.sneakers, category: "fashion", brand: "UrbanStep", rating: 4.3, seller: "FashionHub", sellerId: userIds["2"], isActive: true, productType: "express" as const },
      { name: "Luxury Desk Lamp", price: 4200, imageUrl: productImgs.lamp, category: "home", brand: "LumiHome", rating: 4.6, seller: "HomeDeco DZ", sellerId: userIds["2"], isActive: true, productType: "express" as const },
      { name: "Modern Sofa Set", price: 85000, oldPrice: 95000, imageUrl: productImgs.sofa, category: "home", brand: "ComfortPlus", isNew: true, rating: 4.9, seller: "FurniturePro", sellerId: userIds["2"], isActive: true, productType: "express" as const },
      // Grocery products
      { name: "Premium Basmati Rice - 25kg", price: 5000, imageUrl: productImgs.groceryRice, category: "food", brand: "NatureBio", rating: 4.9, seller: "GreenMart", sellerId: userIds["2"], isActive: true, productType: "grocery" as const, tagline: "Restore. Strengthen. Shine.", badge: "Organic", reviewCount: 44, trustedCustomers: 1000, supplierLocation: "Algiers", stockQuantity: 120, expirationDate: "15 Dec 2026", storageCondition: "Store in cool & dry place\nTemperature 5-25°C", description: "This premium basmati rice is carefully selected and processed to ensure consistent quality and taste.\nPerfect for restaurants, catering services, and retail resellers.\nClean packaging ensures long shelf life and safe storage." },
      { name: "Gourmet Spice Set", price: 2800, imageUrl: productImgs.groceryRice, category: "food", brand: "SpiceMaster", rating: 4.5, seller: "SpiceWorld", sellerId: userIds["2"], isActive: true, productType: "grocery" as const, stockQuantity: 80, expirationDate: "20 Jun 2027", storageCondition: "Keep sealed in dry place" },
      // Importer products
      { name: "Industrial Coffee Machine Commercial Grade", price: 45000, imageUrl: productImgs.coffeeMachine, category: "electronics", brand: "ProTech", rating: 4.9, seller: "Global Trade Co.", sellerId: userIds["4"], isActive: true, productType: "importer" as const, tagline: "Restore. Strengthen. Shine.", badge: "Imported", reviewCount: 44, trustedCustomers: 1000, supplierLocation: "Dubai, UAE", minOrder: 5, specs: { power: "220V", capacity: "12L", warranty: "1 Year", material: "Stainless Steel" }, description: "Built for high-volume commercial use, this industrial coffee machine offers reliability, performance, and durability.\nSuitable for restaurants, hotels, coffee chains, and distributors.\nCustom branding available for bulk orders." },
      { name: "Skincare Set Premium", price: 3800, imageUrl: productImgs.coffeeMachine, category: "beauty", brand: "GlowUp", rating: 4.4, seller: "BeautyBox DZ", sellerId: userIds["4"], isActive: true, productType: "importer" as const, minOrder: 10, supplierLocation: "Paris, France", specs: { material: "Natural Ingredients", warranty: "6 Months" } },
      { name: "Perfume Collection", price: 15000, oldPrice: 18000, imageUrl: productImgs.perfume, category: "beauty", brand: "ScentAura", isNew: true, rating: 4.8, seller: "ParfumShop", sellerId: userIds["2"], isActive: true, productType: "express" as const },
      { name: "Yoga Mat Premium", price: 3200, oldPrice: 4500, imageUrl: productImgs.smartwatch, category: "sports", brand: "ZenFlex", isNew: true, rating: 4.4, seller: "SportLife", sellerId: userIds["2"], isActive: true, productType: "express" as const },
    ];

    const productIds: Record<string, Id<"products">> = {};
    for (let i = 0; i < productData.length; i++) {
      productIds[String(i + 1)] = await ctx.db.insert("products", productData[i]);
    }

    // --- Wholesale Products ---
    const supplierMap = [
      { id: "s1", userId: userIds["2"], name: "Global Import Co.", avatar: avatars.user2, location: "Algiers", rating: 4.7 },
      { id: "s2", userId: userIds["3"], name: "DZ Import Export", avatar: avatars.user3, location: "Oran", rating: 4.6 },
      { id: "s3", userId: userIds["4"], name: "Sahara Goods", avatar: avatars.user4, location: "Constantine", rating: 4.7 },
      { id: "s4", userId: userIds["5"], name: "MediterraneanTrade", avatar: avatars.user1, location: "Algiers", rating: 4.9 },
    ];

    const wholesaleData = [
      { name: "Premium Olive Oil Bulk Supply", pricePerUnit: 1200, minOrder: 24, imageUrl: wholesaleImgs.bulk1, supplier: supplierMap[0], rating: 4.7, hasVideo: true, tags: ["Express"] },
      { name: "Smart Fitness Watch Bulk", pricePerUnit: 15000, minOrder: 10, imageUrl: wholesaleImgs.bulk2, supplier: supplierMap[0], rating: 4.7, tags: ["Express"] },
      { name: "Wireless Headphones Bulk", pricePerUnit: 8500, minOrder: 20, imageUrl: wholesaleImgs.bulk3, supplier: supplierMap[0], rating: 4.7, hasVideo: true, tags: ["Express"] },
      { name: "Olive Oil Premium (Box of 12)", pricePerUnit: 850, minOrder: 24, imageUrl: wholesaleImgs.bulk4, supplier: supplierMap[1], rating: 4.6, tags: ["Best Seller"] },
      { name: "Cotton Bedding Set", pricePerUnit: 4500, minOrder: 8, imageUrl: wholesaleImgs.bulk5, supplier: supplierMap[2], rating: 4.7, tags: ["Premium"] },
      { name: "Spice Mix Assortment", pricePerUnit: 600, minOrder: 30, imageUrl: wholesaleImgs.bulk6, supplier: supplierMap[3], rating: 4.8, tags: ["Best Seller"] },
    ];

    for (const wp of wholesaleData) {
      await ctx.db.insert("wholesaleProducts", {
        name: wp.name,
        pricePerUnit: wp.pricePerUnit,
        minOrder: wp.minOrder,
        imageUrl: wp.imageUrl,
        supplierId: wp.supplier.userId,
        supplierName: wp.supplier.name,
        supplierAvatar: wp.supplier.avatar,
        supplierLocation: wp.supplier.location,
        supplierRating: wp.supplier.rating,
        rating: wp.rating,
        hasVideo: wp.hasVideo,
        tags: wp.tags,
      });
    }

    // --- Freelance Services ---
    const freelanceData = [
      { title: "Logo & Brand Identity Design", description: "Professional logo design with full brand guidelines", price: 15000, category: "Design", rating: 4.9, completedJobs: 47, imageUrl: productImgs.headphones, images: [productImgs.headphones, productImgs.smartwatch, productImgs.officeChairSm] },
      { title: "E-commerce Website Development", description: "Full-stack e-commerce site with payment integration", price: 80000, category: "Development", rating: 4.8, completedJobs: 23, imageUrl: productImgs.smartwatch, images: [productImgs.smartwatch, productImgs.headphones] },
      { title: "Social Media Marketing", description: "Monthly social media management and content creation", price: 25000, category: "Marketing", rating: 4.7, completedJobs: 56, imageUrl: productImgs.officeChair, images: [productImgs.officeChair, productImgs.coffeeMachine, productImgs.headphones, productImgs.smartwatch] },
      { title: "Product Photography", description: "Professional product photos for e-commerce listings", price: 10000, category: "Photography", rating: 5.0, completedJobs: 89, imageUrl: productImgs.sneakers, images: [productImgs.sneakers, productImgs.groceryRice, productImgs.coffeeMachine] },
      { title: "Promotional Video Production", description: "Short-form video ads for social media campaigns", price: 35000, category: "Video", rating: 4.6, completedJobs: 31, imageUrl: productImgs.skincare, images: [productImgs.skincare] },
      { title: "SEO Content Writing", description: "Blog posts and articles optimized for search engines", price: 5000, category: "Writing", rating: 4.8, completedJobs: 112, imageUrl: productImgs.food, images: [productImgs.food, productImgs.officeChairSm] },
    ];

    for (const fs of freelanceData) {
      await ctx.db.insert("freelanceServices", {
        ...fs,
        freelancerId: userIds["3"],
        freelancerName: "Karim Hadj",
        freelancerAvatar: avatars.user3,
      });
    }

    // --- Reels (office chair reel by "Boceiri Ridha") ---
    const reelData = [
      { thumbnailUrl: reelImgs.reel1, posterName: "Boceiri Ridha", productName: "Ergonomic Office Chair", productId: productIds["3"], price: 18900, likes: 657, comments: 657, shares: 657, posterId: userIds["2"], posterRole: "fournisseur" as const, posterAvatar: figmaImgs.sellerProfile, createdAt: Date.now() - 5 * 86400000 },
      { thumbnailUrl: reelImgs.reel2, posterName: "TechStore DZ", productName: "Wireless Headphones", productId: productIds["1"], price: 12900, likes: 2340, comments: 156, shares: 89, posterId: userIds["2"], posterRole: "fournisseur" as const, posterAvatar: avatars.user2, createdAt: Date.now() - 4 * 86400000 },
      { thumbnailUrl: reelImgs.reel3, posterName: "GadgetWorld", productName: "Smart Fitness Watch", productId: productIds["2"], price: 18900, likes: 4500, comments: 234, shares: 178, posterId: userIds["3"], posterRole: "freelancer" as const, posterAvatar: avatars.user3, createdAt: Date.now() - 3 * 86400000 },
      { thumbnailUrl: reelImgs.reel4, posterName: "FashionHub", productName: "Classic Sneakers", productId: productIds["4"], price: 6500, likes: 5670, comments: 342, shares: 210, posterId: userIds["3"], posterRole: "freelancer" as const, posterAvatar: avatars.user3, createdAt: Date.now() - 2 * 86400000 },
      { thumbnailUrl: reelImgs.reel5, posterName: "BeautyBox DZ", productName: "Skincare Set Premium", productId: productIds["7"], price: 3800, likes: 8900, comments: 567, shares: 320, posterId: userIds["4"], posterRole: "importateur" as const, posterAvatar: avatars.user4, createdAt: Date.now() - 1 * 86400000 },
    ];

    for (const reel of reelData) {
      await ctx.db.insert("reels", reel);
    }

    // --- Orders ---
    const orderData = [
      {
        buyerId: userIds["1"],
        buyerName: "Ahmed Benali",
        sellerId: userIds["2"],
        sellerName: "Fatima Zahra",
        items: [
          { productId: "p1", productName: "Huile d'olive extra vierge", productImage: figmaImgs.groceryRice, price: 3500, quantity: 2 },
          { productId: "p2", productName: "Dattes Deglet Nour 1kg", productImage: figmaImgs.groceryRice, price: 2800, quantity: 1 },
        ],
        shippingAddress: { fullName: "Ahmed Benali", phone: "+213 555 123 456", address: "12 Rue Didouche Mourad", city: "Alger" },
        status: "delivered" as const,
        total: 9800,
        itemCount: 3,
        createdAt: new Date("2026-02-10").getTime(),
        updatedAt: new Date("2026-02-14").getTime(),
      },
      {
        buyerId: userIds["1"],
        buyerName: "Ahmed Benali",
        sellerId: userIds["2"],
        sellerName: "Fatima Zahra",
        items: [
          { productId: "p3", productName: "Savon noir traditionnel", productImage: figmaImgs.coffeeMachine, price: 1500, quantity: 3 },
        ],
        shippingAddress: { fullName: "Ahmed Benali", phone: "+213 555 123 456", address: "12 Rue Didouche Mourad", city: "Alger" },
        status: "shipped" as const,
        total: 4500,
        itemCount: 3,
        createdAt: new Date("2026-02-12").getTime(),
        updatedAt: new Date("2026-02-13").getTime(),
      },
      {
        buyerId: userIds["1"],
        buyerName: "Ahmed Benali",
        sellerId: userIds["2"],
        sellerName: "Fatima Zahra",
        items: [
          { productId: "p4", productName: "Tapis berbère fait main", productImage: figmaImgs.officeChair, price: 25000, quantity: 1 },
          { productId: "p5", productName: "Poterie artisanale", productImage: figmaImgs.headphones, price: 4500, quantity: 2 },
        ],
        shippingAddress: { fullName: "Ahmed Benali", phone: "+213 555 123 456", address: "12 Rue Didouche Mourad", city: "Alger" },
        status: "pending" as const,
        total: 34000,
        itemCount: 3,
        createdAt: new Date("2026-02-15").getTime(),
        updatedAt: new Date("2026-02-15").getTime(),
      },
    ];

    for (const order of orderData) {
      await ctx.db.insert("orders", order);
    }

    // --- Offers ---
    const offerIds: Record<string, Id<"offers">> = {};

    offerIds["OFF-001"] = await ctx.db.insert("offers", {
      type: "auction",
      title: "Olive Oil Bulk - 500L",
      description: "Looking for premium extra virgin olive oil. Kabylie or Jijel origin preferred. Must include lab certification.",
      productName: "Olive Oil",
      quantity: 500,
      unit: "liters",
      creatorId: userIds["4"],
      creatorName: "Nadia Boumediene",
      status: "open",
      deadline: "2026-02-28",
      minPrice: 350000,
      currentBestBid: 380000,
      bidCount: 2,
      createdAt: new Date("2026-02-10").getTime(),
    });

    offerIds["OFF-002"] = await ctx.db.insert("offers", {
      type: "negotiable",
      title: "Handmade Ceramic Sets - 200 pcs",
      description: "Traditional Algerian ceramic dining sets for retail distribution. Need consistent quality across all pieces.",
      productName: "Ceramic Sets",
      quantity: 200,
      unit: "pieces",
      creatorId: userIds["4"],
      creatorName: "Nadia Boumediene",
      status: "open",
      deadline: "2026-03-05",
      minPrice: 180000,
      currentBestBid: 210000,
      bidCount: 1,
      createdAt: new Date("2026-02-08").getTime(),
    });

    offerIds["OFF-003"] = await ctx.db.insert("offers", {
      type: "auction",
      title: "Organic Dates - 100 boxes",
      description: "Deglet Nour premium grade for export. Must meet EU organic standards. Packaging included.",
      productName: "Organic Dates",
      quantity: 100,
      unit: "boxes",
      creatorId: userIds["5"],
      creatorName: "Omar Sellami",
      status: "closed",
      deadline: "2026-02-15",
      minPrice: 280000,
      currentBestBid: 320000,
      bidCount: 2,
      createdAt: new Date("2026-02-01").getTime(),
    });

    offerIds["OFF-004"] = await ctx.db.insert("offers", {
      type: "negotiable",
      title: "Cotton Textiles - 500m",
      description: "High-quality cotton fabric rolls for garment manufacturing. White and natural colors.",
      productName: "Cotton Textiles",
      quantity: 500,
      unit: "meters",
      creatorId: userIds["4"],
      creatorName: "Nadia Boumediene",
      status: "expired",
      deadline: "2026-02-01",
      minPrice: 150000,
      bidCount: 0,
      createdAt: new Date("2026-01-20").getTime(),
    });

    offerIds["OFF-005"] = await ctx.db.insert("offers", {
      type: "auction",
      title: "Leather Goods - 300 pcs",
      description: "Assorted leather bags and wallets for boutique distribution. Premium quality required.",
      productName: "Leather Goods",
      quantity: 300,
      unit: "pieces",
      creatorId: userIds["5"],
      creatorName: "Omar Sellami",
      status: "open",
      deadline: "2026-03-10",
      minPrice: 400000,
      currentBestBid: 450000,
      bidCount: 1,
      createdAt: new Date("2026-02-14").getTime(),
    });

    // --- Bids ---
    const bidData = [
      { offerId: offerIds["OFF-001"], bidderId: userIds["5"], bidderName: "Omar Sellami", amount: 380000, message: "Premium Kabylie origin, certified organic. Can deliver in 5 days.", status: "pending" as const, createdAt: new Date("2026-02-13").getTime() },
      { offerId: offerIds["OFF-001"], bidderId: userIds["2"], bidderName: "Fatima Zahra", amount: 395000, message: "Jijel extra virgin, lab tested. Free shipping above 400L.", status: "pending" as const, createdAt: new Date("2026-02-14").getTime() },
      { offerId: offerIds["OFF-002"], bidderId: userIds["5"], bidderName: "Omar Sellami", amount: 210000, message: "Handmade in Tizi Ouzou. Samples available on request.", status: "pending" as const, createdAt: new Date("2026-02-12").getTime() },
      { offerId: offerIds["OFF-003"], bidderId: userIds["4"], bidderName: "Nadia Boumediene", amount: 320000, message: "Biskra Deglet Nour, EU certified. Ready for immediate shipment.", status: "accepted" as const, createdAt: new Date("2026-02-05").getTime() },
      { offerId: offerIds["OFF-003"], bidderId: userIds["2"], bidderName: "Fatima Zahra", amount: 305000, message: "Tolga origin, organic certified. 2 weeks lead time.", status: "rejected" as const, createdAt: new Date("2026-02-06").getTime() },
      { offerId: offerIds["OFF-005"], bidderId: userIds["4"], bidderName: "Nadia Boumediene", amount: 450000, message: "Genuine leather, handcrafted in Ghardaia. Portfolio available.", status: "pending" as const, createdAt: new Date("2026-02-16").getTime() },
    ];

    for (const bid of bidData) {
      await ctx.db.insert("bids", bid);
    }

    // --- Demand Requests ---
    const demandData = [
      { title: "Logo Design for Restaurant", buyerName: "Karim M.", budget: 15000, status: "new" as const, deadline: "2026-02-28", createdAt: new Date("2026-02-14").getTime() },
      { title: "Social Media Management", buyerName: "Sara B.", budget: 25000, status: "in_progress" as const, deadline: "2026-03-15", createdAt: new Date("2026-02-12").getTime() },
      { title: "Website Development", buyerName: "Omar T.", budget: 80000, status: "completed" as const, deadline: "2026-03-01", createdAt: new Date("2026-02-01").getTime() },
      { title: "Product Photography", buyerName: "Lina K.", budget: 10000, status: "new" as const, deadline: "2026-02-25", createdAt: new Date("2026-02-15").getTime() },
      { title: "Brand Identity Package", buyerName: "Youcef A.", budget: 45000, status: "in_progress" as const, deadline: "2026-03-10", createdAt: new Date("2026-02-09").getTime() },
    ];

    for (const dr of demandData) {
      await ctx.db.insert("demandRequests", dr);
    }

    // --- Notifications (sample) ---
    const notificationData = [
      { type: "order_placed" as const, title: "New Order", message: "You received a new order from Ahmed Benali", relatedId: "ORD-103", userId: userIds["2"], read: false, createdAt: new Date("2026-02-15").getTime() },
      { type: "order_status_changed" as const, title: "Order Shipped", message: "Your order ORD-102 has been shipped", relatedId: "ORD-102", userId: userIds["1"], read: true, createdAt: new Date("2026-02-13").getTime() },
      { type: "bid_received" as const, title: "New Bid", message: "Omar Sellami placed a bid on your Olive Oil offer", relatedId: "OFF-001", userId: userIds["4"], read: false, createdAt: new Date("2026-02-13").getTime() },
      { type: "bid_accepted" as const, title: "Bid Accepted", message: "Your bid on Organic Dates was accepted!", relatedId: "OFF-003", userId: userIds["4"], read: true, createdAt: new Date("2026-02-07").getTime() },
      { type: "bid_rejected" as const, title: "Bid Rejected", message: "Your bid on Organic Dates was not selected", relatedId: "OFF-003", userId: userIds["2"], read: false, createdAt: new Date("2026-02-07").getTime() },
    ];

    for (const notif of notificationData) {
      await ctx.db.insert("notifications", notif);
    }

    // --- Client Requests (for freelancers) ---
    const clientRequestData = [
      { freelancerId: userIds["3"], clientName: "Sara Boumediene", clientAvatar: avatars.user2, title: "E-commerce Website Redesign", description: "Need a complete redesign of our online store with mobile-first approach.", budget: 95000, deliveryTime: "3 weeks", status: "new" as const, createdAt: new Date("2026-02-18").getTime() },
      { freelancerId: userIds["3"], clientName: "Yacine Khelifi", clientAvatar: avatars.user1, title: "Brand Identity Package", description: "Logo, business cards, and social media kit for a new restaurant.", budget: 45000, deliveryTime: "2 weeks", status: "in_progress" as const, createdAt: new Date("2026-02-10").getTime() },
      { freelancerId: userIds["3"], clientName: "Lina Mansouri", clientAvatar: avatars.user4, title: "Product Photography Session", description: "30 product photos for jewelry brand catalog.", budget: 20000, deliveryTime: "5 days", status: "completed" as const, finalAmount: 22000, completedAt: new Date("2026-02-15").getTime(), createdAt: new Date("2026-02-05").getTime() },
      { freelancerId: userIds["3"], clientName: "Omar Bensalem", clientAvatar: avatars.user3, title: "Social Media Management", description: "Monthly content calendar + daily posts for fitness brand.", budget: 30000, deliveryTime: "1 month", status: "new" as const, createdAt: new Date("2026-02-20").getTime() },
    ];

    for (const cr of clientRequestData) {
      await ctx.db.insert("clientRequests", cr);
    }

    console.log("Seed completed successfully!");
    console.log(`  Users: 5`);
    console.log(`  Categories: ${categoryData.length}`);
    console.log(`  Banners: ${bannerData.length}`);
    console.log(`  Products: ${productData.length}`);
    console.log(`  Wholesale Products: ${wholesaleData.length}`);
    console.log(`  Freelance Services: ${freelanceData.length}`);
    console.log(`  Reels: ${reelData.length}`);
    console.log(`  Orders: ${orderData.length}`);
    console.log(`  Offers: ${Object.keys(offerIds).length}`);
    console.log(`  Bids: ${bidData.length}`);
    console.log(`  Demand Requests: ${demandData.length}`);
    console.log(`  Notifications: ${notificationData.length}`);
  },
});
