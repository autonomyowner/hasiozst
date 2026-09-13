/**
 * Demo content for the Hasio MVP.
 *
 * The app currently runs with no Convex backend (see `lib/backend.ts`), so every
 * query returns `undefined` and the screens would otherwise be empty. This module
 * supplies locally-bundled Saudi stays, experiences and reels so the app can be
 * demoed end to end.
 *
 * It is a stand-in for real seed data, not a permanent fixture: once a Convex
 * deployment exists, seed these same records server-side and the fallbacks in
 * `lib/useDemo.ts` stop being used automatically (`BACKEND_ENABLED` flips to true).
 */
import { Asset } from "expo-asset";
import type { Banner, Category, Product, Reel } from "./types";
import type { Id, TableNames } from "../convex/_generated/dataModel";

// ── Media ────────────────────────────────────────────────────────────────────
// Local assets resolve to a URL that the Image and Video components can both
// consume, which keeps these records shaped exactly like real Convex rows.
const uri = (mod: number) => Asset.fromModule(mod).uri;

export const demoPhotos = {
  habitasPool: uri(require("../assets/media/photos/habitas-alula-pool.jpg")),
  resortDeck: uri(require("../assets/media/photos/alula-resort-deck.jpg")),
  stays: uri(require("../assets/media/photos/stays.webp")),
  nature: uri(require("../assets/media/photos/nature.webp")),
  mountains: uri(require("../assets/media/photos/mountains.webp")),
  culture: uri(require("../assets/media/photos/culture.webp")),
};

const videos = {
  habitasVilla: uri(require("../assets/media/videos/habitas-alula-villa.mp4")),
  desertRock: uri(require("../assets/media/videos/desert-rock-red-sea.mp4")),
  abha: uri(require("../assets/media/videos/abha-highlands.mp4")),
  jazan: uri(require("../assets/media/videos/jazan-coast.mp4")),
  fifa: uri(require("../assets/media/videos/fifa-mountains.mp4")),
  dheeAyn: uri(require("../assets/media/videos/dhee-ayn-al-baha.mp4")),
  yanbu: uri(require("../assets/media/videos/yanbu-coast.mp4")),
  umluj: uri(require("../assets/media/videos/umluj-corniche.mp4")),
};

export const demoLogo = require("../assets/media/hasio-logo.png");

// Convex ids are branded strings, so demo rows need a cast.
const id = <T extends TableNames>(value: string) => value as Id<T>;

/** Convex documents always carry `_creationTime`; demo rows must too. */
type DemoDoc<T> = T & { _creationTime: number };
export type DemoProduct = DemoDoc<Product>;

const DEMO_EPOCH = Date.UTC(2026, 8, 1);
const createdDaysAgo = (days: number) => DEMO_EPOCH - days * 86_400_000;

const OWNER_IDS = {
  habitas: id<"users">("demo-host-habitas"),
  desertRock: id<"users">("demo-host-desert-rock"),
  abha: id<"users">("demo-host-abha"),
  yanbu: id<"users">("demo-host-yanbu"),
  alBaha: id<"users">("demo-host-al-baha"),
  jazan: id<"users">("demo-host-jazan"),
};

