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

export default function EditWholesaleProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useQuery(
    api.wholesaleProducts.getById,
    id ? { id: id as Id<"wholesaleProducts"> } : "skip"
  );
  const updateProduct = useMutation(api.wholesaleProducts.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);
  const categories = useQuery(api.categories.list) ?? [];

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [supplierLocation, setSupplierLocation] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("express");
  const [description, setDescription] = useState("");

  const { showSuccess, showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (product && !hasLoaded.current) {
      hasLoaded.current = true;
      setName(product.name);
      setPricePerUnit(String(product.pricePerUnit));
      setMinOrder(String(product.minOrder));
      setSupplierLocation(product.supplierLocation ?? "");
      setCategory(product.category ?? "");
      setProductType(product.productType ?? "express");
      setDescription(product.description ?? "");

      const imgs =
        product.images && product.images.length > 0
          ? product.images
          : product.imageUrl
            ? [product.imageUrl]
            : [];
      setExistingImageUrls(imgs);
      setExistingVideoUrl(product.videoUrl ?? null);
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
    if (
      !pricePerUnit.trim() ||
      isNaN(Number(pricePerUnit)) ||
      Number(pricePerUnit) <= 0
    )
      newErrors.pricePerUnit = "Valid price is required";
    if (!minOrder.trim() || isNaN(Number(minOrder)) || Number(minOrder) <= 0)
      newErrors.minOrder = "Valid minimum order is required";
    if (!supplierLocation.trim())
      newErrors.supplierLocation = "Supplier location is required";
    if (totalImages === 0)
      newErrors.images = "At least one image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) return;

    setUploading(true);
    try {
      const newUploadedUrls: string[] = [];
      for (let i = 0; i < newImageUris.length; i++) {
        setUploadStep(`Uploading new image ${i + 1}/${newImageUris.length}...`);
        const uri = newImageUris[i];
        const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType =
          ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const url = await uploadFile(
          { uri, type: mimeType, name: `wholesale-${i}.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
        newUploadedUrls.push(url);
      }

      const allImageUrls = [...existingImageUrls, ...newUploadedUrls];

      let finalVideoUrl: string | undefined = existingVideoUrl ?? undefined;
      if (videoUri) {
        setUploadStep("Uploading video...");
        const ext = videoUri.split(".").pop()?.toLowerCase() ?? "mp4";
        const mimeType = ext === "mov" ? "video/quicktime" : "video/mp4";
        finalVideoUrl = await uploadFile(
          { uri: videoUri, type: mimeType, name: `wholesale-video.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      setUploadStep("Saving changes...");

      await updateProduct({
        id: id as Id<"wholesaleProducts">,
        name: name.trim(),
        pricePerUnit: Number(pricePerUnit),
        minOrder: Number(minOrder),
        supplierLocation: supplierLocation.trim(),
        imageUrl: allImageUrls[0],
        images: allImageUrls,
        category: category || undefined,
        description: description.trim() || undefined,
        productType: productType as "express" | "grocery" | "importer",
        videoUrl: finalVideoUrl,
        hasVideo: finalVideoUrl ? true : false,
      });

      showSuccess("Product updated successfully!");
      router.back();
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Could not update product. Please try again."
      );
    } finally {
      setUploading(false);
      setUploadStep("");
    }
  };

  if (product === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A4B5F" />
        </View>
      </ScreenContainer>
    );
  }

  if (product === null) {
    return (
      <ScreenContainer>
        <View className="px-4 py-3 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-text-primary">
            Edit Wholesale Product
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-mont text-sm text-text-secondary text-center">
            Product not found or you don't have permission to edit it.
          </Text>
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
            Edit Wholesale Product
          </Text>
        </View>

        <View className="px-4">
          {/* Image gallery */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Images{" "}
            <Text className="text-text-secondary">
              ({totalImages}/{MAX_IMAGES})
            </Text>
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
            Video <Text className="text-text-secondary">(optional, max 60s)</Text>
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
            placeholder="e.g. Bulk Olive Oil 5L"
            error={errors.name}
          />
          <TextInput
            label="Price per Unit (SAR) *"
            value={pricePerUnit}
            onChangeText={setPricePerUnit}
            placeholder="e.g. 1200"
            keyboardType="numeric"
            error={errors.pricePerUnit}
          />
          <Dropdown
            label="Category"
            options={categoryOptions}
            value={category}
            onSelect={setCategory}
            placeholder="Select category"
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

          {/* Wholesale details */}
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
