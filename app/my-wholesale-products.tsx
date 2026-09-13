import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppImage } from "@/components/ui/AppImage";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatPrice } from "@/lib/formatters";
import { useToast } from "@/providers/ToastProvider";

type WholesaleRow = {
  _id: Id<"wholesaleProducts">;
  name: string;
  category?: string;
  pricePerUnit: number;
  minOrder: number;
  supplierLocation: string;
  imageUrl: string;
};

export default function MyWholesaleProductsScreen() {
  const listQuery = useQuery(api.wholesaleProducts.listBySupplier, {});
  const items = (listQuery ?? []) as WholesaleRow[];
  const removeProduct = useMutation(api.wholesaleProducts.remove);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [confirmDelete, setConfirmDelete] = useState<{
    id: Id<"wholesaleProducts">;
    name: string;
  } | null>(null);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await removeProduct({ id: confirmDelete.id });
      showSuccess("Product deleted.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not delete product.");
    }
    setConfirmDelete(null);
  };

  const isLoading = listQuery === undefined;

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-mont-bold text-xl text-white">
            My Wholesale Products
          </Text>
          <Text className="font-mont-medium text-sm text-text-secondary">
            {items.length} listed
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/create-product")}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
        >
          <Ionicons name="add" size={22} color="#FFD400" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-mont text-sm text-text-secondary mb-4 text-center">
            You haven't listed any wholesale products yet.
          </Text>
          <Button
            title="Add Your First Product"
            onPress={() => router.push("/create-product")}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        >
          {items.map((item) => (
            <View
              key={item._id}
              className="mb-3 rounded-card bg-card flex-row overflow-hidden"
            >
              <Pressable
                onPress={() =>
                  router.push(`/wholesale-product/${item._id}`)
                }
                className="flex-row flex-1"
              >
                <AppImage
                  source={item.imageUrl}
                  style={{ width: 80, height: 80 }}
                />
                <View className="flex-1 p-3 justify-center">
                  <Text
                    className="font-mont-medium text-sm text-white"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="font-mont text-xs text-text-secondary mt-0.5">
                    {item.category ?? "Uncategorized"} · {item.supplierLocation}
                  </Text>
                  <Text className="font-mont-bold text-sm text-primary mt-1">
                    {formatPrice(item.pricePerUnit)}
                  </Text>
                  <Text className="font-mont text-[10px] text-text-secondary mt-0.5">
                    Min order: {item.minOrder}
                  </Text>
                </View>
              </Pressable>
              <View className="p-2 justify-center gap-2">
                <Pressable
                  onPress={() =>
                    router.push(`/edit-wholesale-product?id=${item._id}`)
                  }
                  className="h-8 w-8 rounded-full bg-surface items-center justify-center"
                >
                  <Ionicons name="pencil-outline" size={14} color="#898989" />
                </Pressable>
                <Pressable
                  onPress={() =>
                    setConfirmDelete({ id: item._id, name: item.name })
                  }
                  className="h-8 w-8 rounded-full bg-surface items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={14} color="#898989" />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <ConfirmModal
        visible={!!confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name ?? ""}"? This action cannot be undone.`}
        highlight={confirmDelete?.name ? `"${confirmDelete.name}"` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </ScreenContainer>
  );
}
