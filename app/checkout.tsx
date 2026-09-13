import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { RadioButton } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { useCart } from "@/hooks/useCart";
import { useOrderActions } from "@/hooks/useOrderActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatPrice } from "@/lib/formatters";
import { getWilayaOptions, getCommuneOptions } from "@/lib/algeriaData";
import { isValidPhone, formatPhoneHint } from "@/lib/validation";

const deliveryMethods = [
  {
    label: "Home Delivery",
    value: "home",
    description: "Delivered directly to your address (24-72h)",
  },
  {
    label: "Office Pickup",
    value: "office",
    description: "Pick up from courier office near you",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total } = useCart();
  const { user } = useCurrentUser();
  const { placeOrder } = useOrderActions();

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("home");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const wilayaOptions = getWilayaOptions();
  const communeOptions = getCommuneOptions(wilaya);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = fullName.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName) {
      newErrors.fullName = "Full name is required";
    } else if (trimmedName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (trimmedName.length > 100) {
      newErrors.fullName = "Full name is too long (max 100)";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = formatPhoneHint();
    }
    if (!trimmedAddress) {
      newErrors.address = "Address is required";
    } else if (trimmedAddress.length < 3) {
      newErrors.address = "Address must be at least 3 characters";
    } else if (trimmedAddress.length > 500) {
      newErrors.address = "Address is too long (max 500)";
    }
    if (!wilaya) newErrors.wilaya = "Wilaya is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate() || items.length === 0) return;
    setLoading(true);

    try {
      const selectedWilaya = wilayaOptions.find((w) => w.value === wilaya);
      const orderId = await placeOrder({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: commune || selectedWilaya?.label || wilaya,
        wilayaCode: wilaya,
        wilayaName: selectedWilaya?.label,
        commune: commune || undefined,
      });
      router.replace(`/order-confirmation?orderId=${orderId}`);
    } catch {
      // useOrderActions.placeOrder already shows a toast with the real error.
      // Just reset loading so the user can retry.
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background items-center justify-center px-4">
        <Text className="font-mont-bold text-lg text-white mb-2">
          Your cart is empty
        </Text>
        <Button
          title="Continue Shopping"
          onPress={() => router.replace("/(main)/home")}
          variant="outline"
        />
      </SafeAreaView>
    );
  }

  const firstItem = items[0];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <View className="px-4 pt-2 mb-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Title */}
        <View className="px-4 mb-4">
          <Text className="font-mont-bold text-2xl text-white">
            <Text className="font-mont-bold">DELIVERY </Text>
            <Text className="font-mont text-lg text-text-secondary">
              Checkout
            </Text>
          </Text>
        </View>

        {/* Product summary pill */}
        <View className="mx-4 mb-5 flex-row items-center rounded-card bg-card p-3">
          <AppImage
            source={firstItem.product.imageUrl}
            style={{ width: 44, height: 44, borderRadius: 10 }}
          />
          <View className="flex-1 ml-3">
            <Text className="font-mont-semibold text-sm text-white" numberOfLines={1}>
              {firstItem.product.name}
            </Text>
            <Text className="font-mont text-xs text-text-secondary">
              x{firstItem.quantity}
            </Text>
          </View>
          <Text className="font-mont-bold text-sm text-primary">
            {formatPrice(total)}
          </Text>
        </View>

        {/* Contact Information */}
        <View className="px-4">
          <Text className="font-mont-bold text-base text-white mb-3">
            Contact Information
          </Text>

          <TextInput
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          <TextInput
            label="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            placeholder="Example: 05 XX XX XX XX"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <TextInput
            label="Delivery Address *"
            value={address}
            onChangeText={setAddress}
            placeholder="Delivery Address"
            error={errors.address}
          />

          <Dropdown
            label="Wilaya *"
            options={wilayaOptions}
            value={wilaya}
            onSelect={(val) => {
              setWilaya(val);
              setCommune("");
            }}
            placeholder="Select your wilaya"
            error={errors.wilaya}
          />

          <Dropdown
            label="Commune"
            options={communeOptions}
            value={commune}
            onSelect={setCommune}
            placeholder="Enter your commune"
          />
        </View>

        {/* Delivery Method */}
        <View className="px-4 mt-4">
          <Text className="font-mont-bold text-base text-white mb-3">
            Choose Delivery Method
          </Text>
          <RadioButton
            options={deliveryMethods}
            value={deliveryMethod}
            onChange={setDeliveryMethod}
          />
        </View>

        {/* Bottom buttons */}
        <View className="flex-row items-center px-4 mt-6" style={{ gap: 12 }}>
          <Pressable onPress={() => router.back()} className="py-3">
            <Text className="font-mont-medium text-sm text-white">
              Annuler
            </Text>
          </Pressable>
          <View className="flex-1">
            <Button
              title={`Confirm Order – ${formatPrice(total)}`}
              onPress={handlePlaceOrder}
              loading={loading}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
