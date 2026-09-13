import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { uploadFile } from "@/lib/upload";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "@/providers/ToastProvider";

const CATEGORIES = [
  "Design",
  "Development",
  "Marketing",
  "Writing",
  "Video",
  "Photography",
  "Consulting",
  "Other",
];

const MAX_IMAGES = 5;

export default function CreateServiceScreen() {
  const router = useRouter();
  const createService = useMutation(api.freelanceServices.create);
  const { showSuccess, showError } = useToast();
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImages = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        videoMaxDuration: 60,
        quality: 0.8,
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
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim())
      newErrors.description = "Description is required";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = "Valid price is required";
    if (imageUris.length === 0)
      newErrors.images = "At least 1 image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setUploading(true);
    const uploadedImageUrls: string[] = [];

    try {
      // Upload images
      for (let i = 0; i < imageUris.length; i++) {
        setUploadStep(`Uploading images (${i + 1}/${imageUris.length})...`);
        const uri = imageUris[i];
        const ext = uri.split(".").pop() ?? "jpg";
        const url = await uploadFile(
          { uri, type: `image/${ext}`, name: `service-${i}.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
        uploadedImageUrls.push(url);
      }

      // Upload video (if selected)
      let uploadedVideoUrl: string | undefined;
      if (videoUri) {
        setUploadStep("Uploading video...");
        const ext = videoUri.split(".").pop() ?? "mp4";
        uploadedVideoUrl = await uploadFile(
          { uri: videoUri, type: `video/${ext}`, name: `service-video.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      }

      // Create service
      setUploadStep("Publishing service...");
      await createService({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        images: uploadedImageUrls,
        ...(uploadedVideoUrl ? { videoUrl: uploadedVideoUrl } : {}),
      });

      setUploading(false);
      showSuccess("Service published!");
      router.back();
    } catch {
      showError("Failed to publish service. Try again.");
      setUploading(false);
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
            Create Service
          </Text>
        </View>

        <View className="px-4">
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Professional Logo Design"
            error={errors.title}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you offer, your experience, deliverables..."
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: "top", minHeight: 100 }}
            error={errors.description}
          />

          <TextInput
            label="Price (DA)"
            value={price}
            onChangeText={setPrice}
            placeholder="15000"
            keyboardType="numeric"
            error={errors.price}
          />

          {/* Category selector */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`mr-2 px-4 py-2 rounded-pill ${
                  category === cat ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`font-mont-medium text-sm ${
                    category === cat ? "text-black" : "text-text-secondary"
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Portfolio Images */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Portfolio Images ({imageUris.length}/{MAX_IMAGES})
          </Text>
          {errors.images && (
            <Text className="font-mont text-xs text-error mb-1">
              {errors.images}
            </Text>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {imageUris.map((uri, index) => (
              <View key={uri} className="mr-2 relative">
                <Image
                  source={{ uri }}
                  style={{ width: 88, height: 88, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-error rounded-full w-5 h-5 items-center justify-center"
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {imageUris.length < MAX_IMAGES && (
              <Pressable
                onPress={pickImages}
                className="rounded-card bg-card items-center justify-center"
                style={{ width: 88, height: 88 }}
              >
                <Ionicons name="add" size={28} color="#888" />
                <Text className="font-mont text-[10px] text-text-secondary mt-0.5">
                  Add
                </Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Video picker */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Demo Video (optional, max 60s)
          </Text>
          <Pressable
            onPress={videoUri ? () => setVideoUri(null) : pickVideo}
            className="rounded-card bg-card flex-row items-center px-4 py-3 mb-4"
            style={{ gap: 10 }}
          >
            <Ionicons
              name={videoUri ? "videocam" : "videocam-outline"}
              size={22}
              color={videoUri ? "#FFD400" : "#888"}
            />
            <Text
              className={`font-mont text-sm flex-1 ${
                videoUri ? "text-primary" : "text-text-secondary"
              }`}
              numberOfLines={1}
            >
              {videoUri ? "Video selected — tap to remove" : "Tap to select video"}
            </Text>
            {videoUri && (
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            )}
          </Pressable>

          <View className="mt-2 mb-8">
            {uploading ? (
              <View className="items-center" style={{ gap: 8 }}>
                <ActivityIndicator color="#FFD400" />
                <Text className="font-mont text-xs text-text-secondary">
                  {uploadStep}
                </Text>
              </View>
            ) : (
              <Button title="Publish Service" onPress={handleSubmit} fullWidth />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
