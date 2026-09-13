import { View, ImageBackground, StyleSheet, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";

interface BackgroundImageProps {
  /** Remote image URL. Ignored when `source` is given. */
  uri?: string;
  /** Local asset via require(). Takes precedence over `uri`. */
  source?: ImageSourcePropType;
  children: ReactNode;
  height?: number;
  overlayOpacity?: number;
}

export function BackgroundImage({
  uri,
  source,
  children,
  height = 280,
  overlayOpacity = 0.6,
}: BackgroundImageProps) {
  return (
    <ImageBackground
      source={source ?? { uri: uri as string }}
      style={[styles.container, { height }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          `rgba(0,0,0,${overlayOpacity * 0.3})`,
          `rgba(0,0,0,${overlayOpacity})`,
          "rgba(0,0,0,1)",
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
});
