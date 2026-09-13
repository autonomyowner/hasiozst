import { View } from "react-native";

interface BarChartProps {
  values?: number[];
  color?: string;
  height?: number;
}

export function BarChart({
  values = [3, 5, 4, 6, 5],
  color = "#FFD400",
  height = 40,
}: BarChartProps) {
  const max = Math.max(...values, 1);

  return (
    <View
      className="flex-row items-end"
      style={{ height, gap: 3 }}
    >
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: Math.max(4, (v / max) * height),
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}
