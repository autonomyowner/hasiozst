import { useState, useCallback } from "react";
import { Image, ImageStyle, StyleProp, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface AppImageProps {
  source: string;
  style?: StyleProp<ImageStyle>;
  className?: string;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

export function AppImage({
  source,
  style,
  className,
  resizeMode = "cover",
}: AppImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  if (!source) return null;

  if (error) {
    return (
      <View
        style={[{ backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" }, style as object]}
        className={className}
      >
        <Ionicons name="image-outline" size={24} color="#555" />
      </View>
    );
  }

  return (
    <View style={style as object} className={className}>
      {loading && (
        <View
          style={{
            ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const),
            backgroundColor: "#1a1a1a",
          }}
        />
      )}
      <Animated.View entering={loading ? undefined : FadeIn.duration(200)} style={{ flex: 1 }}>
        <Image
          source={{ uri: source }}
          style={[{ width: "100%", height: "100%" }, style as object]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Animated.View>
    </View>
  );
}
