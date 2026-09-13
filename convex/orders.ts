import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthenticatedAppUser } from "./auth";

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const order = await ctx.db.get(args.id);
    if (!order) return null;

    if (order.buyerId !== user._id && order.sellerId !== user._id) return null;
    return order;
  },
});

export const listByBuyer = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("orders")
      .withIndex("buyerId", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .take(200);
  },
});

export const listBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(200);
  },
});

// B2C order creation (from regular cart)
export const create = mutation({
  args: {
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      wilayaCode: v.optional(v.string()),
      wilayaName: v.optional(v.string()),
      commune: v.optional(v.string()),
    }),
    paymentMethod: v.optional(v.literal("cod")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Validate shipping address
    const { fullName, phone, address, city } = args.shippingAddress;
    const trimmedName = fullName.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) throw new Error("Full name must be 2-100 characters / الاسم يجب أن يكون بين 2 و 100 حرف");
    if (!/^0[5-7][0-9]{8}$/.test(phone)) throw new Error("Invalid phone number / رقم الهاتف غير صالح");
    if (trimmedAddress.length < 3 || trimmedAddress.length > 500) throw new Error("Address must be 3-500 characters / العنوان يجب أن يكون بين 3 و 500 حرف");
    if (trimmedCity.length < 2 || trimmedCity.length > 100) throw new Error("City must be 2-100 characters / المدينة يجب أن تكون بين 2 و 100 حرف");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    // Only B2C items
    const b2cItems = cartItems.filter((item) => !item.isWholesale && item.productId);
    if (b2cItems.length === 0) throw new Error("Cart is empty");

    // Group cart items by sellerId
    type OrderItem = {
      productId: string;
      productName: string;
      productImage: string;
      price: number;
      quantity: number;
    };

    type SellerGroup = {
      sellerId: Id<"users">;
      sellerName: string;
      items: OrderItem[];
    };

    // Stock validation — check before creating orders
    for (const cartItem of b2cItems) {
      const product = await ctx.db.get(cartItem.productId!);
      if (!product) continue;
      if (
        product.stockQuantity !== undefined &&
        product.stockQuantity < cartItem.quantity
      ) {
        throw new Error(
          `المنتج ${product.name} غير متوفر بالكمية المطلوبة`
        );
      }
    }

    const sellerGroupMap = new Map<string, SellerGroup>();

    for (const cartItem of b2cItems) {
      const product = await ctx.db.get(cartItem.productId!);
      if (!product) continue;

      const sellerKey = product.sellerId as string;

      if (!sellerGroupMap.has(sellerKey)) {
        const seller = await ctx.db.get(product.sellerId);
        const sellerName = seller ? seller.name : "Unknown Seller";
        sellerGroupMap.set(sellerKey, {
          sellerId: product.sellerId,
          sellerName,
          items: [],
        });
      }

      sellerGroupMap.get(sellerKey)!.items.push({
        productId: cartItem.productId as string,
        productName: product.name,
        productImage: product.imageUrl,
        price: product.price,
        quantity: cartItem.quantity,
      });
    }

    const now = Date.now();
    const orderIds: Id<"orders">[] = [];

    for (const [, group] of sellerGroupMap) {
      const total = group.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const itemCount = group.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const orderId = await ctx.db.insert("orders", {
        buyerId: user._id,
        buyerName: user.name,
        sellerId: group.sellerId,
        sellerName: group.sellerName,
        items: group.items,
        shippingAddress: args.shippingAddress,
        status: "pending",
        total,
        itemCount,
        paymentMethod: args.paymentMethod ?? "cod",
        orderType: "b2c",
        createdAt: now,
        updatedAt: now,
      });

      orderIds.push(orderId);

      await ctx.runMutation(internal.notifications.createNotification, {
        type: "order_placed",
        title: "New Order Received",
        message: `${user.name} placed an order with ${itemCount} item${itemCount !== 1 ? "s" : ""} totaling ${total} DA.`,
        relatedId: orderId as string,
        userId: group.sellerId,
      });
    }

    // Decrement stock for each product, track depletions per seller
    const depletedBySeller = new Map<string, { sellerId: Id<"users">; productNames: string[] }>();
    for (const cartItem of b2cItems) {
      const product = await ctx.db.get(cartItem.productId!);
      if (!product) continue;
      if (product.stockQuantity !== undefined) {
        const newQuantity = product.stockQuantity - cartItem.quantity;
        const patch: { stockQuantity: number; isActive?: boolean } = {
          stockQuantity: Math.max(0, newQuantity),
        };
        if (newQuantity <= 0) {
          patch.isActive = false;
          // Track depleted product for notification
          const key = product.sellerId as string;
          if (!depletedBySeller.has(key)) {
            depletedBySeller.set(key, { sellerId: product.sellerId, productNames: [] });
          }
          depletedBySeller.get(key)!.productNames.push(product.name);
        }
        await ctx.db.patch(cartItem.productId!, patch);
      }
    }

    // Notify sellers about depleted stock
    for (const [, { sellerId, productNames }] of depletedBySeller) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "stock_depleted",
        title: "نفاد المخزون",
        message: `نفد مخزون: ${productNames.join("، ")}`,
        relatedId: sellerId as string,
        userId: sellerId,
      });
    }

    // Clear B2C cart items
    await Promise.all(b2cItems.map((item) => ctx.db.delete(item._id)));

    return orderIds[0];
  },
});

