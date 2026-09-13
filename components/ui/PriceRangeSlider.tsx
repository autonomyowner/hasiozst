import { useState, useCallback } from "react";
import { View, Text, PanResponder } from "react-native";
import { formatPrice } from "@/lib/formatters";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onValuesChange: (low: number, high: number) => void;
  label?: string;
}

export function PriceRangeSlider({
  min,
  max,
  low,
  high,
  onValuesChange,
  label,
}: PriceRangeSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);

  const leftPercent = ((low - min) / (max - min)) * 100;
  const rightPercent = ((high - min) / (max - min)) * 100;

  const clamp = (val: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, val));

  const createPanResponder = useCallback(
    (isLeft: boolean) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          if (sliderWidth === 0) return;
          const pxPerUnit = sliderWidth / (max - min);
          const delta = Math.round(gesture.dx / pxPerUnit);
          if (isLeft) {
            const newLow = clamp(low + delta, min, high - 1000);
            onValuesChange(newLow, high);
          } else {
            const newHigh = clamp(high + delta, low + 1000, max);
            onValuesChange(low, newHigh);
          }
        },
      }),
    [sliderWidth, min, max, low, high, onValuesChange]
  );

  const leftResponder = createPanResponder(true);
  const rightResponder = createPanResponder(false);

  return (
    <View className="mb-3">
      {label && (
        <Text className="font-mont-medium text-sm text-text-primary mb-1.5">
          {label}
        </Text>
      )}
      <View className="flex-row justify-between mb-2">
        <Text className="font-mont text-xs text-text-secondary">
          {formatPrice(low)}
        </Text>
        <Text className="font-mont text-xs text-text-secondary">
          {formatPrice(high)}
        </Text>
      </View>
      <View
        className="h-1.5 bg-card rounded-full"
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        <View
          className="absolute h-1.5 bg-primary rounded-full"
          style={{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
          }}
        />
        <View
          {...leftResponder.panHandlers}
          className="absolute h-6 w-6 rounded-full bg-primary items-center justify-center"
          style={{
            left: `${leftPercent}%`,
            top: -9,
            marginLeft: -12,
          }}
        >
          <View className="h-2 w-2 rounded-full bg-background" />
        </View>
        <View
          {...rightResponder.panHandlers}
          className="absolute h-6 w-6 rounded-full bg-primary items-center justify-center"
          style={{
            left: `${rightPercent}%`,
            top: -9,
            marginLeft: -12,
          }}
        >
          <View className="h-2 w-2 rounded-full bg-background" />
        </View>
      </View>
    </View>
  );
}
