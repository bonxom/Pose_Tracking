import colors from "@/constants/colors";
import Svg, { Path } from "react-native-svg";

export default function BellIcon({ focused, size = 24 }) {
  const color = focused ? colors.primary : colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={
          focused
            ? "M12 2C8.134 2 5 5.134 5 9v3.764c0 1.17-.366 2.31-1.047 3.262l-.678.95A1.95 1.95 0 0 0 4.862 20h14.276a1.95 1.95 0 0 0 1.587-3.024l-.678-.95A5.617 5.617 0 0 1 19 12.764V9c0-3.866-3.134-7-7-7Zm-2.75 19.25a2.75 2.75 0 0 0 5.5 0h-5.5Z"
            : "M12 2C8.134 2 5 5.134 5 9v3.764c0 1.17-.366 2.31-1.047 3.262l-.678.95A1.95 1.95 0 0 0 4.862 20h14.276a1.95 1.95 0 0 0 1.587-3.024l-.678-.95A5.617 5.617 0 0 1 19 12.764V9c0-3.866-3.134-7-7-7Zm0 2c2.762 0 5 2.238 5 5v3.764c0 1.587.496 3.135 1.42 4.426l.578.81H4.752l.578-.81A7.617 7.617 0 0 0 7 12.764V9c0-2.762 2.238-5 5-5Zm-2.75 17.25h5a1.75 1.75 0 0 1-5 0Z"
        }
        fill={color}
      />
    </Svg>
  );
}