// Wholesale order creation (from wholesale cart)
export const createWholesaleOrder = mutation({
  args: {
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      wilayaCode: v.optional(v.string()),
      wilayaName: v.optional(v.string()),
      commune: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (
      user.role !== "seller" ||
      !user.sellerType ||
      (user.sellerType !== "grossiste" &&
        user.sellerType !== "importateur" &&
        user.sellerType !== "fournisseur")
    ) {
      throw new Error("Only B2B sellers can place wholesale orders");
    }

    // Validate shipping address
    const { fullName, phone, address, city } = args.shippingAddress;
    const trimmedName = fullName.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) throw new Error("Full name must be 2-100 characters / الاسم يجب أن يكون بين 2 و 100 حرف");
    if (!/^0[5-7][0-9]{8}$/.test(phone)) throw new Error("Invalid phone number / رقم الهاتف غير صالح");
    if (trimmedAddress.length < 3 || trimmedAddress.length > 500) throw new Error("Address must be 3-500 characters / العنوان يجب أن يكون بين 3 و 500 حرف");
    if (trimmedCity.length < 2 || trimmedCity.length > 100) throw new Error("City must be 2-100 characters / المدينة يجب أن تكون بين 2 و 100 حرف");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const wholesaleItems = cartItems.filter(
      (item) => item.isWholesale && item.wholesaleProductId
    );
    if (wholesaleItems.length === 0) throw new Error("Wholesale cart is empty");

    type OrderItem = {
      productId: string;
      productName: string;
      productImage: string;
      price: number;
      quantity: number;
    };

    type SellerGroup = {
      sellerId: Id<"users">;
      sellerName: string;
      items: OrderItem[];
    };

    const sellerGroupMap = new Map<string, SellerGroup>();

    for (const cartItem of wholesaleItems) {
      const product = await ctx.db.get(cartItem.wholesaleProductId!);
      if (!product) continue;

      const sellerKey = product.supplierId as string;

      if (!sellerGroupMap.has(sellerKey)) {
        sellerGroupMap.set(sellerKey, {
          sellerId: product.supplierId,
          sellerName: product.supplierName,
          items: [],
        });
      }

      sellerGroupMap.get(sellerKey)!.items.push({
        productId: cartItem.wholesaleProductId as string,
        productName: product.name,
        productImage: product.imageUrl,
        price: product.pricePerUnit,
        quantity: cartItem.quantity,
      });
    }

    const now = Date.now();
    const orderIds: Id<"orders">[] = [];

    for (const [, group] of sellerGroupMap) {
      const total = group.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const itemCount = group.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const orderId = await ctx.db.insert("orders", {
        buyerId: user._id,
        buyerName: user.name,
        sellerId: group.sellerId,
        sellerName: group.sellerName,
        items: group.items,
        shippingAddress: args.shippingAddress,
        status: "pending",
        total,
        itemCount,
        paymentMethod: "cod",
        orderType: "wholesale",
        createdAt: now,
        updatedAt: now,
      });

      orderIds.push(orderId);

      await ctx.runMutation(internal.notifications.createNotification, {
        type: "order_placed",
        title: "New Wholesale Order",
        message: `${user.name} placed a wholesale order with ${itemCount} item${itemCount !== 1 ? "s" : ""} totaling ${total} DA.`,
        relatedId: orderId as string,
        userId: group.sellerId,
      });
    }

    // Clear wholesale cart items
    await Promise.all(wholesaleItems.map((item) => ctx.db.delete(item._id)));

    return orderIds[0];
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    if (order.sellerId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    const statusLabels: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
    };

    if (order.buyerId) {
      await ctx.runMutation(internal.notifications.createNotification, {
        type: "order_status_changed",
        title: "Order Status Updated",
        message: `Your order status has been updated to: ${statusLabels[args.status]}.`,
        relatedId: args.id as string,
        userId: order.buyerId,
      });
    }

    return args.id;
  },
});

