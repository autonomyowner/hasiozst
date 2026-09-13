import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedAppUser } from "./auth";
import { getProvider } from "./deliveryProviders";

const deliveryProviderValidator = v.union(
  v.literal("yalidine"),
  v.literal("zrexpress"),
  v.literal("maystro")
);

// --- Queries ---

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("deliverySettings")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .collect();
  },
});

export const getShipmentByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const shipment = await ctx.db
      .query("shipments")
      .withIndex("orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!shipment) return null;

    // Only buyer or seller can see shipment
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.buyerId !== user._id && order.sellerId !== user._id) return null;

    return shipment;
  },
});

export const listShipmentsBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("shipments")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(100);
  },
});

// --- Mutations ---

export const saveSettings = mutation({
  args: {
    provider: deliveryProviderValidator,
    apiKey: v.string(),
    apiId: v.optional(v.string()),
    pickupWilayaCode: v.optional(v.string()),
    pickupWilayaName: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller" && user.role !== "admin") throw new Error("Not a seller");

    if (!args.apiKey.trim()) throw new Error("API key is required");

    const existing = await ctx.db
      .query("deliverySettings")
      .withIndex("sellerId_provider", (q) =>
        q.eq("sellerId", user._id).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        apiId: args.apiId,
        isActive: true,
        pickupWilayaCode: args.pickupWilayaCode,
        pickupWilayaName: args.pickupWilayaName,
        pickupAddress: args.pickupAddress,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("deliverySettings", {
      sellerId: user._id,
      provider: args.provider,
      apiKey: args.apiKey,
      apiId: args.apiId,
      isActive: true,
      pickupWilayaCode: args.pickupWilayaCode,
      pickupWilayaName: args.pickupWilayaName,
      pickupAddress: args.pickupAddress,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeSettings = mutation({
  args: { provider: deliveryProviderValidator },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("deliverySettings")
      .withIndex("sellerId_provider", (q) =>
        q.eq("sellerId", user._id).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Internal mutation to update shipment status + order status
export const updateShipmentStatus = internalMutation({
  args: {
    shipmentId: v.id("shipments"),
    providerStatus: v.string(),
    mappedOrderStatus: v.union(v.literal("processing"), v.literal("shipped"), v.literal("delivered")),
    history: v.optional(v.array(v.object({
      status: v.string(),
      date: v.string(),
      location: v.optional(v.string()),
    }))),
    isFailed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) return;

    const now = Date.now();

    // Update shipment
    await ctx.db.patch(args.shipmentId, {
      providerStatus: args.providerStatus,
      mappedOrderStatus: args.mappedOrderStatus,
      history: args.history,
      lastCheckedAt: now,
      updatedAt: now,
    });

    // Only advance order status forward
    const order = await ctx.db.get(shipment.orderId);
    if (!order) return;

    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIdx = statusOrder.indexOf(order.status);
    const newIdx = statusOrder.indexOf(args.mappedOrderStatus);

    if (newIdx > currentIdx) {
      await ctx.db.patch(shipment.orderId, {
        status: args.mappedOrderStatus,
        updatedAt: now,
      });

      // Notify buyer (skip if account deleted)
      if (args.mappedOrderStatus === "delivered" && order.buyerId) {
        await ctx.runMutation(internal.notifications.createNotification, {
          type: "shipment_delivered",
          title: "تم تسليم طلبك",
          message: `تم تسليم طلبك بنجاح. رقم التتبع: ${shipment.trackingNumber}`,
          relatedId: shipment.orderId as string,
          userId: order.buyerId,
        });
      }
    }

    // Notify seller on failure (skip if account deleted)
    if (args.isFailed && shipment.sellerId) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "shipment_failed",
        title: "فشل التوصيل",
        message: `فشل توصيل الطلب. رقم التتبع: ${shipment.trackingNumber}. الحالة: ${args.providerStatus}`,
        relatedId: shipment.orderId as string,
        userId: shipment.sellerId,
      });
    }
  },
});

// Internal mutation to insert shipment record
export const insertShipment = internalMutation({
  args: {
    orderId: v.id("orders"),
    sellerId: v.id("users"),
    provider: deliveryProviderValidator,
    externalId: v.string(),
    trackingNumber: v.string(),
    providerStatus: v.string(),
    mappedOrderStatus: v.union(v.literal("processing"), v.literal("shipped"), v.literal("delivered")),
    deliveryFee: v.optional(v.number()),
    isStopDesk: v.optional(v.boolean()),
    labelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const shipmentId = await ctx.db.insert("shipments", {
      orderId: args.orderId,
      sellerId: args.sellerId,
      provider: args.provider,
      externalId: args.externalId,
      trackingNumber: args.trackingNumber,
      providerStatus: args.providerStatus,
      mappedOrderStatus: args.mappedOrderStatus,
      deliveryFee: args.deliveryFee,
      isStopDesk: args.isStopDesk,
      labelUrl: args.labelUrl,
      lastCheckedAt: now,
      history: [],
      createdAt: now,
      updatedAt: now,
    });

    // Link shipment to order
    await ctx.db.patch(args.orderId, {
      deliveryProvider: args.provider,
      trackingNumber: args.trackingNumber,
      shipmentId: shipmentId,
      deliveryFee: args.deliveryFee,
      isStopDesk: args.isStopDesk,
      status: "shipped",
      updatedAt: now,
    });

    // Notify buyer (skip if account deleted)
    const order = await ctx.db.get(args.orderId);
    if (order && order.buyerId) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "shipment_created",
        title: "تم شحن طلبك",
        message: `تم شحن طلبك عبر ${args.provider}. رقم التتبع: ${args.trackingNumber}`,
        relatedId: args.orderId as string,
        userId: order.buyerId,
      });
    }

    return shipmentId;
  },
});

// --- Actions (HTTP calls to providers) ---

export const createShipment = action({
  args: {
    orderId: v.id("orders"),
    provider: deliveryProviderValidator,
    isStopDesk: v.optional(v.boolean()),
    weight: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ shipmentId: string; trackingNumber: string; deliveryFee?: number }> => {
    // Fetch order — auth check happens at mutation level (caller must be seller)
    const order: any = await ctx.runQuery(internal.delivery.getOrderForShipment, {
      orderId: args.orderId,
    });
    if (!order) throw new Error("Order not found");

    // Fetch seller's delivery settings
    const settings: any = await ctx.runQuery(internal.delivery.getSettingsForProvider, {
      sellerId: order.sellerId,
      provider: args.provider,
    });
    if (!settings) throw new Error(`No ${args.provider} settings configured`);

    // Check no existing shipment
    const existingShipment = await ctx.runQuery(internal.delivery.getShipmentByOrderInternal, {
      orderId: args.orderId,
    });
    if (existingShipment) throw new Error("This order already has a shipment");

    const provider = getProvider(args.provider);
    const config = { apiKey: settings.apiKey, apiId: settings.apiId };

    const productDesc = order.items.map((i: { productName: string; quantity: number }) => `${i.productName} x${i.quantity}`).join(", ");

    const result = await provider.createParcel(config, {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      address: order.shippingAddress.address,
      wilayaCode: order.shippingAddress.wilayaCode || "16",
      commune: order.shippingAddress.commune,
      isStopDesk: args.isStopDesk ?? false,
      weight: args.weight,
      orderTotal: order.total,
      productDescription: productDesc,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to create parcel");
    }

    // Store shipment
    const shipmentId: string = await ctx.runMutation(internal.delivery.insertShipment, {
      orderId: args.orderId,
      sellerId: order.sellerId,
      provider: args.provider,
      externalId: result.externalId,
      trackingNumber: result.trackingNumber,
      providerStatus: "Nouveau",
      mappedOrderStatus: "shipped" as const,
      deliveryFee: result.deliveryFee,
      isStopDesk: args.isStopDesk,
      labelUrl: result.labelUrl,
    });

    return {
      shipmentId,
      trackingNumber: result.trackingNumber,
      deliveryFee: result.deliveryFee,
    };
  },
});

export const validateApiKeys = action({
  args: {
    provider: deliveryProviderValidator,
    apiKey: v.string(),
    apiId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const provider = getProvider(args.provider);
    const valid = await provider.validateCredentials({
      apiKey: args.apiKey,
      apiId: args.apiId,
    });
    return { success: valid };
  },
});

export const fetchDeliveryFees = action({
  args: {
    provider: deliveryProviderValidator,
    apiKey: v.string(),
    apiId: v.optional(v.string()),
    fromWilayaCode: v.string(),
    toWilayaCode: v.string(),
    isStopDesk: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const provider = getProvider(args.provider);
    const result = await provider.getFees(
      { apiKey: args.apiKey, apiId: args.apiId },
      args.fromWilayaCode,
      args.toWilayaCode,
      args.isStopDesk
    );
    return result;
  },
});

// Internal action: polls all active shipments and updates statuses
export const syncAllActiveShipments = internalAction({
  args: {},
  handler: async (ctx) => {
    const activeShipments = await ctx.runQuery(internal.delivery.listActiveShipmentsInternal, {});
    const now = Date.now();
    const MIN_CHECK_INTERVAL = 20 * 60 * 1000; // 20 minutes

    for (const shipment of activeShipments) {
      // Skip if checked recently
      if (now - shipment.lastCheckedAt < MIN_CHECK_INTERVAL) continue;

      // Fetch settings for this seller + provider
      const settings = await ctx.runQuery(internal.delivery.getSettingsForProvider, {
        sellerId: shipment.sellerId,
        provider: shipment.provider as "yalidine" | "zrexpress" | "maystro",
      });
      if (!settings) continue;

      const provider = getProvider(shipment.provider);
      const config = { apiKey: settings.apiKey, apiId: settings.apiId ?? undefined };

      const tracking = await provider.trackParcel(config, shipment.externalId);
      if (!tracking.success) continue;

      const mapped = provider.mapStatus(tracking.providerStatus);
      const isFailed = mapped === "failed";
      const mappedOrderStatus = isFailed ? shipment.mappedOrderStatus : mapped;

      // Only update if status changed
      if (tracking.providerStatus !== shipment.providerStatus || isFailed) {
        await ctx.runMutation(internal.delivery.updateShipmentStatus, {
          shipmentId: shipment._id,
          providerStatus: tracking.providerStatus,
          mappedOrderStatus: mappedOrderStatus as "processing" | "shipped" | "delivered",
          history: tracking.history,
          isFailed,
        });
      } else {
        // Just update lastCheckedAt
        await ctx.runMutation(internal.delivery.touchShipment, {
          shipmentId: shipment._id,
        });
      }
    }
  },
});

// --- Internal helpers for actions ---

export const getOrderForShipment = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getSettingsForProvider = internalQuery({
  args: {
    sellerId: v.id("users"),
    provider: deliveryProviderValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deliverySettings")
      .withIndex("sellerId_provider", (q) =>
        q.eq("sellerId", args.sellerId).eq("provider", args.provider)
      )
      .first();
  },
});

export const getShipmentByOrderInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shipments")
      .withIndex("orderId", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

export const listActiveShipmentsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const processing = await ctx.db
      .query("shipments")
      .withIndex("mappedOrderStatus", (q) => q.eq("mappedOrderStatus", "processing"))
      .take(200);

    const shipped = await ctx.db
      .query("shipments")
      .withIndex("mappedOrderStatus", (q) => q.eq("mappedOrderStatus", "shipped"))
      .take(200);

    return [...processing, ...shipped];
  },
});

export const touchShipment = internalMutation({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.shipmentId, { lastCheckedAt: Date.now() });
  },
});
