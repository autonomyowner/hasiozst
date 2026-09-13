import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { RadioButton } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/providers/ToastProvider";
import { useUserRole } from "@/hooks/useUserRole";

const PRODUCT_TYPES = [
  { label: "Express", value: "express", description: "Standard product listing" },
  { label: "Grocery", value: "grocery", description: "Food & perishable goods" },
  { label: "Importer", value: "importer", description: "Imported / industrial goods" },
];

const MAX_IMAGES = 5;

export default function CreateProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { effectiveRole } = useUserRole();
  const isGrossiste = effectiveRole === "grossiste";
  const createProduct = useMutation(api.products.create);
  const createWholesaleProduct = useMutation(api.wholesaleProducts.create);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);
  const categories = useQuery(api.categories.list) ?? [];

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("express");
  const [description, setDescription] = useState("");

  // Grocery fields
  const [stockQuantity, setStockQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [storageCondition, setStorageCondition] = useState("");

  // Importer fields
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

  const categoryOptions = categories
    .filter((c) => c.slug !== "all")
    .map((c) => ({ label: c.label, value: c.slug }));

  const pickImage = async () => {
    if (imageUris.length >= MAX_IMAGES) {
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
        selectionLimit: MAX_IMAGES - imageUris.length,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        setImageUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
      }
    } catch {
      showError("Could not open image picker.");
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
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
    if (imageUris.length === 0) newErrors.images = "At least one image is required";
    if (isGrossiste) {
      if (!supplierLocation.trim())
        newErrors.supplierLocation = "Supplier location is required";
      if (!minOrder.trim() || isNaN(Number(minOrder)) || Number(minOrder) <= 0)
        newErrors.minOrder = "Valid minimum order is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setUploading(true);
    try {
      // Upload images
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < imageUris.length; i++) {
        setUploadStep(`Uploading image ${i + 1}/${imageUris.length}...`);
        const uri = imageUris[i];
        const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const url = await uploadFile(
          { uri, type: mimeType, name: `product-${i}.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
        uploadedImageUrls.push(url);
      }

      // Upload video if present
      let uploadedVideoUrl: string | undefined;
      if (videoUri) {
        setUploadStep("Uploading video...");
        const ext = videoUri.split(".").pop()?.toLowerCase() ?? "mp4";
        const mimeType = ext === "mov" ? "video/quicktime" : "video/mp4";
        uploadedVideoUrl = await uploadFile(
          { uri: videoUri, type: mimeType, name: `product-video.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      setUploadStep("Publishing product...");

      // Grossiste flow: create wholesale product instead of B2C product
      if (isGrossiste) {
        await createWholesaleProduct({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          category,
          pricePerUnit: Number(price),
          minOrder: Number(minOrder),
          imageUrl: uploadedImageUrls[0],
          images: uploadedImageUrls,
          supplierLocation: supplierLocation.trim(),
          ...(uploadedVideoUrl
            ? { hasVideo: true, videoUrl: uploadedVideoUrl }
            : {}),
          tags: [],
          productType: productType as "express" | "grocery" | "importer",
        });
        showSuccess("Wholesale product published successfully!");
        router.back();
        return;
      }

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

      await createProduct({
        name: name.trim(),
        price: Number(price),
        imageUrl: uploadedImageUrls[0],
        images: uploadedImageUrls,
        category,
        ...(tagline.trim() ? { tagline: tagline.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        productType: productType as "express" | "grocery" | "importer",
        isNew: true,
        ...(uploadedVideoUrl ? { videoUrl: uploadedVideoUrl } : {}),
        ...(stockQuantity ? { stockQuantity: Number(stockQuantity) } : {}),
        ...(productType === "grocery" && expirationDate.trim()
          ? { expirationDate: expirationDate.trim() }
          : {}),
        ...(productType === "grocery" && storageCondition.trim()
          ? { storageCondition: storageCondition.trim() }
          : {}),
        ...(productType === "importer" && minOrder
          ? { minOrder: Number(minOrder) }
          : {}),
        ...(productType === "importer" && supplierLocation.trim()
          ? { supplierLocation: supplierLocation.trim() }
          : {}),
        ...(specs ? { specs } : {}),
        ...(badge.trim() ? { badge: badge.trim() } : {}),
      });

      showSuccess("Product published successfully!");
      router.back();
    } catch (err) {
      showError("Could not publish product. Please try again.");
    } finally {
      setUploading(false);
      setUploadStep("");
    }
  };

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
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-white">
            {isGrossiste ? "Add Wholesale Product" : "Add Product"}
          </Text>
        </View>

        <View className="px-4">
          {/* Image gallery */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Images <Text className="text-text-secondary">({imageUris.length}/{MAX_IMAGES})</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-1"
          >
            {imageUris.map((uri, index) => (
              <View key={index} className="mr-2 relative">
                <AppImage
                  source={uri}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
                {index === 0 && (
                  <View className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-b-xl py-0.5">
                    <Text className="font-mont text-[9px] text-black text-center">
                      Main
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {imageUris.length < MAX_IMAGES && (
              <Pressable
                onPress={pickImage}
                className="w-20 h-20 rounded-card bg-card items-center justify-center border border-dashed border-text-secondary/30"
              >
                <Ionicons name="add" size={28} color="#898989" />
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
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Video <Text className="text-text-secondary">(optional, max 60s)</Text>
          </Text>
          <Pressable
            onPress={pickVideo}
            className="rounded-card bg-card items-center justify-center py-6 mb-4"
          >
            {videoUri ? (
              <View className="flex-row items-center">
                <Ionicons name="videocam" size={18} color="#FFD400" />
                <Text className="font-mont-medium text-sm text-primary ml-2">
                  Video selected
                </Text>
                <Pressable
                  onPress={() => setVideoUri(null)}
                  className="ml-3"
                >
                  <Ionicons name="close-circle" size={18} color="#898989" />
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
            label="Price (DA) *"
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

          {!isGrossiste && (
            <TextInput
              label="Stock Quantity"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="e.g. 120"
              keyboardType="numeric"
            />
          )}

          {/* Product type */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Product Type
          </Text>
          <View className="mb-3">
            <RadioButton
              options={PRODUCT_TYPES}
              value={productType}
              onChange={setProductType}
            />
          </View>

          {/* Grossiste-only required wholesale fields */}
          {isGrossiste && (
            <View className="rounded-card bg-surface/50 p-3 mb-3">
              <Text className="font-mont-semibold text-sm text-primary mb-2">
                Wholesale Details
              </Text>
              <TextInput
                label="Minimum Order *"
                value={minOrder}
                onChangeText={setMinOrder}
                placeholder="e.g. 10"
                keyboardType="numeric"
                error={errors.minOrder}
              />
              <TextInput
                label="Supplier Location *"
                value={supplierLocation}
                onChangeText={setSupplierLocation}
                placeholder="e.g. Algiers"
                error={errors.supplierLocation}
              />
            </View>
          )}

          {/* Conditional fields: Grocery (B2C only) */}
          {!isGrossiste && productType === "grocery" && (
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

          {/* Conditional fields: Importer (B2C only — grossiste uses wholesale block) */}
          {!isGrossiste && productType === "importer" && (
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
          <View className="mt-2 mb-8">
            {uploading ? (
              <View className="items-center py-4 gap-3">
                <ActivityIndicator color="#FFD400" />
                <Text className="font-mont text-sm text-text-secondary">
                  {uploadStep}
                </Text>
              </View>
            ) : (
              <Button title="Publish Product" onPress={handleSubmit} fullWidth />
            )}
          </View>
        </View>
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