// ── Stays & experiences (cards) ──────────────────────────────────────────────
// `price` is SAR per night for stays, or per person for experiences.
export const demoStays: DemoProduct[] = [
  {
    _id: id<"products">("demo-stay-habitas-alula"),
    _creationTime: createdDaysAgo(1),
    name: "Habitas AlUla — Desert Villa",
    price: 2450,
    oldPrice: 2900,
    imageUrl: demoPhotos.habitasPool,
    images: [demoPhotos.habitasPool, demoPhotos.resortDeck, demoPhotos.stays],
    videoUrl: videos.habitasVilla,
    category: "stays",
    productType: "express",
    tagline: "Sandstone canyons, a still pool, nothing else.",
    description:
      "A desert villa set among the sandstone giants of AlUla. Floor-to-ceiling glass, a private terrace, and access to the valley pool. Rates include breakfast and a guided sunrise walk through the canyon.",
    brand: "Habitas",
    seller: "Habitas AlUla",
    sellerId: OWNER_IDS.habitas,
    supplierLocation: "AlUla",
    rating: 4.9,
    reviewCount: 214,
    trustedCustomers: 1800,
    isNew: true,
    isActive: true,
    badge: "Signature",
  },
  {
    _id: id<"products">("demo-stay-desert-rock"),
    _creationTime: createdDaysAgo(2),
    name: "Desert Rock Resort — Cliff Suite",
    price: 3100,
    imageUrl: demoPhotos.mountains,
    images: [demoPhotos.mountains, demoPhotos.habitasPool],
    videoUrl: videos.desertRock,
    category: "stays",
    productType: "express",
    tagline: "Carved into the mountain, facing the Red Sea.",
    description:
      "A suite built into the rock face of the Hijaz mountains, an hour from the Red Sea coast. Private plunge pool, full-board dining, and stargazing from the terrace.",
    brand: "Red Sea Global",
    seller: "Desert Rock Resort",
    sellerId: OWNER_IDS.desertRock,
    supplierLocation: "Red Sea",
    rating: 4.8,
    reviewCount: 96,
    trustedCustomers: 900,
    isNew: true,
    isActive: true,
    badge: "New",
  },
  {
    _id: id<"products">("demo-stay-alula-deck"),
    _creationTime: createdDaysAgo(3),
    name: "AlUla Valley Retreat — Pool Deck Room",
    price: 1680,
    imageUrl: demoPhotos.resortDeck,
    images: [demoPhotos.resortDeck, demoPhotos.stays],
    category: "stays",
    productType: "express",
    tagline: "Wake up on the water, steps from the dunes.",
    description:
      "A ground-floor room opening straight onto the deck and the main pool. Quiet end of the resort, walking distance to the heritage trail.",
    seller: "AlUla Valley Retreat",
    sellerId: OWNER_IDS.habitas,
    supplierLocation: "AlUla",
    rating: 4.7,
    reviewCount: 148,
    isActive: true,
  },
  {
    _id: id<"products">("demo-exp-umluj"),
    _creationTime: createdDaysAgo(4),
    name: "Umluj Island Day Trip",
    price: 340,
    imageUrl: demoPhotos.stays,
    images: [demoPhotos.stays],
    videoUrl: videos.umluj,
    category: "experiences",
    productType: "express",
    tagline: "The Maldives of Saudi, by boat.",
    description:
      "A full day across the Umluj archipelago — three island stops, snorkelling over the reef, lunch on board. Departs from the Umluj corniche at 8am.",
    seller: "Umluj Boat Co.",
    sellerId: OWNER_IDS.yanbu,
    supplierLocation: "Umluj",
    rating: 4.9,
    reviewCount: 312,
    trustedCustomers: 2400,
    isActive: true,
    badge: "Top rated",
  },
  {
    _id: id<"products">("demo-exp-dhee-ayn"),
    _creationTime: createdDaysAgo(5),
    name: "Dhee Ayn Marble Village Tour",
    price: 180,
    imageUrl: demoPhotos.nature,
    images: [demoPhotos.nature],
    videoUrl: videos.dheeAyn,
    category: "culture",
    productType: "express",
    tagline: "A 400-year-old village on a marble hill.",
    description:
      "Half-day guided walk through the stone village of Dhee Ayn in Al Baha, with its terraced farms and running spring. Includes transport from Al Baha city.",
    seller: "Al Baha Heritage Tours",
    sellerId: OWNER_IDS.alBaha,
    supplierLocation: "Al Baha",
    rating: 4.6,
    reviewCount: 74,
    isActive: true,
  },
  {
    _id: id<"products">("demo-exp-desert-caravan"),
    _creationTime: createdDaysAgo(6),
    name: "Sunrise Camel Caravan",
    price: 260,
    imageUrl: demoPhotos.culture,
    images: [demoPhotos.culture],
    category: "culture",
    productType: "express",
    tagline: "Cross the dunes before the heat.",
    description:
      "A two-hour caravan across the red dunes at first light, led by local herders, finishing with Arabic coffee and dates at the camp.",
    seller: "Nafud Caravans",
    sellerId: OWNER_IDS.abha,
    supplierLocation: "Riyadh",
    rating: 4.8,
    reviewCount: 187,
    isNew: true,
    isActive: true,
  },
];

// ── Reels ────────────────────────────────────────────────────────────────────
interface DemoReelInput {
  key: string;
  videoUrl: string;
  thumbnailUrl: string;
  productName: string;
  posterName: string;
  posterId: Id<"users">;
  price: number;
  likes: number;
  comments: number;
  shares: number;
  daysAgo: number;
}

const makeReel = (input: DemoReelInput): Reel => ({
  _id: id<"reels">(input.key),
  videoUrl: input.videoUrl,
  thumbnailUrl: input.thumbnailUrl,
  productName: input.productName,
  posterName: input.posterName,
  posterId: input.posterId,
  posterRole: "fournisseur",
  posterAvatar: input.thumbnailUrl,
  price: input.price,
  likes: input.likes,
  comments: input.comments,
  shares: input.shares,
  createdAt: Date.now() - input.daysAgo * 86_400_000,
});

