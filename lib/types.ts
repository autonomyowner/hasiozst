import type { Id } from "../convex/_generated/dataModel";

// --- Role System ---
export type SellerType = "fournisseur" | "importateur" | "grossiste";

export type UserRole = "customer" | "seller" | "freelancer";

export type EffectiveRole =
  | "customer"
  | "fournisseur"
  | "importateur"
  | "grossiste"
  | "freelancer"
  | "admin";

export function getEffectiveRole(user: { role: UserRole; sellerType?: SellerType }): EffectiveRole {
  if (user.role === "customer") return "customer";
  if (user.role === "freelancer") return "freelancer";
  return user.sellerType ?? "fournisseur";
}

// --- User ---
export interface User {
  _id: Id<"users">;
  _creationTime: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  sellerType?: SellerType;
  expoPushToken?: string;
  plan?: "free" | "pro";
}

// --- Products ---
export type ProductType = "express" | "grocery" | "importer";

export interface ProductSpecs {
  power?: string;
  capacity?: string;
  warranty?: string;
  material?: string;
}

export interface Product {
  _id: Id<"products">;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description?: string;
  brand?: string;
  oldPrice?: number;
  isNew?: boolean;
  rating?: number;
  seller?: string;
  sellerId: Id<"users">;
  isActive: boolean;
  // Extended fields
  tagline?: string;
  reviewCount?: number;
  trustedCustomers?: number;
  stockQuantity?: number;
  expirationDate?: string;
  storageCondition?: string;
  specs?: ProductSpecs;
  minOrder?: number;
  supplierLocation?: string;
  badge?: string;
  images?: string[];
  videoUrl?: string;
  productType?: ProductType;
  isPromoted?: boolean;
  promotionId?: string;
}

export interface WholesaleProduct {
  _id: Id<"wholesaleProducts">;
  name: string;
  description?: string;
  category?: string;
  pricePerUnit: number;
  minOrder: number;
  imageUrl: string;
  images?: string[];
  supplierId: Id<"users">;
  supplierName: string;
  supplierAvatar: string;
  supplierLocation: string;
  supplierRating: number;
  supplierSellerType?: "grossiste" | "importateur";
  rating: number;
  hasVideo?: boolean;
  tags: string[];
  productType?: ProductType;
}

// --- Categories & Banners ---
export interface Category {
  _id: Id<"categories">;
  slug: string;
  label: string;
  sortOrder: number;
}

export interface Banner {
  _id: Id<"banners">;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: "image" | "video" | "gif";
  title: string;
  titleArabic?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

// --- Reels ---
export interface Reel {
  _id: Id<"reels">;
  videoUrl?: string;
  thumbnailUrl: string;
  posterName: string;
  productName: string;
  productId?: Id<"products">;
  price: number;
  likes: number;
  comments: number;
  shares: number;
  posterId: Id<"users">;
  posterRole: EffectiveRole;
  posterAvatar: string;
  createdAt: number;
}

// --- Cart ---
export interface CartItem {
  _id: Id<"cartItems">;
  productId: Id<"products">;
  quantity: number;
  product: {
    _id: Id<"products">;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    sellerName?: string;
    sellerCity?: string;
  };
}

// --- Dashboard Stats ---
export interface FreelancerDashboardStats {
  totalRevenue: number;
  growth: number;
  activeServices: number;
  pendingRequests: number;
}

export interface SellerDashboardStats {
  totalRevenue: number;
  growth: number;
  totalOrders: number;
  activeProducts: number;
  pendingOrders: number;
}

// --- Orders ---
export type PaymentMethod = "cod";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  wilayaCode?: string;
  wilayaName?: string;
  commune?: string;
}

export type DeliveryProvider = "yalidine" | "zrexpress" | "maystro";

export interface FullOrder {
  _id: Id<"orders">;
  // Null after the buyer/seller deletes their account (anonymized).
  buyerId: Id<"users"> | null;
  buyerName: string;
  sellerId: Id<"users"> | null;
  sellerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  total: number;
  itemCount: number;
  paymentMethod?: PaymentMethod;
  orderType?: "b2c" | "wholesale";
  deliveryProvider?: DeliveryProvider;
  trackingNumber?: string;
  shipmentId?: Id<"shipments">;
  deliveryFee?: number;
  isStopDesk?: boolean;
  createdAt: number;
  updatedAt: number;
}

