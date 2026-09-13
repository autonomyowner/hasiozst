import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";

interface LineChartProps {
  values?: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function LineChart({
  values = [10, 30, 20, 50, 40, 60, 45],
  color = "#FFD400",
  width = 60,
  height = 35,
}: LineChartProps) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
