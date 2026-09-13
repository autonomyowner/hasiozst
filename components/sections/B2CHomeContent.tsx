import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, usePaginatedQuery } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BannerCarousel } from "@/components/sections/BannerCarousel";
import { CategoryBar } from "@/components/sections/CategoryBar";
import { ProductRow } from "@/components/sections/ProductRow";
import { ProductCard } from "@/components/cards/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useSupplierSpecials } from "@/hooks/useProducts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useTracking } from "@/hooks/useTracking";
import { useDemo } from "@/lib/useDemo";
import { demoStays, demoCategories, demoBanners } from "@/lib/demoContent";
import { useConversations } from "@/hooks/useConversations";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Product } from "@/lib/types";

const GRID_GAP = 12;
const GRID_PADDING = 16;

function HeaderIcons({ router }: { router: ReturnType<typeof useRouter> }) {
  const { unreadTotal } = useConversations();
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <Pressable
        onPress={() => router.push("/search")}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
      >
        <Ionicons name="search-outline" size={18} color="#1A4B5F" />
      </Pressable>
      <Pressable
        onPress={() => router.push("/conversations")}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1A4B5F" />
        {unreadTotal > 0 && (
          <View
            className="absolute -top-1 -right-1 h-[16px] min-w-[16px] items-center justify-center rounded-full bg-error px-0.5"
          >
            <Text className="font-mont-bold text-[8px] text-text-primary">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </Text>
          </View>
        )}
      </Pressable>
      <Pressable
        onPress={() => router.push("/cart")}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
      >
        <Ionicons name="cart-outline" size={18} color="#1A4B5F" />
      </Pressable>
    </View>
  );
}

interface B2CHomeContentProps {
  headerRight?: React.ReactNode;
}

