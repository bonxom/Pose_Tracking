import colors from "@/constants/colors";
import Svg, { Path } from "react-native-svg";

export default function MenuIcon({ focused, size = 24 }) {
  const color = focused ? colors.primary : colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5h16M4 12h16M4 17.5h16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
