import colors from "@/constants/colors";
import Svg, { Path } from "react-native-svg";

export default function SmileIcon({ size = 16, color = colors.subtext }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        fill={color}
        d="M10.75 8a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zM6.5 6.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zM6 9.941a.75.75 0 0 0-1 1.118c.776.695 1.825 1.191 3 1.191s2.224-.496 3-1.191a.75.75 0 1 0-1-1.118c-.55.493-1.255.809-2 .809-.745 0-1.45-.316-2-.809z"
      />
      <Path
        fill={color}
        d="M8 .5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z"
      />
    </Svg>
  );
}
