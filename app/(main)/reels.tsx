import { useIsFocused } from "expo-router";
import { ReelsContent } from "@/components/sections/ReelsContent";

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  return <ReelsContent isFocused={isFocused} />;
}
