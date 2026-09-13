import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatar: v.string(),
    role: v.union(v.literal("customer"), v.literal("seller"), v.literal("freelancer"), v.literal("admin")),
    sellerType: v.optional(
      v.union(v.literal("fournisseur"), v.literal("importateur"), v.literal("grossiste"))
    ),
    expoPushToken: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  })
    .index("email", ["email"])
    .index("role", ["role"]),

  products: defineTable({
    name: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
    brand: v.optional(v.string()),
    oldPrice: v.optional(v.number()),
    isNew: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    description: v.optional(v.string()),
    seller: v.optional(v.string()),
    sellerId: v.id("users"),
    isActive: v.boolean(),
    // Extended fields for product variants
    tagline: v.optional(v.string()),
    reviewCount: v.optional(v.number()),
    trustedCustomers: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    expirationDate: v.optional(v.string()),
    storageCondition: v.optional(v.string()),
    specs: v.optional(
      v.object({
        power: v.optional(v.string()),
        capacity: v.optional(v.string()),
        warranty: v.optional(v.string()),
        material: v.optional(v.string()),
      })
    ),
    minOrder: v.optional(v.number()),
    supplierLocation: v.optional(v.string()),
    badge: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
  })
    .index("category", ["category"])
    .index("sellerId", ["sellerId"])
    .index("isActive_isNew", ["isActive", "isNew"])
    .index("isActive", ["isActive"])
    .searchIndex("search_name", { searchField: "name" }),

  wholesaleProducts: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    pricePerUnit: v.number(),
    minOrder: v.number(),
    imageUrl: v.string(),
    images: v.optional(v.array(v.string())),
    supplierId: v.id("users"),
    supplierName: v.string(),
    supplierAvatar: v.string(),
    supplierLocation: v.string(),
    supplierRating: v.number(),
    supplierSellerType: v.optional(
      v.union(v.literal("grossiste"), v.literal("importateur"))
    ),
    rating: v.number(),
    hasVideo: v.optional(v.boolean()),
    videoUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    productType: v.optional(
      v.union(v.literal("express"), v.literal("grocery"), v.literal("importer"))
    ),
  })
    .index("supplierId", ["supplierId"])
    .index("supplierLocation", ["supplierLocation"])
    .index("category", ["category"])
    .index("productType", ["productType"]),

  categories: defineTable({
    slug: v.string(),
    label: v.string(),
    sortOrder: v.number(),
  }).index("slug", ["slug"]),

  banners: defineTable({
    imageUrl: v.string(),
    videoUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("gif"))),
    title: v.string(),
    titleArabic: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
  })
    .index("isActive", ["isActive"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.optional(v.id("products")),
    wholesaleProductId: v.optional(v.id("wholesaleProducts")),
    isWholesale: v.optional(v.boolean()),
    quantity: v.number(),
  })
    .index("userId", ["userId"])
    .index("userId_productId", ["userId", "productId"])
    .index("userId_wholesaleProductId", ["userId", "wholesaleProductId"]),

  favorites: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("userId", ["userId"])
    .index("userId_productId", ["userId", "productId"]),

  orders: defineTable({
    // Nullable after account deletion (anonymized — see users.deleteAccount).
    buyerId: v.union(v.id("users"), v.null()),
    buyerName: v.string(),
    sellerId: v.union(v.id("users"), v.null()),
    sellerName: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        productImage: v.string(),
        price: v.number(),
        quantity: v.number(),
      })
    ),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      wilayaCode: v.optional(v.string()),
      wilayaName: v.optional(v.string()),
      commune: v.optional(v.string()),
    }),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
    total: v.number(),
    itemCount: v.number(),
    paymentMethod: v.optional(v.literal("cod")),
    orderType: v.optional(v.union(v.literal("b2c"), v.literal("wholesale"))),
    // Delivery integration fields
    deliveryProvider: v.optional(v.union(v.literal("yalidine"), v.literal("zrexpress"), v.literal("maystro"))),
    trackingNumber: v.optional(v.string()),
    shipmentId: v.optional(v.id("shipments")),
    deliveryFee: v.optional(v.number()),
    isStopDesk: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("buyerId", ["buyerId"])
    .index("sellerId", ["sellerId"])
    .index("status", ["status"]),

  offers: defineTable({
    type: v.union(v.literal("auction"), v.literal("negotiable")),
    title: v.string(),
    description: v.string(),
    productName: v.string(),
    quantity: v.number(),
    unit: v.string(),
    creatorId: v.id("users"),
    creatorName: v.string(),
    phone: v.optional(v.string()),
    creatorSellerType: v.optional(
      v.union(v.literal("importateur"), v.literal("grossiste"))
    ),
    status: v.union(v.literal("open"), v.literal("closed"), v.literal("expired")),
    deadline: v.string(),
    minPrice: v.number(),
    category: v.optional(v.string()),
    currentBestBid: v.optional(v.number()),
    bidCount: v.number(),
    createdAt: v.number(),
  })
    .index("creatorId", ["creatorId"])
    .index("status", ["status"]),

  bids: defineTable({
    offerId: v.id("offers"),
    bidderId: v.id("users"),
    bidderName: v.string(),
    phone: v.optional(v.string()),
    amount: v.number(),
    message: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("offerId", ["offerId"])
    .index("bidderId", ["bidderId"])
    .index("offerId_status", ["offerId", "status"]),

  reels: defineTable({
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.string(),
    posterId: v.id("users"),
    posterName: v.string(),
    posterRole: v.union(
      v.literal("customer"),
      v.literal("fournisseur"),
      v.literal("importateur"),
      v.literal("grossiste"),
      v.literal("freelancer"),
      v.literal("admin")
    ),
    posterAvatar: v.string(),
    productId: v.optional(v.id("products")),
    productName: v.string(),
    price: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    createdAt: v.number(),
  })
    .index("posterId", ["posterId"])
    .index("createdAt", ["createdAt"]),

  reelLikes: defineTable({
    reelId: v.id("reels"),
    userId: v.id("users"),
  })
    .index("reelId", ["reelId"])
    .index("reelId_userId", ["reelId", "userId"]),

  reelComments: defineTable({
    reelId: v.id("reels"),
    userId: v.id("users"),
    userName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("reelId", ["reelId"])
    .index("userId", ["userId"]),

  freelanceServices: defineTable({
    title: v.string(),
    description: v.string(),
    price: v.number(),
    freelancerId: v.id("users"),
    freelancerName: v.string(),
    freelancerAvatar: v.string(),
    category: v.string(),
    rating: v.number(),
    completedJobs: v.number(),
    imageUrl: v.string(),
    images: v.optional(v.array(v.string())),
    videoUrl: v.optional(v.string()),
  })
    .index("freelancerId", ["freelancerId"])
    .index("category", ["category"])
    .searchIndex("search_title", { searchField: "title", filterFields: ["category"] }),

  notifications: defineTable({
    type: v.union(
      v.literal("order_placed"),
      v.literal("order_status_changed"),
      v.literal("bid_received"),
      v.literal("bid_accepted"),
      v.literal("bid_rejected"),
      v.literal("offer_closed"),
      v.literal("service_request_received"),
      v.literal("service_request_accepted"),
      v.literal("service_request_completed"),
      v.literal("service_request_declined"),
      v.literal("demand_response_received"),
      v.literal("demand_response_accepted"),
      v.literal("demand_response_declined"),
      v.literal("reel_comment"),
      v.literal("stock_depleted"),
      v.literal("shipment_created"),
      v.literal("shipment_delivered"),
      v.literal("shipment_failed"),
      v.literal("message_received"),
      v.literal("report_submitted"),
      v.literal("report_received"),
      v.literal("content_removed")
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.string(),
    userId: v.id("users"),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userId_read", ["userId", "read"]),

  demandRequests: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    buyerName: v.string(),
    userId: v.optional(v.id("users")),
    phone: v.optional(v.string()),
    budget: v.number(),
    deadline: v.string(),
    category: v.optional(v.string()),
    creatorSellerType: v.optional(
      v.union(v.literal("importateur"), v.literal("grossiste"))
    ),
    responseCount: v.optional(v.number()),
    status: v.union(v.literal("new"), v.literal("in_progress"), v.literal("completed")),
    createdAt: v.number(),
  })
    .index("status", ["status"])
    .index("userId", ["userId"]),

  demandResponses: defineTable({
    demandId: v.id("demandRequests"),
    responderId: v.id("users"),
    responderName: v.string(),
    phone: v.string(),
    message: v.string(),
    priceQuote: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("demandId", ["demandId"])
    .index("responderId", ["responderId"])
    .index("demandId_status", ["demandId", "status"])
    .index("responderId_demandId", ["responderId", "demandId"]),

  imageAssets: defineTable({
    urls: v.any(),
    updatedAt: v.number(),
  }),

  clientRequests: defineTable({
    freelancerId: v.id("users"),
    clientId: v.optional(v.id("users")),
    clientName: v.string(),
    clientAvatar: v.string(),
    phone: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    budget: v.number(),
    deliveryTime: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("declined")
    ),
    finalAmount: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("freelancerId", ["freelancerId"])
    .index("freelancerId_status", ["freelancerId", "status"])
    .index("clientId", ["clientId"]),

  promotions: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    category: v.string(),
    priceLow: v.number(),
    priceHigh: v.number(),
    deliveryTime: v.string(),
    creatorId: v.id("users"),
    creatorName: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("expired")),
    createdAt: v.number(),
    // Product-linked promotion fields
    productId: v.optional(v.id("products")),
    price: v.optional(v.number()),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("creatorId", ["creatorId"])
    .index("status", ["status"])
    .index("productId", ["productId"]),

  // --- Recommendation Engine ---

  userEvents: defineTable({
    userId: v.id("users"),
    eventType: v.union(
      v.literal("product_view"),
      v.literal("reel_view"),
      v.literal("reel_watch"),
      v.literal("service_view"),
      v.literal("search_query"),
      v.literal("category_browse"),
      v.literal("add_to_cart"),
      v.literal("purchase"),
      v.literal("favorite_add"),
      v.literal("reel_like"),
      v.literal("reel_comment"),
      v.literal("reel_share"),
      v.literal("service_request"),
      v.literal("promotion_view"),
      v.literal("promotion_click")
    ),
    targetProductId: v.optional(v.id("products")),
    targetReelId: v.optional(v.id("reels")),
    targetServiceId: v.optional(v.id("freelanceServices")),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    pricePoint: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("userId_createdAt", ["userId", "createdAt"])
    .index("userId_eventType", ["userId", "eventType"])
    .index("userId_eventType_createdAt", ["userId", "eventType", "createdAt"])
    .index("createdAt", ["createdAt"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    categoryWeights: v.any(), // Record<string, number>
    serviceCategoryWeights: v.optional(v.any()), // Record<string, number>
    avgPricePoint: v.optional(v.number()),
    priceRangeLow: v.optional(v.number()),
    priceRangeHigh: v.optional(v.number()),
    favoriteCategories: v.optional(v.array(v.string())), // top 3
    recentSearchTerms: v.optional(v.array(v.string())), // last 10
    totalProductViews: v.optional(v.number()),
    totalReelViews: v.optional(v.number()),
    totalServiceViews: v.optional(v.number()),
    totalPurchases: v.optional(v.number()),
    recentlyViewedProductIds: v.optional(v.array(v.string())), // last 50
    recentlyViewedReelIds: v.optional(v.array(v.string())), // last 30
    recentlyViewedServiceIds: v.optional(v.array(v.string())), // last 20
    updatedAt: v.number(),
  })
    .index("userId", ["userId"]),

  contentPopularity: defineTable({
    contentType: v.union(
      v.literal("product"),
      v.literal("reel"),
      v.literal("service")
    ),
    contentId: v.string(),
    viewCount24h: v.optional(v.number()),
    viewCount7d: v.optional(v.number()),
    engagementScore: v.number(),
    trendingScore: v.number(),
    updatedAt: v.number(),
  })
    .index("contentType_trendingScore", ["contentType", "trendingScore"])
    .index("contentType_engagementScore", ["contentType", "engagementScore"])
    .index("contentId", ["contentId"]),

  // --- Messaging ---

  conversations: defineTable({
    // Nullable after account deletion (anonymized — see users.deleteAccount).
    participant1Id: v.union(v.id("users"), v.null()),
    participant2Id: v.union(v.id("users"), v.null()),
    participant1Name: v.string(),
    participant1Avatar: v.string(),
    participant2Name: v.string(),
    participant2Avatar: v.string(),
    contextType: v.union(
      v.literal("product"),
      v.literal("order"),
      v.literal("service"),
      v.literal("offer"),
      v.literal("wholesaleProduct")
    ),
    contextId: v.string(),
    contextTitle: v.string(),
    lastMessageText: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.id("users")),
    lastMessageAt: v.optional(v.number()),
    participant1Unread: v.number(),
    participant2Unread: v.number(),
    createdAt: v.number(),
  })
    .index("participant1Id", ["participant1Id"])
    .index("participant2Id", ["participant2Id"])
    .index("dedup", ["participant1Id", "participant2Id", "contextType", "contextId"])
    .index("participant1_lastMessage", ["participant1Id", "lastMessageAt"])
    .index("participant2_lastMessage", ["participant2Id", "lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    // Nullable after account deletion (anonymized — see users.deleteAccount).
    senderId: v.union(v.id("users"), v.null()),
    senderName: v.string(),
    text: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("conversationId_createdAt", ["conversationId", "createdAt"])
    .index("conversationId_isRead_senderId", ["conversationId", "isRead", "senderId"]),

  // --- Delivery Integration ---

  deliverySettings: defineTable({
    sellerId: v.id("users"),
    provider: v.union(v.literal("yalidine"), v.literal("zrexpress"), v.literal("maystro")),
    apiKey: v.string(),
    apiId: v.optional(v.string()),
    isActive: v.boolean(),
    pickupWilayaCode: v.optional(v.string()),
    pickupWilayaName: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sellerId", ["sellerId"])
    .index("sellerId_provider", ["sellerId", "provider"]),

  shipments: defineTable({
    orderId: v.id("orders"),
    sellerId: v.id("users"),
    provider: v.union(v.literal("yalidine"), v.literal("zrexpress"), v.literal("maystro")),
    externalId: v.string(),
    trackingNumber: v.string(),
    providerStatus: v.string(),
    mappedOrderStatus: v.union(v.literal("processing"), v.literal("shipped"), v.literal("delivered")),
    deliveryFee: v.optional(v.number()),
    isStopDesk: v.optional(v.boolean()),
    labelUrl: v.optional(v.string()),
    lastCheckedAt: v.number(),
    history: v.optional(v.array(v.object({
      status: v.string(),
      date: v.string(),
      location: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("orderId", ["orderId"])
    .index("sellerId", ["sellerId"])
    .index("provider_externalId", ["provider", "externalId"])
    .index("mappedOrderStatus", ["mappedOrderStatus"]),

  // --- Moderation ---

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("reel"),
      v.literal("reelComment"),
      v.literal("product"),
      v.literal("wholesaleProduct"),
      v.literal("freelanceService"),
      v.literal("offer"),
      v.literal("demandRequest"),
      v.literal("user")
    ),
    targetId: v.string(),
    targetOwnerId: v.optional(v.id("users")),
    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("hate"),
      v.literal("violence"),
      v.literal("sexual"),
      v.literal("illegal"),
      v.literal("intellectual_property"),
      v.literal("scam"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("dismissed"),
      v.literal("action_taken")
    ),
    adminNotes: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("status", ["status"])
    .index("reporterId", ["reporterId"])
    .index("targetOwnerId", ["targetOwnerId"])
    .index("targetType_targetId", ["targetType", "targetId"])
    .index("reporterId_targetType_targetId", ["reporterId", "targetType", "targetId"]),

  userBlocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("blockerId", ["blockerId"])
    .index("blockedId", ["blockedId"])
    .index("blockerId_blockedId", ["blockerId", "blockedId"]),
});
