import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@/lib/convex";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { RadioButton } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/providers/ToastProvider";

const PRODUCT_TYPES = [
  { label: "Express", value: "express", description: "Standard product listing" },
  { label: "Grocery", value: "grocery", description: "Food & perishable goods" },
  { label: "Importer", value: "importer", description: "Imported / industrial goods" },
];

const MAX_IMAGES = 5;

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useQuery(
    api.products.getById,
    id ? { id: id as Id<"products"> } : "skip"
  );
  const updateProduct = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);
  const categories = useQuery(api.categories.list) ?? [];

  // Track existing (already-uploaded) vs new (local) images
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("express");
  const [description, setDescription] = useState("");

  const [stockQuantity, setStockQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [storageCondition, setStorageCondition] = useState("");

  const [minOrder, setMinOrder] = useState("");
  const [supplierLocation, setSupplierLocation] = useState("");
  const [specPower, setSpecPower] = useState("");
  const [specCapacity, setSpecCapacity] = useState("");
  const [specWarranty, setSpecWarranty] = useState("");
  const [specMaterial, setSpecMaterial] = useState("");

  const [badge, setBadge] = useState("");

  const { showSuccess, showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasLoaded = useRef(false);

  // Pre-fill from product data (once)
  useEffect(() => {
    if (product && !hasLoaded.current) {
      hasLoaded.current = true;
      setName(product.name);
      setTagline(product.tagline ?? "");
      setPrice(String(product.price));
      setCategory(product.category);
      setProductType(product.productType ?? "express");
      setDescription(product.description ?? "");
      setBadge(product.badge ?? "");

      // Images
      const imgs = product.images ?? (product.imageUrl ? [product.imageUrl] : []);
      setExistingImageUrls(imgs);

      // Video
      setExistingVideoUrl(product.videoUrl ?? null);

      // Grocery
      setStockQuantity(product.stockQuantity ? String(product.stockQuantity) : "");
      setExpirationDate(product.expirationDate ?? "");
      setStorageCondition(product.storageCondition ?? "");

      // Importer
      setMinOrder(product.minOrder ? String(product.minOrder) : "");
      setSupplierLocation(product.supplierLocation ?? "");
      setSpecPower(product.specs?.power ?? "");
      setSpecCapacity(product.specs?.capacity ?? "");
      setSpecWarranty(product.specs?.warranty ?? "");
      setSpecMaterial(product.specs?.material ?? "");
    }
  }, [product]);

  const categoryOptions = categories
    .filter((c) => c.slug !== "all")
    .map((c) => ({ label: c.label, value: c.slug }));

  const totalImages = existingImageUrls.length + newImageUris.length;

  const pickImage = async () => {
    if (totalImages >= MAX_IMAGES) {
      showError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - totalImages,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        setNewImageUris((prev) =>
          [...prev, ...newUris].slice(0, MAX_IMAGES - existingImageUrls.length)
        );
      }
    } catch {
      showError("Could not open image picker.");
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your media library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });
      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setExistingVideoUrl(null);
      }
    } catch {
      showError("Could not open video picker.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Product name is required";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = "Valid price is required";
    if (!category) newErrors.category = "Category is required";
    if (totalImages === 0) newErrors.images = "At least one image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) return;

    setUploading(true);
    try {
      // Upload new images
      const newUploadedUrls: string[] = [];
      for (let i = 0; i < newImageUris.length; i++) {
        setUploadStep(`Uploading new image ${i + 1}/${newImageUris.length}...`);
        const uri = newImageUris[i];
        const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const url = await uploadFile(
          { uri, type: mimeType, name: `product-${i}.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
        newUploadedUrls.push(url);
      }

      const allImageUrls = [...existingImageUrls, ...newUploadedUrls];

      // Upload new video if changed
      let videoUrl: string | undefined = existingVideoUrl ?? undefined;
      if (videoUri) {
        setUploadStep("Uploading video...");
        const ext = videoUri.split(".").pop()?.toLowerCase() ?? "mp4";
        const mimeType = ext === "mov" ? "video/quicktime" : "video/mp4";
        videoUrl = await uploadFile(
          { uri: videoUri, type: mimeType, name: `product-video.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      setUploadStep("Saving changes...");

      const specs =
        productType === "importer" &&
        (specPower || specCapacity || specWarranty || specMaterial)
          ? {
              ...(specPower ? { power: specPower } : {}),
              ...(specCapacity ? { capacity: specCapacity } : {}),
              ...(specWarranty ? { warranty: specWarranty } : {}),
              ...(specMaterial ? { material: specMaterial } : {}),
            }
          : undefined;

      await updateProduct({
        id: id as Id<"products">,
        name: name.trim(),
        price: Number(price),
        imageUrl: allImageUrls[0],
        images: allImageUrls,
        category,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        productType: productType as "express" | "grocery" | "importer",
        videoUrl: videoUrl || undefined,
        stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
        expirationDate:
          productType === "grocery" && expirationDate.trim()
            ? expirationDate.trim()
            : undefined,
        storageCondition:
          productType === "grocery" && storageCondition.trim()
            ? storageCondition.trim()
            : undefined,
        minOrder:
          productType === "importer" && minOrder
            ? Number(minOrder)
            : undefined,
        supplierLocation:
          productType === "importer" && supplierLocation.trim()
            ? supplierLocation.trim()
            : undefined,
        specs,
        badge: badge.trim() || undefined,
      });

      showSuccess("Product updated successfully!");
      router.back();
    } catch (err) {
      showError("Could not update product. Please try again.");
    } finally {
      setUploading(false);
      setUploadStep("");
    }
  };

  if (!product) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A4B5F" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-text-primary">
            Edit Product
          </Text>
        </View>

        <View className="px-4">
          {/* Image gallery */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Images <Text className="text-text-secondary">({totalImages}/{MAX_IMAGES})</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-1"
          >
            {existingImageUrls.map((url, index) => (
              <View key={`existing-${index}`} className="mr-2 relative">
                <AppImage
                  source={url}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => removeExistingImage(index)}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </Pressable>
                {index === 0 && newImageUris.length === 0 && (
                  <View className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-b-xl py-0.5">
                    <Text className="font-mont text-[9px] text-white text-center">
                      Main
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {newImageUris.map((uri, index) => (
              <View key={`new-${index}`} className="mr-2 relative">
                <AppImage
                  source={uri}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => removeNewImage(index)}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </Pressable>
                <View className="absolute bottom-0 left-0 right-0 bg-blue-500/80 rounded-b-xl py-0.5">
                  <Text className="font-mont text-[9px] text-text-primary text-center">
                    New
                  </Text>
                </View>
              </View>
            ))}
            {totalImages < MAX_IMAGES && (
              <Pressable
                onPress={pickImage}
                className="w-20 h-20 rounded-card bg-card items-center justify-center border border-dashed border-text-secondary/30"
              >
                <Ionicons name="add" size={28} color="#5F6E63" />
              </Pressable>
            )}
          </ScrollView>
          {errors.images && (
            <Text className="font-mont text-xs text-red-400 mb-2">
              {errors.images}
            </Text>
          )}
          <View className="mb-2" />

          {/* Video */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Video <Text className="text-text-secondary">(optional)</Text>
          </Text>
          <Pressable
            onPress={pickVideo}
            className="rounded-card bg-card items-center justify-center py-6 mb-4"
          >
            {videoUri || existingVideoUrl ? (
              <View className="flex-row items-center">
                <Ionicons name="videocam" size={18} color="#1A4B5F" />
                <Text className="font-mont-medium text-sm text-primary ml-2">
                  {videoUri ? "New video selected" : "Video attached"}
                </Text>
                <Pressable
                  onPress={() => {
                    setVideoUri(null);
                    setExistingVideoUrl(null);
                  }}
                  className="ml-3"
                >
                  <Ionicons name="close-circle" size={18} color="#5F6E63" />
                </Pressable>
              </View>
            ) : (
              <Text className="font-mont text-sm text-text-secondary">
                Tap to add product video
              </Text>
            )}
          </Pressable>

          {/* Basic info */}
          <TextInput
            label="Product Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Premium Office Chair"
            error={errors.name}
          />
          <TextInput
            label="Tagline"
            value={tagline}
            onChangeText={setTagline}
            placeholder="Short tagline for the product"
          />
          <TextInput
            label="Price (SAR) *"
            value={price}
            onChangeText={setPrice}
            placeholder="6000"
            keyboardType="numeric"
            error={errors.price}
          />
          <Dropdown
            label="Category *"
            options={categoryOptions}
            value={category}
            onSelect={setCategory}
            placeholder="Select category"
            error={errors.category}
          />
          <TextInput
            label="Stock Quantity"
            value={stockQuantity}
            onChangeText={setStockQuantity}
            placeholder="e.g. 120"
            keyboardType="numeric"
          />

          {/* Product type */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Product Type
          </Text>
          <View className="mb-3">
            <RadioButton
              options={PRODUCT_TYPES}
              value={productType}
              onChange={setProductType}
            />
          </View>

          {/* Conditional fields: Grocery */}
          {productType === "grocery" && (
            <View className="rounded-card bg-surface/50 p-3 mb-3">
              <Text className="font-mont-semibold text-sm text-primary mb-2">
                Grocery Details
              </Text>
              <TextInput
                label="Expiration Date"
                value={expirationDate}
                onChangeText={setExpirationDate}
                placeholder="15 Dec 2026"
              />
              <TextInput
                label="Storage Condition"
                value={storageCondition}
                onChangeText={setStorageCondition}
                placeholder="Store in cool & dry place"
                multiline
                numberOfLines={2}
              />
              <TextInput
                label="Badge"
                value={badge}
                onChangeText={setBadge}
                placeholder="e.g. Organic"
              />
            </View>
          )}

          {/* Conditional fields: Importer */}
          {productType === "importer" && (
            <View className="rounded-card bg-surface/50 p-3 mb-3">
              <Text className="font-mont-semibold text-sm text-primary mb-2">
                Importer Details
              </Text>
              <TextInput
                label="Minimum Order"
                value={minOrder}
                onChangeText={setMinOrder}
                placeholder="5"
                keyboardType="numeric"
              />
              <TextInput
                label="Supplier Location"
                value={supplierLocation}
                onChangeText={setSupplierLocation}
                placeholder="e.g. Dubai, UAE"
              />
              <TextInput
                label="Badge"
                value={badge}
                onChangeText={setBadge}
                placeholder="e.g. Imported"
              />
              <Text className="font-mont-medium text-xs text-text-secondary mb-2 mt-1">
                Specifications
              </Text>
              <TextInput
                label="Power"
                value={specPower}
                onChangeText={setSpecPower}
                placeholder="e.g. 220V"
              />
              <TextInput
                label="Capacity"
                value={specCapacity}
                onChangeText={setSpecCapacity}
                placeholder="e.g. 12L"
              />
              <TextInput
                label="Warranty"
                value={specWarranty}
                onChangeText={setSpecWarranty}
                placeholder="e.g. 1 Year"
              />
              <TextInput
                label="Material"
                value={specMaterial}
                onChangeText={setSpecMaterial}
                placeholder="e.g. Stainless Steel"
              />
            </View>
          )}

          {/* Description */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product in detail..."
            multiline
            numberOfLines={5}
            style={{ textAlignVertical: "top", minHeight: 120 }}
          />

          {/* Submit */}
          <View className="mt-2 mb-24">
            {uploading ? (
              <View className="items-center py-4 gap-3">
                <ActivityIndicator color="#1A4B5F" />
                <Text className="font-mont text-sm text-text-secondary">
                  {uploadStep}
                </Text>
              </View>
            ) : (
              <Button title="Save Changes" onPress={handleSubmit} fullWidth />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