export function B2CHomeContent({ headerRight }: B2CHomeContentProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);
  const { isLoading } = useCurrentUser();
  const supplierSpecials = useSupplierSpecials();
  const forYouProducts = useDemo(
    useQuery(api.recommendations.forYouProducts, { limit: 10 }),
    demoStays
  );
  const trendingProducts = useDemo(
    useQuery(api.recommendations.trendingProducts, { limit: 10 }),
    [...demoStays].reverse()
  );
  const allProducts = useDemo(useQuery(api.products.list, { limit: 50 }), demoStays) ?? [];
  const promotedProducts = useQuery(api.promotions.listActiveWithProducts) ?? [];
  const categories = useDemo(useQuery(api.categories.list), demoCategories) ?? [];
  const banners = useDemo(useQuery(api.banners.list), demoBanners) ?? [];
  const router = useRouter();
  const { trackEvent } = useTracking();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();

  // Infinite scroll products (always load all — category filtering is client-side)
  const {
    results: livePaginatedProducts,
    status: livePaginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.products.listPaginated,
    {},
    { initialNumItems: 10 }
  );
  // Without a backend the paginated query never yields; show the demo set as a
  // single complete page so the list renders instead of spinning forever.
  const paginatedProducts = useDemo(livePaginatedProducts, demoStays) ?? [];
  const paginationStatus = useDemo(livePaginationStatus, "Exhausted" as const) ?? "LoadingFirstPage";

  // Products filtered by selected category
  const categoryProducts = useMemo(() => {
    if (activeCategory === "all") return [];
    return allProducts.filter((p) => p.category === activeCategory);
  }, [allProducts, activeCategory]);

  // New arrivals (products marked isNew)
  const newArrivals = useMemo(
    () => allProducts.filter((p) => p.isNew),
    [allProducts]
  );

  // Best sellers (highest rating)
  const bestSellers = useMemo(
    () => [...allProducts].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 15),
    [allProducts]
  );

  // Promoted products come pre-joined from listActiveWithProducts
  const recordImpression = useMutation(api.promotions.recordImpression);
  const impressionsFired = useRef(false);

  // Fire impression tracking once when promoted products render
  useEffect(() => {
    if (promotedProducts.length > 0 && !impressionsFired.current) {
      impressionsFired.current = true;
      for (const p of promotedProducts) {
        if (p.promotionId) {
          recordImpression({ id: p.promotionId as any }).catch(() => {});
          trackEvent({ eventType: "promotion_view", targetProductId: p._id as any, category: p.category });
        }
      }
    }
  }, [promotedProducts]);

  // Cast to Product type for ProductRow compatibility
  const promotionProducts = useMemo((): Product[] => {
    return promotedProducts.map((p) => ({
      ...p,
      _id: p._id as unknown as Product["_id"],
      sellerId: p.sellerId as unknown as Product["sellerId"],
      productType: p.productType as Product["productType"],
      isPromoted: true,
    }));
  }, [promotedProducts]);

  const hasContent =
    (forYouProducts && forYouProducts.length > 0) ||
    promotionProducts.length > 0 ||
    newArrivals.length > 0 ||
    supplierSpecials.length > 0 ||
    bestSellers.length > 0;

  const handleLoadMore = useCallback(() => {
    if (paginationStatus === "CanLoadMore") {
      loadMore(10);
    }
  }, [paginationStatus, loadMore]);

  const handleCategorySelect = useCallback(
    (slug: string) => {
      setActiveCategory(slug);
      if (slug && slug !== "all") {
        trackEvent({ eventType: "category_browse", category: slug });
      }
    },
    [trackEvent]
  );

  // Build 2-column rows from paginated products (client-side category filter)
  const gridRows = useMemo(() => {
    const filtered = activeCategory === "all"
      ? paginatedProducts
      : paginatedProducts.filter((p) => p.category === activeCategory);
    const rows: Product[][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      rows.push(filtered.slice(i, i + 2));
    }
    return rows;
  }, [paginatedProducts, activeCategory]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A4B5F" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1A4B5F"
            colors={["#1A4B5F"]}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          // Only paginate when: there's actually scrollable content, the user
          // has scrolled down meaningfully, and we're near the bottom.
          // Without these guards, the handler fires constantly on short lists
          // and re-renders cancel Pressable taps (category pills, etc.).
          const hasScrollableContent =
            contentSize.height > layoutMeasurement.height + 200;
          const hasScrolledDown = contentOffset.y > 200;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 600;
          if (hasScrollableContent && hasScrolledDown && isNearBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={200}
      >
        {/* Header — HASIO logo + search + cart icons */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Text className="font-mont-bold text-lg text-primary">
              HASIO
            </Text>
            {headerRight}
          </View>
          <HeaderIcons router={router} />
        </View>

        {/* Banner carousel */}
        <BannerCarousel banners={banners} />

        {/* Categories label + Freelance button */}
        <View className="flex-row items-center justify-between px-4 pt-3">
          <Text className="font-mont-semibold text-[15px] text-text-primary">
            Categories
          </Text>
          <Pressable
            onPress={() => router.push("/services")}
            className="rounded-pill px-4 py-1.5 active:opacity-70"
            style={{
              backgroundColor: "#1A4B5F",
              shadowColor: "#1A4B5F",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="font-mont-semibold text-[13px] text-white">
              Freelance
            </Text>
          </Pressable>
        </View>
        <CategoryBar
          categories={categories}
          activeId={activeCategory}
          onSelect={handleCategorySelect}
        />

        {/* Category filtered products */}
        {activeCategory !== "all" && categoryProducts.length > 0 && (
          <ProductRow
            title={categories.find((c) => c.slug === activeCategory)?.label ?? activeCategory}
            products={categoryProducts}
          />
        )}

        {/* Empty state fallback */}
        {!hasContent && (
          <EmptyState
            icon="storefront-outline"
            title="Nothing here yet"
            message="Check back soon for new arrivals!"
          />
        )}

        {/* Promotions */}
        {promotionProducts.length > 0 && (
          <ProductRow
            title="Deals"
            subtitle="Limited-time rates"
            products={promotionProducts}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* For You — Personalized */}
        {forYouProducts && forYouProducts.length > 0 && (
          <ProductRow
            title="Recommended for You"
            subtitle="Places we think you will like"
            products={forYouProducts}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <ProductRow
            title="Newly Listed"
            subtitle="Just added by hosts"
            products={newArrivals}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* Trending */}
        {trendingProducts && trendingProducts.length > 0 && (
          <ProductRow
            title="Trending Now"
            subtitle="Most booked this week"
            products={trendingProducts}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* Supplier Specials */}
        {supplierSpecials.length > 0 && (
          <ProductRow
            title="Host Specials"
            subtitle="Top rated hosts"
            products={supplierSpecials}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <ProductRow
            title="Best Rated"
            subtitle="Highest rated stays & experiences"
            products={bestSellers}
            actionLabel="View All"
            onAction={() => router.push("/all-products")}
          />
        )}

        {/* Vertical infinite scroll grid */}
        <SectionHeader title="All Stays & Experiences" subtitle="Browse everything" />
        <View
          style={{
            paddingHorizontal: GRID_PADDING,
            gap: GRID_GAP,
          }}
        >
          {gridRows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                flexDirection: "row",
                gap: GRID_GAP,
              }}
            >
              {row.map((product) => (
                <View key={product._id} style={{ width: CARD_WIDTH }}>
                  <ProductCard
                    product={product}
                    isFavorite={isFavorite(product._id)}
                    onToggleFavorite={() => toggleFavorite(product._id)}
                    onAddToCart={() => addItem(product._id)}
                    fullWidth
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Loading spinner while fetching next page */}
        {paginationStatus === "LoadingMore" && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#1A4B5F" />
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
