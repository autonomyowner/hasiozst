import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@/lib/convex";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/providers/ToastProvider";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.resolveUrl);

  const { showError } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [uploading, setUploading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarMimeType, setAvatarMimeType] = useState<string>("image/jpeg");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow access to your photo library to upload an avatar.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE) {
          showError("Image must be under 5MB. Please choose a smaller photo.");
          return;
        }
        setAvatarUri(asset.uri);
        setAvatarMimeType(asset.mimeType ?? "image/jpeg");
      }
    } catch {
      showError("Could not open image picker.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let newAvatarUrl: string | undefined;

    if (avatarUri) {
      setUploading(true);
      try {
        const ext = avatarMimeType.split("/")[1] ?? "jpeg";
        newAvatarUrl = await uploadFile(
          { uri: avatarUri, type: avatarMimeType, name: `avatar.${ext}` },
          generateUploadUrl,
          getStorageUrl
        );
      } catch {
        showError("Could not upload avatar. Try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await updateProfile({
        name: name.trim(),
        ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}),
      });
      router.back();
    } catch {
      showError("Failed to update profile. Try again.");
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A4B5F" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-3 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#0D1A12" />
          </Pressable>
          <Text className="font-mont-bold text-xl text-text-primary">Edit Profile</Text>
        </View>

        <View className="px-4">
          {/* Avatar picker */}
          <Pressable
            onPress={pickImage}
            className="items-center mb-6 mt-2"
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-2 overflow-hidden"
              style={{
                backgroundColor: avatarUri || user.avatar ? "transparent" : "#1A4B5F",
                borderWidth: 2,
                borderColor: "#E3DBCA",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: "700", color: "#FFFFFF" }}>
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              )}
            </View>
            <Text className="font-mont text-sm text-primary">
              {avatarUri ? "Tap to change" : "Tap to choose photo"}
            </Text>
          </Pressable>

          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            error={errors.name}
          />

          <View className="mt-4 mb-8">
            {uploading ? (
              <ActivityIndicator color="#1A4B5F" />
            ) : (
              <Button title="Save Changes" onPress={handleSubmit} fullWidth />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
