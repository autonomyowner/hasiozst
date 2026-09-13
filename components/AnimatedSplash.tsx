import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  // Logo
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-8);
  // Brand text
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(12);
  // Subtitle
  const subOpacity = useSharedValue(0);
  // Line accent
  const lineWidth = useSharedValue(0);
  // Overlay fade out
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Logo pops in with slight rotation correction (0ms)
    logoOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.6 });
    logoRotate.value = withSpring(0, { damping: 14, stiffness: 160, mass: 0.6 });

    // 2. Brand name slides up (300ms)
    brandOpacity.value = withDelay(300, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    brandTranslateY.value = withDelay(300, withSpring(0, { damping: 16, stiffness: 140 }));

    // 3. Yellow accent line draws in (500ms)
    lineWidth.value = withDelay(500, withTiming(48, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // 4. Subtitle fades in (650ms)
    subOpacity.value = withDelay(650, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));

    // 5. Hold for a beat, then fade out (1600ms)
    overlayOpacity.value = withDelay(
      1600,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onFinish)();
      })
    );
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));
  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
    opacity: lineWidth.value > 0 ? 1 : 0,
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subOpacity.value }));

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      {/* Logo */}
      <Animated.View style={logoStyle}>
        <Image
          source={require("../assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={[styles.brandRow, brandStyle]}>
        <Animated.Text style={styles.brandAi}>AI</Animated.Text>
        <Animated.Text style={styles.brandTridi}>TRIDI</Animated.Text>
      </Animated.View>

      {/* Yellow accent line */}
      <Animated.View style={[styles.accentLine, lineStyle]} />

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, subStyle]}>
        سوق الجزائر الذكي
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  logo: {
    width: 100,
    height: 100,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 16,
    gap: 6,
  },
  brandAi: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 30,
    color: "#fff",
    letterSpacing: 3,
  },
  brandTridi: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 30,
    color: "#FFD400",
    letterSpacing: 3,
  },
  accentLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFD400",
    marginTop: 10,
  },
  subtitle: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
