import { ScrollView, FlatList, View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchBar } from "@/components/ui/SearchBar";
import { SupplierProductCard } from "@/components/cards/SupplierProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUserRole } from "@/hooks/useUserRole";
import { useViewMode } from "@/hooks/useViewMode";
import { useConversations } from "@/hooks/useConversations";
import { B2CHomeContent } from "@/components/sections/B2CHomeContent";

type TabKey = "all" | "express" | "grocery" | "importer";
const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "express", label: "Express" },
  { key: "grocery", label: "Grocery" },
  { key: "importer", label: "Importer" },
];

type PriceRange = "under10k" | "10k-50k" | "over50k";
type QuantityRange = "under10" | "10-50" | "over50";

const priceOptions: { key: PriceRange; label: string }[] = [
  { key: "under10k", label: "Under 10,000 DA" },
  { key: "10k-50k", label: "10,000 – 50,000 DA" },
  { key: "over50k", label: "Over 50,000 DA" },
];

const quantityOptions: { key: QuantityRange; label: string }[] = [
  { key: "under10", label: "Under 10 units" },
  { key: "10-50", label: "10 – 50 units" },
  { key: "over50", label: "Over 50 units" },
];

function ViewModeTogglePill({ label, onPress, variant }: { label: string; onPress: () => void; variant: "filled" | "outline" }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-pill px-3.5 py-1 active:opacity-70"
      style={variant === "filled" ? {
        backgroundColor: "#FFD400",
        shadowColor: "#FFD400",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      } : {
        borderWidth: 1.5,
        borderColor: "#FFD400",
      }}
    >
      <Text
        className="font-mont-semibold text-[12px]"
        style={{ color: variant === "filled" ? "#000" : "#FFD400" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function B2BHeaderChatIcon() {
  const router = useRouter();
  const { unreadTotal } = useConversations();
  return (
    <Pressable
      onPress={() => router.push("/conversations")}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
      style={{ backgroundColor: "rgba(169,169,169,0.12)" }}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
      {unreadTotal > 0 && (
        <View
          className="absolute -top-1 -right-1 h-[16px] min-w-[16px] items-center justify-center rounded-full bg-error px-0.5"
        >
          <Text className="font-mont-bold text-[8px] text-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function GrocisteHomeScreen() {
  const { effectiveRole } = useUserRole();
  const { isB2CMode, toggleViewMode } = useViewMode();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [quantityRange, setQuantityRange] = useState<QuantityRange | null>(null);
  const [openDropdown, setOpenDropdown] = useState<"price" | "quantity" | null>(null);
  const [searchText, setSearchText] = useState("");

  const wholesaleProducts = useQuery(
    api.wholesaleProducts.list,
    activeTab === "all" ? {} : { productType: activeTab }
  );

  const products = wholesaleProducts ?? [];
  const filteredProducts = useMemo(() => {
    let result = searchText.trim()
      ? products.filter((p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase())
        )
      : products;

    if (priceRange === "under10k") {
      result = result.filter((p) => p.pricePerUnit < 10000);
    } else if (priceRange === "10k-50k") {
      result = result.filter((p) => p.pricePerUnit >= 10000 && p.pricePerUnit <= 50000);
    } else if (priceRange === "over50k") {
      result = result.filter((p) => p.pricePerUnit > 50000);
    }

    if (quantityRange === "under10") {
      result = result.filter((p) => p.minOrder < 10);
    } else if (quantityRange === "10-50") {
      result = result.filter((p) => p.minOrder >= 10 && p.minOrder <= 50);
    } else if (quantityRange === "over50") {
      result = result.filter((p) => p.minOrder > 50);
    }

    return result;
  }, [products, searchText, priceRange, quantityRange]);

  const priceLabel =
    priceOptions.find((o) => o.key === priceRange)?.label ?? "Price";
  const quantityLabel =
    quantityOptions.find((o) => o.key === quantityRange)?.label ?? "Quantity";

  // B2C mode — show the full B2C home feed with a "B2B" toggle to switch back
  if (isB2CMode) {
    return (
      <B2CHomeContent
        headerRight={
          <ViewModeTogglePill label="B2B" onPress={toggleViewMode} variant="outline" />
        }
      />
    );
  }

  // B2B mode (default)
  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-1 flex-row items-center justify-between">
          <Text style={{ fontFamily: "Montserrat_700Bold", fontSize: 20, color: "#fff" }}>
            HASIO <Text style={{ color: "#FFD400" }}>B2B</Text>
          </Text>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <B2BHeaderChatIcon />
            <ViewModeTogglePill label="B2C" onPress={toggleViewMode} variant="filled" />
          </View>
        </View>

        {/* Search */}
        <View className="mt-2">
          <SearchBar
            placeholder="Search wholesale products... (ex: rice, milk, su..."
            onChangeText={setSearchText}
            showFilterIcon
          />
        </View>

        {/* Tab switcher with yellow underline */}
        <View className="flex-row mx-4 mt-4">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 items-center pb-2"
            >
              <Text
                className={`font-mont-semibold text-sm ${
                  activeTab === tab.key ? "text-primary" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View className="mt-1 h-0.5 w-8 bg-primary rounded-full" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Yellow outlined filter pills — tap to open dropdown */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <Pressable
            onPress={() => setOpenDropdown("price")}
            className="mr-2.5 flex-row items-center px-4 py-1.5"
            style={{
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: "#FFD400",
              backgroundColor: priceRange ? "rgba(255,212,0,0.15)" : "transparent",
            }}
          >
            <Text className="font-mont-semibold text-[12px]" style={{ color: "#FFD400" }}>
              {priceLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#FFD400" style={{ marginLeft: 5 }} />
          </Pressable>

          <Pressable
            onPress={() => setOpenDropdown("quantity")}
            className="mr-2.5 flex-row items-center px-4 py-1.5"
            style={{
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: "#FFD400",
              backgroundColor: quantityRange ? "rgba(255,212,0,0.15)" : "transparent",
            }}
          >
            <Text className="font-mont-semibold text-[12px]" style={{ color: "#FFD400" }}>
              {quantityLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#FFD400" style={{ marginLeft: 5 }} />
          </Pressable>

          {(priceRange || quantityRange) && (
            <Pressable
              onPress={() => {
                setPriceRange(null);
                setQuantityRange(null);
              }}
              className="mr-2.5 flex-row items-center px-4 py-1.5"
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: "#898989",
                backgroundColor: "transparent",
              }}
            >
              <Text className="font-mont-semibold text-[12px]" style={{ color: "#898989" }}>
                Clear
              </Text>
              <Ionicons name="close" size={12} color="#898989" style={{ marginLeft: 5 }} />
            </Pressable>
          )}
        </ScrollView>

        {/* Dropdown modal */}
        <Modal
          visible={openDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setOpenDropdown(null)}
        >
          <Pressable
            onPress={() => setOpenDropdown(null)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#0C0C0C",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#333333",
                padding: 20,
              }}
            >
              <Text
                className="font-mont-bold text-white"
                style={{ fontSize: 16, marginBottom: 14 }}
              >
                {openDropdown === "price" ? "Price range" : "Quantity range"}
              </Text>

              {(openDropdown === "price" ? priceOptions : quantityOptions).map((opt) => {
                const isSelected =
                  openDropdown === "price"
                    ? priceRange === opt.key
                    : quantityRange === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      if (openDropdown === "price") {
                        setPriceRange(opt.key as PriceRange);
                      } else {
                        setQuantityRange(opt.key as QuantityRange);
                      }
                      setOpenDropdown(null);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      backgroundColor: isSelected
                        ? "rgba(255,212,0,0.12)"
                        : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: isSelected ? "#FFD400" : "transparent",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      className="font-mont-semibold"
                      style={{
                        color: isSelected ? "#FFD400" : "#fff",
                        fontSize: 14,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FFD400" />
                    )}
                  </Pressable>
                );
              })}

              {((openDropdown === "price" && priceRange) ||
                (openDropdown === "quantity" && quantityRange)) && (
                <Pressable
                  onPress={() => {
                    if (openDropdown === "price") {
                      setPriceRange(null);
                    } else {
                      setQuantityRange(null);
                    }
                    setOpenDropdown(null);
                  }}
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Text
                    className="font-mont-semibold"
                    style={{ color: "#898989", fontSize: 13 }}
                  >
                    Clear selection
                  </Text>
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Product list */}
        {wholesaleProducts === undefined ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#FFD400" />
          </View>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No wholesale products"
            message="Check back soon for new deals"
          />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item: product }) => (
              <SupplierProductCard
                product={product}
                onPress={() => router.push(`/wholesale-product/${product._id}`)}
              />
            )}
          />
        )}

        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