export const demoReels: Reel[] = [
  makeReel({
    key: "demo-reel-habitas",
    videoUrl: videos.habitasVilla,
    thumbnailUrl: demoPhotos.habitasPool,
    productName: "Habitas AlUla — Desert Villa",
    posterName: "Habitas AlUla",
    posterId: OWNER_IDS.habitas,
    price: 2450,
    likes: 4820,
    comments: 132,
    shares: 271,
    daysAgo: 1,
  }),
  makeReel({
    key: "demo-reel-desert-rock",
    videoUrl: videos.desertRock,
    thumbnailUrl: demoPhotos.mountains,
    productName: "Desert Rock Resort — Cliff Suite",
    posterName: "Desert Rock Resort",
    posterId: OWNER_IDS.desertRock,
    price: 3100,
    likes: 3610,
    comments: 88,
    shares: 194,
    daysAgo: 2,
  }),
  makeReel({
    key: "demo-reel-umluj",
    videoUrl: videos.umluj,
    thumbnailUrl: demoPhotos.stays,
    productName: "Umluj Island Day Trip",
    posterName: "Umluj Boat Co.",
    posterId: OWNER_IDS.yanbu,
    price: 340,
    likes: 9240,
    comments: 410,
    shares: 1120,
    daysAgo: 3,
  }),
  makeReel({
    key: "demo-reel-yanbu",
    videoUrl: videos.yanbu,
    thumbnailUrl: demoPhotos.stays,
    productName: "Yanbu Coast Escape",
    posterName: "Yanbu Shore Stays",
    posterId: OWNER_IDS.yanbu,
    price: 890,
    likes: 2870,
    comments: 64,
    shares: 143,
    daysAgo: 4,
  }),
  makeReel({
    key: "demo-reel-fifa",
    videoUrl: videos.fifa,
    thumbnailUrl: demoPhotos.mountains,
    productName: "Fifa Mountains Lodge",
    posterName: "Jazan Highland Lodges",
    posterId: OWNER_IDS.jazan,
    price: 620,
    likes: 5130,
    comments: 176,
    shares: 388,
    daysAgo: 5,
  }),
  makeReel({
    key: "demo-reel-abha",
    videoUrl: videos.abha,
    thumbnailUrl: demoPhotos.nature,
    productName: "Abha Highlands Weekend",
    posterName: "Abha Green Stays",
    posterId: OWNER_IDS.abha,
    price: 740,
    likes: 3980,
    comments: 97,
    shares: 205,
    daysAgo: 6,
  }),
  makeReel({
    key: "demo-reel-jazan",
    videoUrl: videos.jazan,
    thumbnailUrl: demoPhotos.nature,
    productName: "Jazan Coast & Farms",
    posterName: "Jazan Discovery",
    posterId: OWNER_IDS.jazan,
    price: 510,
    likes: 2440,
    comments: 51,
    shares: 118,
    daysAgo: 7,
  }),
  makeReel({
    key: "demo-reel-dhee-ayn",
    videoUrl: videos.dheeAyn,
    thumbnailUrl: demoPhotos.nature,
    productName: "Dhee Ayn Marble Village Tour",
    posterName: "Al Baha Heritage Tours",
    posterId: OWNER_IDS.alBaha,
    price: 180,
    likes: 1960,
    comments: 43,
    shares: 87,
    daysAgo: 8,
  }),
];

// ── Categories & banners ─────────────────────────────────────────────────────
export const demoCategories: Category[] = [
  { _id: id<"categories">("demo-cat-all"), slug: "all", label: "All", sortOrder: 0 },
  { _id: id<"categories">("demo-cat-stays"), slug: "stays", label: "Stays", sortOrder: 1 },
  { _id: id<"categories">("demo-cat-experiences"), slug: "experiences", label: "Experiences", sortOrder: 2 },
  { _id: id<"categories">("demo-cat-culture"), slug: "culture", label: "Culture", sortOrder: 3 },
  { _id: id<"categories">("demo-cat-nature"), slug: "nature", label: "Nature", sortOrder: 4 },
];

export const demoBanners: Banner[] = [
  {
    _id: id<"banners">("demo-banner-alula"),
    imageUrl: demoPhotos.habitasPool,
    mediaType: "image",
    title: "AlUla, off season",
    titleArabic: "العلا",
    subtitle: "Desert villas from SAR 1,680",
    isActive: true,
    sortOrder: 0,
  },
  {
    _id: id<"banners">("demo-banner-umluj"),
    imageUrl: demoPhotos.stays,
    mediaType: "image",
    title: "Red Sea islands",
    titleArabic: "البحر الأحمر",
    subtitle: "Day trips from Umluj",
    isActive: true,
    sortOrder: 1,
  },
  {
    _id: id<"banners">("demo-banner-culture"),
    imageUrl: demoPhotos.culture,
    mediaType: "image",
    title: "Heritage & desert",
    titleArabic: "التراث",
    subtitle: "Guided by locals",
    isActive: true,
    sortOrder: 2,
  },
];
