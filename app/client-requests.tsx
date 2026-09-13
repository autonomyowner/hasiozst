import { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClientRequestCard } from "@/components/cards/ClientRequestCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  useClientRequests,
  useClientRequestActions,
} from "@/hooks/useClientRequests";
import type { ClientRequestStatus, ClientRequest } from "@/lib/types";

type FilterTab = "all" | ClientRequestStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function ClientRequestsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();
  const { requests, isLoading } = useClientRequests(
    activeTab === "all" ? undefined : (activeTab as ClientRequestStatus)
  );
  const { accept, decline, complete, clearAll } = useClientRequestActions();

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD400" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          {requests.length > 0 && (
            <Pressable
              onPress={() => setShowClearModal(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-card"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>
        <Text className="font-mont-bold text-xl text-white">
          Client Requests
        </Text>
        <Text className="font-mont text-sm text-text-secondary mt-0.5">
          Manage and respond to incoming service requests.
        </Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row mx-4 mb-4" style={{ gap: 8 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`rounded-pill px-4 py-2 ${
              activeTab === tab.key ? "bg-primary" : "bg-card"
            }`}
          >
            <Text
              className={`font-mont-medium text-xs ${
                activeTab === tab.key ? "text-black" : "text-white"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Request list */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ClientRequestCard
            request={item as ClientRequest}
            onAccept={
              item.status === "new"
                ? () => accept(item._id)
                : undefined
            }
            onDecline={
              item.status === "new"
                ? () => decline(item._id)
                : undefined
            }
            onComplete={
              item.status === "in_progress"
                ? () => complete(item._id)
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="font-mont-medium text-base text-white mb-2">
              No client requests yet.
            </Text>
            <Text className="font-mont text-sm text-text-secondary text-center px-10">
              When clients send service requests, they&apos;ll appear here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <ConfirmModal
        visible={showClearModal}
        title="Clear All Requests"
        message="This will permanently delete all your client requests. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={() => {
          clearAll();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </SafeAreaView>
  );
}
