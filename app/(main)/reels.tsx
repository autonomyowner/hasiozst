import { useIsFocused } from "@react-navigation/native";
import { ReelsContent } from "@/components/sections/ReelsContent";

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  return <ReelsContent isFocused={isFocused} />;
}
