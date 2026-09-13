import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageCarousel } from "@/components/product/ImageCarousel";
import { AppImage } from "@/components/ui/AppImage";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { ContentMenu } from "@/components/ui/ContentMenu";
import { formatPrice } from "@/lib/formatters";
import { isValidPhone, formatPhoneHint } from "@/lib/validation";
import { useToast } from "@/providers/ToastProvider";
import { useGuest } from "@/providers/GuestProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import type { Id } from "../../convex/_generated/dataModel";

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const { isGuest, exitGuestMode } = useGuest();
  const { user } = useCurrentUser();
  const { getOrCreate } = useConversations();
  const service = useQuery(
    api.freelanceServices.getById,
    id ? { id: id as Id<"freelanceServices"> } : "skip"
  );
  const createRequest = useMutation(api.clientRequests.create);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (service === undefined) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </SafeAreaView>
    );
  }

  if (service === null) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background items-center justify-center px-4">
        <Text className="font-mont-bold text-lg text-white mb-2">
          Service not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </SafeAreaView>
    );
  }

  const handleRequestPress = () => {
    if (isGuest) {
      showInfo("Sign in to request a service");
      setTimeout(() => {
        exitGuestMode();
        router.push("/sign-in");
      }, 1500);
      return;
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = "Description is required";
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0)
      newErrors.budget = "Valid budget is required";
    if (phone.trim() && !isValidPhone(phone))
      newErrors.phone = formatPhoneHint();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await createRequest({
        freelancerId: service.freelancerId,
        serviceTitle: service.title,
        description: description.trim(),
        budget: Number(budget),
        ...(phone.trim() ? { phone: phone.replace(/\s/g, "") } : {}),
      });
      setShowRequestModal(false);
      setDescription("");
      setBudget("");
      setPhone("");
      showSuccess("Request sent successfully!");
    } catch {
      showError("Failed to send request. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const images = ((service.images && service.images.length > 0) ? service.images : [service.imageUrl])
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ImageCarousel images={images} videoUrl={service.videoUrl} onBack={() => router.back()} />

        {/* Service info */}
        <View className="px-4 pt-4">
          <Text className="font-mont-bold text-xl text-white">
            {service.title}
          </Text>
          <Text className="font-mont text-xs text-text-secondary mt-1">
            {service.category}
          </Text>

          {/* Freelancer info */}
          <View className="flex-row items-center mt-4 mb-3" style={{ gap: 10 }}>
            {service.freelancerAvatar ? (
              <AppImage
                source={service.freelancerAvatar}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <View
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="person" size={20} color="#555" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-mont-semibold text-sm text-white">
                {service.freelancerName}
              </Text>
              <Text className="font-mont text-xs text-text-secondary">
                {service.rating} ({service.completedJobs} jobs)
              </Text>
            </View>
            <ContentMenu
              targetType="freelanceService"
              targetId={service._id}
              ownerId={service.freelancerId}
              ownerName={service.freelancerName}
            />
          </View>

          {/* Price */}
          <View className="rounded-card bg-card p-4 mb-4">
            <Text className="font-mont text-xs text-text-secondary">
              Starting at
            </Text>
            <Text className="font-mont-bold text-2xl text-primary">
              {formatPrice(service.price)}
            </Text>
          </View>

          {/* Description */}
          <Text className="font-mont-bold text-base text-white mb-2">
            Description
          </Text>
          <Text className="font-mont text-sm text-text-secondary leading-5 mb-6">
            {service.description}
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons — lifted above Android nav bar */}
      <View className="px-4 pt-3 pb-12 border-t border-card" style={{ gap: 8 }}>
        {service.freelancerId !== user?._id && !isGuest && user && (
          <Pressable
            onPress={async () => {
              const convId = await getOrCreate(
                service.freelancerId,
                "service",
                service._id,
                service.title
              );
              if (convId) router.push(`/conversation/${convId}`);
            }}
            className="flex-row items-center justify-center rounded-card py-3.5"
            style={{ backgroundColor: "#0C0C0C", borderWidth: 1, borderColor: "#333", gap: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FFD400" />
            <Text className="font-mont-semibold text-sm text-primary">
              Message Freelancer
            </Text>
          </Pressable>
        )}
        <Button
          title="Request Service"
          onPress={handleRequestPress}
          fullWidth
        />
      </View>

      {/* Request modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRequestModal(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowRequestModal(false)}
          />
          <View
            className="bg-surface rounded-t-[20px] px-4 pt-4 pb-14"
            style={{ maxHeight: "80%" }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-mont-bold text-lg text-white">
                  Request Service
                </Text>
                <Pressable onPress={() => setShowRequestModal(false)}>
                  <Ionicons name="close" size={24} color="#898989" />
                </Pressable>
              </View>

              <TextInput
                label="What do you need?"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your project requirements..."
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top", minHeight: 80 }}
                error={errors.description}
              />

              <TextInput
                label="Budget (DA)"
                value={budget}
                onChangeText={setBudget}
                placeholder="15000"
                keyboardType="numeric"
                error={errors.budget}
              />

              <TextInput
                label="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="05 XX XX XX XX"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <View className="mt-2">
                <Button
                  title="Send Request"
                  onPress={handleSubmitRequest}
                  loading={loading}
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

