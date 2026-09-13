import { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { RadioButton } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatPrice } from "@/lib/formatters";
import { isValidPhone, formatPhoneHint } from "@/lib/validation";
import { getWilayaOptions, getCommuneOptions } from "@/lib/algeriaData";
import { useToast } from "@/providers/ToastProvider";

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

export default function WholesaleCheckoutScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { showError } = useToast();
  const cartSummary = useQuery(api.cart.getWholesaleCartSummary);
  const createWholesaleOrder = useMutation(api.orders.createWholesaleOrder);

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

  // Group items by supplier
  const supplierGroups = useMemo(() => {
    if (!cartSummary?.items) return [];
    const grouped = new Map<
      string,
      { supplierName: string; items: typeof cartSummary.items; subtotal: number }
    >();
    for (const item of cartSummary.items) {
      const key = item.product.supplierId;
      const existing = grouped.get(key);
      const lineTotal = item.product.pricePerUnit * item.quantity;
      if (existing) {
        existing.items.push(item);
        existing.subtotal += lineTotal;
      } else {
        grouped.set(key, {
          supplierName: item.product.supplierName,
          items: [item],
          subtotal: lineTotal,
        });
      }
    }
    return Array.from(grouped.values());
  }, [cartSummary?.items]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = formatPhoneHint();
    }
    if (!address.trim()) newErrors.address = "Address is required";
    if (!wilaya) newErrors.wilaya = "Wilaya is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!cartSummary || cartSummary.items.length === 0) return;
    setLoading(true);

    try {
      const selectedWilaya = wilayaOptions.find((w) => w.value === wilaya);
      const orderId = await createWholesaleOrder({
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.replace(/\s/g, ""),
          address: address.trim(),
          city: commune || selectedWilaya?.label || wilaya,
          wilayaCode: wilaya,
          wilayaName: selectedWilaya?.label,
          commune: commune || undefined,
        },
      });
      router.replace(`/order-confirmation?orderId=${orderId}`);
    } catch {
      showError("Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  if (cartSummary === undefined) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD400" />
      </SafeAreaView>
    );
  }

  if (!cartSummary || cartSummary.items.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background items-center justify-center px-4">
        <Text className="font-mont-bold text-lg text-white mb-2">
          Your wholesale cart is empty
        </Text>
        <Button
          title="Continue Shopping"
          onPress={() => router.replace("/(grociste)/home")}
          variant="outline"
        />
      </SafeAreaView>
    );
  }

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
            <Text className="font-mont-bold">WHOLESALE </Text>
            <Text className="font-mont text-lg text-text-secondary">
              Checkout
            </Text>
          </Text>
        </View>

        {/* Items grouped by supplier */}
        {supplierGroups.map((group) => (
          <View key={group.supplierName} className="mx-4 mb-4 rounded-card bg-card p-3">
            <Text className="font-mont-semibold text-sm text-white mb-2">
              {group.supplierName}
            </Text>
            {group.items.map((item) => (
              <View
                key={item._id}
                className="flex-row items-center py-2"
                style={{ gap: 10 }}
              >
                <AppImage
                  source={item.product.imageUrl}
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                />
                <View className="flex-1">
                  <Text
                    className="font-mont-medium text-sm text-white"
                    numberOfLines={1}
                  >
                    {item.product.name}
                  </Text>
                  <Text className="font-mont text-xs text-text-secondary">
                    x{item.quantity} @ {formatPrice(item.product.pricePerUnit)}
                  </Text>
                </View>
                <Text className="font-mont-bold text-sm text-primary">
                  {formatPrice(item.product.pricePerUnit * item.quantity)}
                </Text>
              </View>
            ))}
            <View className="border-t border-[#333] mt-2 pt-2 flex-row justify-between">
              <Text className="font-mont-medium text-xs text-text-secondary">
                Subtotal
              </Text>
              <Text className="font-mont-bold text-sm text-primary">
                {formatPrice(group.subtotal)}
              </Text>
            </View>
          </View>
        ))}

        {/* Total */}
        <View className="mx-4 mb-4 rounded-card bg-card p-4 flex-row justify-between items-center">
          <Text className="font-mont-bold text-base text-white">Total</Text>
          <Text className="font-mont-bold text-xl text-primary">
            {formatPrice(cartSummary.total)}
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

        {/* Payment info */}
        <View className="mx-4 mt-4 rounded-card p-4" style={{ backgroundColor: "rgba(169,169,169,0.12)" }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Ionicons name="cash-outline" size={20} color="#FFD400" />
            <Text className="font-mont-semibold text-sm text-white">
              Cash on Delivery (COD)
            </Text>
          </View>
          <Text className="font-mont text-xs text-text-secondary mt-1">
            Pay when you receive your order
          </Text>
        </View>

        {/* Buttons */}
        <View className="flex-row items-center px-4 mt-6" style={{ gap: 12 }}>
          <Pressable onPress={() => router.back()} className="py-3">
            <Text className="font-mont-medium text-sm text-white">Cancel</Text>
          </Pressable>
          <View className="flex-1">
            <Button
              title={`Confirm Order – ${formatPrice(cartSummary.total)}`}
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
