import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/providers/ToastProvider";

// TODO(hasio): replace with a Hasio-hosted thumbnail once the new Convex
// storage is provisioned. Must stay a string URL — reels store it in the DB.
const DEFAULT_THUMBNAIL = "";

export default function CreateReelScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { effectiveRole } = useUserRole();
  const createReel = useMutation(api.reels.create);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  const { showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickVideo = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your media library to pick a video.");
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

  const pickThumbnail = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your photo library to pick a thumbnail.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch {
      showError("Could not open image picker.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!productName.trim()) newErrors.productName = "Product name is required";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = "Valid price is required";
    if (!videoUri && !thumbnailUri)
      newErrors.media = "Pick a video or a thumbnail image";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setUploading(true);

    let uploadedVideoUrl: string | undefined;
    let uploadedThumbnailUrl: string = DEFAULT_THUMBNAIL;

    try {
      // Upload video first (larger file, more time)
      if (videoUri) {
        setUploadStep("Uploading video…");
        const ext = videoUri.split(".").pop()?.toLowerCase() ?? "mp4";
        const mimeType = ext === "mov" ? "video/quicktime" : "video/mp4";
        uploadedVideoUrl = await uploadFile(
          { uri: videoUri, type: mimeType, name: `reel.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      // Upload thumbnail
      if (thumbnailUri) {
        setUploadStep("Uploading thumbnail…");
        const ext = thumbnailUri.split(".").pop()?.toLowerCase() ?? "jpg";
        uploadedThumbnailUrl = await uploadFile(
          { uri: thumbnailUri, type: `image/${ext === "jpg" ? "jpeg" : ext}`, name: `thumb.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      setUploadStep("Publishing reel…");

      await createReel({
        videoUrl: uploadedVideoUrl,
        thumbnailUrl: uploadedThumbnailUrl,
        productName: productName.trim(),
        price: Number(price),
      });

      router.back();
    } catch (err) {
      showError("Could not publish reel. Please try again.");
    } finally {
      setUploading(false);
      setUploadStep("");
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
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-text-primary">Post a Reel</Text>
        </View>

        <View className="px-4">
          {/* Video picker */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Video <Text className="text-text-secondary">(optional, max 60s)</Text>
          </Text>
          <Pressable
            onPress={pickVideo}
            className="rounded-card bg-card items-center justify-center py-10 mb-4"
          >
            {videoUri ? (
              <>
                <Text className="font-mont-semibold text-sm text-primary">
                  Video selected
                </Text>
                <Text className="font-mont text-xs text-text-secondary mt-1">
                  Tap to change
                </Text>
              </>
            ) : (
              <Text className="font-mont text-sm text-text-secondary">
                Tap to pick a video
              </Text>
            )}
          </Pressable>

          {/* Thumbnail picker */}
          <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
            Thumbnail{" "}
            <Text className="text-text-secondary">
              {videoUri ? "(optional)" : "(required if no video)"}
            </Text>
          </Text>
          <Pressable
            onPress={pickThumbnail}
            className={`rounded-card bg-card items-center justify-center py-8 mb-1 ${
              errors.media ? "border border-red-500" : ""
            }`}
          >
            {thumbnailUri ? (
              <>
                <Text className="font-mont-semibold text-sm text-primary">
                  Thumbnail selected
                </Text>
                <Text className="font-mont text-xs text-text-secondary mt-1">
                  Tap to change
                </Text>
              </>
            ) : (
              <Text className="font-mont text-sm text-text-secondary">
                Tap to pick a cover image (9:16)
              </Text>
            )}
          </Pressable>
          {errors.media && (
            <Text className="font-mont text-xs text-red-400 mb-3">
              {errors.media}
            </Text>
          )}

          <View className="mb-1" />

          <TextInput
            label="Product Name"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Premium Olive Oil"
            error={errors.productName}
          />

          <TextInput
            label="Price (SAR)"
            value={price}
            onChangeText={setPrice}
            placeholder="4500"
            keyboardType="numeric"
            error={errors.price}
          />

          <View className="mt-4 mb-8">
            {uploading ? (
              <View className="items-center py-4 gap-3">
                <ActivityIndicator color="#1A4B5F" />
                <Text className="font-mont text-sm text-text-secondary">
                  {uploadStep}
                </Text>
              </View>
            ) : (
              <Button title="Publish Reel" onPress={handleSubmit} fullWidth />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
