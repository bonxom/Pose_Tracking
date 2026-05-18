import colors from "@/constants/colors";
import Svg, { Path } from "react-native-svg";

export default function BackIcon({ color = colors.text, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
