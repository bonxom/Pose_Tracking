import colors from "@/constants/colors";
import Svg, { Circle, Path } from "react-native-svg";

export default function SearchIcon({ focused, color, size = 24 }) {
  const strokeColor = color || (focused ? colors.primary : colors.text);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={strokeColor} strokeWidth={2} />
      <Path
        d="M20 20L16.65 16.65"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
