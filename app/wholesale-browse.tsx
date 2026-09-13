import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchBar } from "@/components/ui/SearchBar";
import { SupplierProductCard } from "@/components/cards/SupplierProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

type TabKey = "express" | "grocery" | "importer";
const tabs: { key: TabKey; label: string }[] = [
  { key: "express", label: "Express" },
  { key: "grocery", label: "Grocery" },
  { key: "importer", label: "Importer" },
];

const filterPills = ["All", "Amount", "Price"];

export default function WholesaleBrowseScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("express");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  const wholesaleProducts = useQuery(api.wholesaleProducts.list, {});

  const products = wholesaleProducts ?? [];
  const filteredProducts = searchText.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : products;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View className="px-4 pt-2 pb-1 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text style={{ fontFamily: "Montserrat_700Bold", fontSize: 20, color: "#0D1A12" }}>
            Wholesale <Text style={{ color: "#1A4B5F" }}>Products</Text>
          </Text>
        </View>

        {/* Search */}
        <View className="mt-2">
          <SearchBar
            placeholder="Search wholesale products..."
            onChangeText={setSearchText}
          />
        </View>

        {/* Tab switcher */}
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

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          {filterPills.map((pill) => (
            <Pressable
              key={pill}
              onPress={() => setSelectedFilter(pill)}
              className="mr-2 flex-row items-center rounded-pill px-4 py-1.5"
              style={{
                backgroundColor:
                  selectedFilter === pill
                    ? "#1A4B5F"
                    : "rgba(26,75,95,0.10)",
              }}
            >
              <Text
                className={`font-mont-medium text-xs ${
                  selectedFilter === pill ? "text-white" : "text-text-primary"
                }`}
              >
                {pill}
              </Text>
              {pill !== "All" && (
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={selectedFilter === pill ? "#FFFFFF" : "#0D1A12"}
                  style={{ marginLeft: 4 }}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Product list */}
        {wholesaleProducts === undefined ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#1A4B5F" />
          </View>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No wholesale products"
            message="Check back soon for new deals"
          />
        ) : (
          filteredProducts.map((product) => (
            <SupplierProductCard
              key={product._id}
              product={product}
              onPress={() => router.push(`/wholesale-product/${product._id}`)}
            />
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