// --- B2B Offers & Auctions ---
export type OfferType = "auction" | "negotiable";
export type OfferStatus = "open" | "closed" | "expired";
export type BidStatus = "pending" | "accepted" | "rejected";

export interface Bid {
  _id: Id<"bids">;
  offerId: Id<"offers">;
  bidderId: Id<"users">;
  bidderName: string;
  amount: number;
  message: string;
  phone?: string;
  status: BidStatus;
  createdAt: number;
}

export interface WholesaleOffer {
  _id: Id<"offers">;
  type: OfferType;
  title: string;
  description: string;
  productName: string;
  quantity: number;
  unit: string;
  creatorId: Id<"users">;
  creatorName: string;
  phone?: string;
  status: OfferStatus;
  deadline: string;
  minPrice: number;
  category?: string;
  currentBestBid?: number;
  bidCount: number;
  createdAt: number;
}

// --- Messaging ---
export type ConversationContextType = "product" | "order" | "service" | "offer" | "wholesaleProduct";

export interface Conversation {
  _id: Id<"conversations">;
  // Null after the participant deletes their account (anonymized).
  participant1Id: Id<"users"> | null;
  participant2Id: Id<"users"> | null;
  participant1Name: string;
  participant1Avatar: string;
  participant2Name: string;
  participant2Avatar: string;
  contextType: ConversationContextType;
  contextId: string;
  contextTitle: string;
  lastMessageText?: string;
  lastMessageSenderId?: Id<"users">;
  lastMessageAt?: number;
  participant1Unread: number;
  participant2Unread: number;
  createdAt: number;
}

export interface Message {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  // Null after the sender deletes their account (anonymized).
  senderId: Id<"users"> | null;
  senderName: string;
  text: string;
  isRead: boolean;
  createdAt: number;
}

// --- Notifications ---
export type NotificationType =
  | "order_placed"
  | "order_status_changed"
  | "bid_received"
  | "bid_accepted"
  | "bid_rejected"
  | "offer_closed"
  | "service_request_received"
  | "service_request_accepted"
  | "service_request_completed"
  | "service_request_declined"
  | "demand_response_received"
  | "demand_response_accepted"
  | "demand_response_declined"
  | "reel_comment"
  | "stock_depleted"
  | "shipment_created"
  | "shipment_delivered"
  | "shipment_failed"
  | "message_received"
  | "report_submitted"
  | "report_received"
  | "content_removed";

export interface AppNotification {
  _id: Id<"notifications">;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string;
  userId: Id<"users">;
  read: boolean;
  createdAt: number;
}

// --- Freelance Services ---
export interface FreelanceService {
  _id: Id<"freelanceServices">;
  title: string;
  description: string;
  price: number;
  freelancerId: Id<"users">;
  freelancerName: string;
  freelancerAvatar: string;
  category: string;
  rating: number;
  completedJobs: number;
  imageUrl: string;
  images: string[];
  videoUrl?: string;
}

// --- Demand Requests ---
export interface DemandRequest {
  _id: Id<"demandRequests">;
  title: string;
  description?: string;
  buyerName: string;
  userId?: Id<"users">;
  phone?: string;
  category?: string;
  budget: number;
  deadline: string;
  status: "new" | "in_progress" | "completed";
  responseCount?: number;
  createdAt: number;
}

// --- Demand Responses ---
export type DemandResponseStatus = "pending" | "accepted" | "declined";

export interface DemandResponse {
  _id: Id<"demandResponses">;
  demandId: Id<"demandRequests">;
  responderId: Id<"users">;
  responderName: string;
  phone: string;
  message: string;
  priceQuote: number;
  status: DemandResponseStatus;
  createdAt: number;
}

// --- Client Requests ---
export type ClientRequestStatus = "new" | "in_progress" | "completed" | "declined";

export interface ClientRequest {
  _id: Id<"clientRequests">;
  freelancerId: Id<"users">;
  clientId?: Id<"users">;
  clientName: string;
  clientAvatar: string;
  phone?: string;
  title: string;
  description: string;
  budget: number;
  deliveryTime: string;
  status: ClientRequestStatus;
  finalAmount?: number;
  completedAt?: number;
  createdAt: number;
}

// --- Subscription Plans ---
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  limitations?: string[];
  benefits?: string[];
  ctaText: string;
  popular?: boolean;
}
