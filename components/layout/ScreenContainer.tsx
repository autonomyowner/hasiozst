import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

interface ScreenContainerProps {
  children: ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function ScreenContainer({
  children,
  edges = ["top"],
}: ScreenContainerProps) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={edges} className="flex-1">
        <View className="flex-1">{children}</View>
      </SafeAreaView>
    </View>
  );
}