export const getSellerStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return { totalRevenue: 0, totalOrders: 0, pendingOrders: 0 };

    const orders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;

    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered"
    ).length;

    return { totalRevenue, totalOrders: orders.length, pendingOrders, deliveredOrders };
  },
});

// Remove a single order (buyer or seller)
export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    if (order.buyerId !== user._id && order.sellerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Clear all orders for the current user (buyer or seller)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const buyerOrders = await ctx.db
      .query("orders")
      .withIndex("buyerId", (q) => q.eq("buyerId", user._id))
      .collect();

    const sellerOrders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const allIds = new Set([
      ...buyerOrders.map((o) => o._id),
      ...sellerOrders.map((o) => o._id),
    ]);

    for (const id of allIds) {
      await ctx.db.delete(id);
    }
  },
});

// Clear delivered orders where the current user is the seller
export const clearDeliveredAsSeller = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const sellerOrders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const deliveredOrders = sellerOrders.filter((o) => o.status === "delivered");
    for (const order of deliveredOrders) {
      await ctx.db.delete(order._id);
    }
    return deliveredOrders.length;
  },
});

// Clear all orders where the current user is the buyer
export const clearAllAsBuyer = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const buyerOrders = await ctx.db
      .query("orders")
      .withIndex("buyerId", (q) => q.eq("buyerId", user._id))
      .collect();

    for (const order of buyerOrders) {
      await ctx.db.delete(order._id);
    }
  },
});

// Wholesale orders by buyer (for fournisseur dashboard)
export const listWholesaleByBuyer = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("buyerId", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    return orders.filter((o) => o.orderType === "wholesale");
  },
});

// Wholesale orders by seller (for grossiste dashboard)
export const listWholesaleBySeller = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();

    return orders.filter((o) => o.orderType === "wholesale");
  },
});

// Seller analytics (KPI, top products, top cities, orders by status)
export const getSellerAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedAppUser(ctx);
    if (!user) return null;

    const orders = await ctx.db
      .query("orders")
      .withIndex("sellerId", (q) => q.eq("sellerId", user._id))
      .take(1000);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const deliveredCount = orders.filter((o) => o.status === "delivered").length;
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
    const cancelledCount = 0;
    const cancellationRate = 0;
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

    // Today's orders
    const now = Date.now();
    const startOfDay = now - (now % 86400000);
    const todayOrders = orders.filter((o) => (o.createdAt ?? 0) >= startOfDay).length;

    // This month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthRevenue = orders
      .filter((o) => (o.createdAt ?? 0) >= startOfMonth.getTime())
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const o of orders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    // Top cities
    const cityMap: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      const city = o.shippingAddress?.city ?? "غير محدد";
      if (!cityMap[city]) cityMap[city] = { count: 0, revenue: 0 };
      cityMap[city].count++;
      cityMap[city].revenue += o.total ?? 0;
    }
    const topCities = Object.entries(cityMap)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top products
    const productMap: Record<string, { name: string; image: string; quantity: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of o.items ?? []) {
        const key = item.productName ?? "غير محدد";
        if (!productMap[key]) productMap[key] = { name: key, image: item.productImage ?? "", quantity: 0, revenue: 0 };
        productMap[key].quantity += item.quantity ?? 0;
        productMap[key].revenue += (item.price ?? 0) * (item.quantity ?? 0);
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      avgOrderValue,
      deliveryRate,
      deliveredCount,
      cancelledCount,
      cancellationRate,
      totalOrders,
      pendingOrders,
      todayOrders,
      monthRevenue,
      ordersByStatus,
      topCities,
      topProducts,
    };
  },
});
