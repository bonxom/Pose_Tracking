import colors from "@/constants/colors";
import Svg, { Circle, Path } from "react-native-svg";

export default function AccountIcon({ focused, size = 24 }) {
  const color = focused ? colors.primary : colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={12} cy={9} r={3} fill={color} />
      <Path
        d="M6.9 17.75c.9-2.38 2.8-3.75 5.1-3.75s4.2 1.37 5.1 3.75"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
