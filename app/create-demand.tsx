import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";

export default function CreateDemandScreen() {
  const router = useRouter();
  const createDemand = useMutation(api.demandRequests.create);
  const categoriesRaw = useQuery(api.categories.list) ?? [];
  const categories = categoriesRaw.filter((c) => c.slug !== "all");
  const { showSuccess, showError } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0)
      newErrors.budget = "Valid budget is required";
    if (!deadline.trim()) newErrors.deadline = "Deadline is required";
    if (phone.trim() && !/^0[5-7][0-9]{8}$/.test(phone.trim()))
      newErrors.phone = "Invalid phone (e.g. 05XXXXXXXX)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || loading) return;
    setLoading(true);

    try {
      await createDemand({
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        deadline: deadline.trim(),
        ...(category ? { category } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      showSuccess("Demand posted!");
      router.back();
    } catch {
      showError("Failed to post demand. Please try again.");
      setLoading(false);
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
            Post a Demand
          </Text>
        </View>

        <View className="px-4">
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. 500kg Olive Oil - Grade A"
            error={errors.title}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you need, quantity, quality requirements..."
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: "top", minHeight: 100 }}
            error={errors.description}
          />

          <TextInput
            label="Budget (DA)"
            value={budget}
            onChangeText={setBudget}
            placeholder="250000"
            keyboardType="numeric"
            error={errors.budget}
          />

          <TextInput
            label="Deadline (YYYY-MM-DD)"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="2026-03-15"
            error={errors.deadline}
          />

          <TextInput
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="05XXXXXXXX"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* Category selector (optional) */}
          <Text className="font-mont-medium text-sm text-white mb-1.5">
            Category (optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.slug}
                onPress={() => setCategory(category === cat.slug ? undefined : cat.slug)}
                className={`mr-2 px-4 py-2 rounded-pill ${
                  category === cat.slug ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`font-mont-medium text-sm ${
                    category === cat.slug ? "text-black" : "text-text-secondary"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mt-2 mb-8">
            <Button title="Post Demand" onPress={handleSubmit} loading={loading} fullWidth />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
