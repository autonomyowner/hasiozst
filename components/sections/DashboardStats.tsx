import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/lib/formatters";

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    growth: number;
    activeServices: number;
    pendingRequests: number;
    completedProjects: number;
    ongoingProjects: number;
    revenueThisMonth: number;
    completedThisMonth: number;
    servicesThisMonth: number;
  };
}

const statCardStyle = {
  backgroundColor: "rgba(169,169,169,0.18)",
  borderColor: "#666",
  borderWidth: 1,
  borderRadius: 16,
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <View className="mx-4 mt-3">
      {/* Statistics header */}
      <Text className="font-mont-bold text-xl text-white mb-3">
        Statistics
      </Text>

      {/* 2x2 grid */}
      <View className="flex-row gap-3">
        {/* Total Revenue Earned */}
        <View className="flex-1 p-4" style={statCardStyle}>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-lg text-primary">
              {formatPrice(stats.totalRevenue)}
            </Text>
            <Ionicons name="wallet-outline" size={18} color="#FFD400" />
          </View>
          <Text className="font-mont-semibold text-xs text-white mt-1">
            Total Revenue Earned
          </Text>
          <Text className="font-mont text-[10px] text-success mt-1.5">
            +{formatPrice(stats.revenueThisMonth)} This Month
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="time-outline" size={10} color="#898989" />
            <Text className="font-mont text-[9px] text-text-secondary ml-1">
              {stats.pendingRequests} Pending Request{stats.pendingRequests !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Completed Projects */}
        <View className="flex-1 p-4" style={statCardStyle}>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-lg text-white">
              {stats.completedProjects}
            </Text>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFD400" />
          </View>
          <Text className="font-mont-semibold text-xs text-white mt-1">
            Completed Projects
          </Text>
          <Text className="font-mont text-[10px] text-success mt-1.5">
            +{stats.completedThisMonth} This Month
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="checkmark" size={10} color="#22C55E" />
            <Text className="font-mont text-[9px] text-text-secondary ml-1">
              From client requests
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mt-3">
        {/* Ongoing Client Projects */}
        <View className="flex-1 p-4" style={statCardStyle}>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-lg text-white">
              {stats.ongoingProjects}
            </Text>
            <Ionicons name="happy-outline" size={18} color="#22C55E" />
          </View>
          <Text className="font-mont-semibold text-xs text-white mt-1">
            Ongoing Projects
          </Text>
          <Text className="font-mont text-[10px] text-text-secondary mt-1.5">
            Currently in progress
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="flame-outline" size={10} color="#FFD400" />
            <Text className="font-mont text-[9px] text-text-secondary ml-1">
              {stats.pendingRequests} New Request{stats.pendingRequests !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Active Services */}
        <View className="flex-1 p-4" style={statCardStyle}>
          <View className="flex-row items-center justify-between">
            <Text className="font-mont-bold text-lg text-white">
              {stats.activeServices}
            </Text>
            <Ionicons name="apps-outline" size={18} color="#FFD400" />
          </View>
          <Text className="font-mont-semibold text-xs text-white mt-1">
            Active Services
          </Text>
          <Text className="font-mont text-[10px] text-success mt-1.5">
            +{stats.servicesThisMonth} Added This Month
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="briefcase-outline" size={10} color="#898989" />
            <Text className="font-mont text-[9px] text-text-secondary ml-1">
              In your portfolio
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
