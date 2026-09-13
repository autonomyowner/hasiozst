import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput as RNTextInput,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppImage } from "@/components/ui/AppImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatPrice } from "@/lib/formatters";
import { useToast } from "@/providers/ToastProvider";

type ProductRow = {
  _id: Id<"products">;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isNew?: boolean;
  stockQuantity?: number;
};

export default function MyProductsScreen() {
  const activeQuery = useQuery(api.products.listBySeller);
  const inactiveQuery = useQuery(api.products.listInactiveBySeller);
  const active = (activeQuery ?? []) as ProductRow[];
  const inactive = (inactiveQuery ?? []) as ProductRow[];
  const removeProduct = useMutation(api.products.remove);
  const permanentDeleteProduct = useMutation(api.products.permanentDelete);
  const reactivateProduct = useMutation(api.products.reactivate);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [reactivateInputs, setReactivateInputs] = useState<
    Record<string, string>
  >({});
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await removeProduct({ id: confirmDelete.id as Id<"products"> });
      showSuccess("Product deleted.");
    } catch {
      showError("Could not delete product.");
    }
    setConfirmDelete(null);
  };

  const confirmPermanentDeleteAction = async () => {
    if (!confirmPermanentDelete) return;
    try {
      await permanentDeleteProduct({
        id: confirmPermanentDelete.id as Id<"products">,
      });
      showSuccess("Product permanently deleted.");
    } catch {
      showError("Could not delete product.");
    }
    setConfirmPermanentDelete(null);
  };

  const handleReactivate = async (id: Id<"products">) => {
    const raw = reactivateInputs[id] ?? "";
    const qty = Number(raw);
    if (!raw.trim() || !Number.isFinite(qty) || qty <= 0) {
      showError("Enter a stock quantity greater than 0");
      return;
    }
    setReactivatingId(id);
    try {
      await reactivateProduct({ id, stockQuantity: Math.floor(qty) });
      showSuccess("Product reactivated");
      setReactivateInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not reactivate");
    } finally {
      setReactivatingId(null);
    }
  };

  const isLoading = activeQuery === undefined && inactiveQuery === undefined;

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
          <Text className="font-mont-bold text-xl text-white">My Products</Text>
          <Text className="font-mont text-sm text-text-secondary">
            {active.length} active
            {inactive.length > 0 ? ` · ${inactive.length} inactive` : ""}
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
      ) : active.length === 0 && inactive.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-mont text-sm text-text-secondary mb-4 text-center">
            You haven't listed any products yet.
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
          {/* Active products */}
          {active.map((item) => (
            <View
              key={item._id}
              className="mb-3 rounded-card bg-card flex-row overflow-hidden"
            >
              <Pressable
                onPress={() => router.push(`/product/${item._id}`)}
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
                    {item.category}
                  </Text>
                  <Text className="font-mont-bold text-sm text-primary mt-1">
                    {formatPrice(item.price)}
                  </Text>
                  {item.stockQuantity !== undefined && (
                    <View
                      className="mt-1 flex-row items-center"
                      style={{ gap: 6 }}
                    >
                      {item.stockQuantity < 10 ? (
                        <View
                          className="rounded-pill px-2 py-0.5"
                          style={{ backgroundColor: "rgba(249,115,22,0.15)" }}
                        >
                          <Text className="font-mont-semibold text-[10px] text-[#F97316]">
                            Low Stock · {item.stockQuantity} left
                          </Text>
                        </View>
                      ) : (
                        <Text className="font-mont text-[10px] text-text-secondary">
                          {item.stockQuantity} in stock
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
              <View className="p-2 justify-center gap-2">
                {item.isNew && <Badge label="NEW" variant="primary" />}
                <Pressable
                  onPress={() => router.push(`/edit-product?id=${item._id}`)}
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

          {/* Inactive / out-of-stock products */}
          {inactive.length > 0 && (
            <View className="mt-4 mb-3">
              <Text className="font-mont-bold text-base text-white mb-1">
                Out of Stock
              </Text>
              <Text className="font-mont text-xs text-text-secondary mb-3">
                These products are hidden from buyers. Restock to bring them
                back.
              </Text>
              {inactive.map((item) => (
                <View
                  key={item._id}
                  className="mb-3 rounded-card bg-card overflow-hidden"
                  style={{ opacity: 0.9 }}
                >
                  <View className="flex-row">
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
                        {item.category}
                      </Text>
                      <Text className="font-mont-bold text-sm text-primary mt-1">
                        {formatPrice(item.price)}
                      </Text>
                      <View
                        className="mt-1 self-start rounded-pill px-2 py-0.5"
                        style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
                      >
                        <Text className="font-mont-semibold text-[10px] text-[#EF4444]">
                          Out of Stock
                        </Text>
                      </View>
                    </View>
                    <View className="p-2 justify-center">
                      <Pressable
                        onPress={() =>
                          setConfirmPermanentDelete({
                            id: item._id,
                            name: item.name,
                          })
                        }
                        className="h-8 w-8 rounded-full bg-surface items-center justify-center"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#EF4444"
                        />
                      </Pressable>
                    </View>
                  </View>
                  <View className="px-3 pb-3 pt-1">
                    <Text className="font-mont-medium text-xs text-white mb-1.5">
                      New Stock
                    </Text>
                    <View
                      className="flex-row items-center"
                      style={{ gap: 8 }}
                    >
                      <View className="flex-1">
                        <RNTextInput
                          className="rounded-card bg-surface px-4 py-3 font-mont text-sm text-white"
                          placeholderTextColor="#898989"
                          value={reactivateInputs[item._id] ?? ""}
                          onChangeText={(v) =>
                            setReactivateInputs((prev) => ({
                              ...prev,
                              [item._id]: v,
                            }))
                          }
                          placeholder="e.g. 50"
                          keyboardType="numeric"
                        />
                      </View>
                      <Pressable
                        onPress={() => handleReactivate(item._id)}
                        disabled={reactivatingId === item._id}
                        style={{
                          height: 46,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          backgroundColor: "#FFD400",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: reactivatingId === item._id ? 0.6 : 1,
                        }}
                      >
                        {reactivatingId === item._id ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Text className="font-mont-bold text-xs text-black">
                            Reactivate
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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

      <ConfirmModal
        visible={!!confirmPermanentDelete}
        title="Permanently Delete"
        message={`This will permanently delete "${confirmPermanentDelete?.name ?? ""}" and all associated reels, likes, comments, favorites, and cart items. This cannot be undone.`}
        highlight={
          confirmPermanentDelete?.name
            ? `"${confirmPermanentDelete.name}"`
            : undefined
        }
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmPermanentDeleteAction}
        onCancel={() => setConfirmPermanentDelete(null)}
      />
    </ScreenContainer>
  );
}
