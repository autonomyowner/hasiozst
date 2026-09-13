import { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackgroundImage } from "@/components/layout/BackgroundImage";
import { Button } from "@/components/ui/Button";
import { demoPhotos } from "@/lib/demoContent";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "hasSeenOnboarding";



const slides = [
  {
    id: "1",
    backgroundUri: demoPhotos.habitasPool,
    title: "Stay Somewhere\nUnforgettable",
    subtitle: "S t a y s",
    description:
      "Desert villas in AlUla, cliff suites on the Red Sea, quiet rooms in the highlands. Browse real photos and video from the people who run them.",
  },
  {
    id: "2",
    backgroundUri: demoPhotos.culture,
    title: "Book Experiences,\nNot Just Rooms",
    subtitle: "E x p e r i e n c e s",
    description:
      "Island day trips, heritage walks, sunrise caravans. Everything Saudi has to offer, bookable in a few taps.",
  },
  {
    id: "3",
    backgroundUri: demoPhotos.nature,
    title: "Hosts Share\nTheir Own Story",
    subtitle: "R e e l s",
    description:
      "Hotels and guides post short videos straight from the property, so you see the place as it really is before you book.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/sign-in");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <BackgroundImage uri={item.backgroundUri} height={380}>
              <View className="px-6 pt-14">
                <Text className="font-mont-bold text-lg text-primary">
                  HASIO
                </Text>
              </View>
            </BackgroundImage>

            <View className="px-6 -mt-8">
              <Text className="font-mont text-[10px] text-primary tracking-[4px] mb-2">
                {item.subtitle}
              </Text>
              <Text className="font-mont-bold text-3xl text-text-primary leading-[38px] mb-3">
                {item.title}
              </Text>
              <Text className="font-mont text-sm text-text-secondary leading-5">
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View className="px-6 pb-20">
        {/* Page dots — left-aligned like Figma */}
        <View className="flex-row mb-6" style={{ gap: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${
                i === currentIndex ? "w-6 bg-primary" : "w-2 bg-text-secondary"
              }`}
            />
          ))}
        </View>

        {isLastSlide ? (
          <View>
            <Button
              title="Get Started"
              onPress={completeOnboarding}
              fullWidth
            />
            <Pressable onPress={completeOnboarding} className="mt-4 items-center">
              <Text className="font-mont text-sm text-text-secondary">
                Already have an account?{" "}
                <Text className="font-mont-bold text-primary">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Button title="Next  →" onPress={handleNext} size="md" />
            <Pressable
              onPress={completeOnboarding}
              className="rounded-card px-6 py-3"
              style={{ backgroundColor: "rgba(26,75,95,0.10)" }}
            >
              <Text className="font-mont-semibold text-sm text-text-primary">
                Skip
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };
