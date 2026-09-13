import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useOfferActions } from "@/hooks/useOfferActions";
import { useToast } from "@/providers/ToastProvider";
import type { OfferType } from "@/lib/types";

export default function CreateOfferScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    productName?: string;
    minPrice?: string;
  }>();
  const router = useRouter();
  const { createOffer } = useOfferActions();
  const { showError } = useToast();

  const [title, setTitle] = useState(params.title ?? "");
  const [description, setDescription] = useState("");
  const [productName, setProductName] = useState(params.productName ?? "");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<OfferType>("auction");
  const [minPrice, setMinPrice] = useState(params.minPrice ?? "");
  const [deadline, setDeadline] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const categories = useQuery(api.categories.list) ?? [];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!productName.trim()) newErrors.productName = "Product name is required";
    if (!quantity.trim() || isNaN(Number(quantity)))
      newErrors.quantity = "Valid quantity is required";
    if (!unit.trim()) newErrors.unit = "Unit is required";
    if (!minPrice.trim() || isNaN(Number(minPrice)))
      newErrors.minPrice = "Valid minimum price is required";
    if (!deadline.trim()) newErrors.deadline = "Deadline is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || loading) return;
    setLoading(true);

    try {
      const offerId = await createOffer({
        title: title.trim(),
        description: description.trim(),
        productName: productName.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        type,
        minPrice: Number(minPrice),
        deadline: deadline.trim(),
        ...(selectedCategory ? { category: selectedCategory } : {}),
      });
      router.replace(`/offer/${offerId}`);
    } catch {
      showError("Failed to create offer. Please try again.");
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mb-2"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-white">
            Create Offer
          </Text>
        </View>

        <View className="px-4">
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Olive Oil Bulk - 500L"
            error={errors.title}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you're looking for..."
            multiline
            numberOfLines={3}
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />
          <TextInput
            label="Product Name"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Olive Oil"
            error={errors.productName}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="500"
                keyboardType="numeric"
                error={errors.quantity}
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="Unit"
                value={unit}
                onChangeText={setUnit}
                placeholder="liters, kg, pcs"
                error={errors.unit}
              />
            </View>
          </View>

          {/* Type Selector */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Offer Type
          </Text>
          <View className="flex-row rounded-card bg-surface p-1 mb-3">
            {(["auction", "negotiable"] as OfferType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className={`flex-1 items-center rounded-[10px] py-2.5 ${
                  type === t ? "bg-card" : ""
                }`}
              >
                <Text
                  className={`font-mont-semibold text-sm ${
                    type === t ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {t === "auction" ? "Auction" : "Negotiable"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Category Selector */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 12 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <Pressable
                  key={cat.slug}
                  onPress={() => setSelectedCategory(isActive ? "" : cat.slug)}
                  className={`rounded-pill px-4 py-2 ${isActive ? "" : ""}`}
                  style={{
                    backgroundColor: isActive ? "#FFD400" : "rgba(169,169,169,0.12)",
                  }}
                >
                  <Text
                    className={`font-mont-semibold text-[13px] ${
                      isActive ? "text-black" : "text-text-secondary"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            label="Minimum Price (DA)"
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="350000"
            keyboardType="numeric"
            error={errors.minPrice}
          />
          <TextInput
            label="Deadline (YYYY-MM-DD)"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="2026-03-15"
            error={errors.deadline}
          />

          <View className="mt-4 mb-8">
            <Button title="Create Offer" onPress={handleSubmit} loading={loading} fullWidth />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
