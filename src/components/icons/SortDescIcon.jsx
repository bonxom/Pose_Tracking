import colors from "@/constants/colors";
import Svg, { Path, G } from "react-native-svg";

export default function SortDescIcon({ color = colors.text, size = 24 }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
      <G fill={color}>
        <Path d="m3 3c-.55228 0-1 .44772-1 1s.44772 1 1 1h11c.5523 0 1-.44772 1-1s-.4477-1-1-1z" />
        <Path d="m3 7c-.55228 0-1 .44772-1 1s.44772 1 1 1h7c.5523 0 1-.44772 1-1s-.4477-1-1-1z" />
        <Path d="m3 11c-.55228 0-1 .4477-1 1s.44772 1 1 1h4c.55228 0 1-.4477 1-1s-.44772-1-1-1z" />
        <Path d="m15 8c0-.55228-.4477-1-1-1s-1 .44771-1 1v5.5858l-1.2929-1.2929c-.3905-.3905-1.0237-.3905-1.4142 0-.39053.3905-.39053 1.0237 0 1.4142l3 3c.1875.1875.4419.2929.7071.2929s.5196-.1054.7071-.2929l3-3c.3905-.3905.3905-1.0237 0-1.4142s-1.0237-.3905-1.4142 0l-1.2929 1.2929z" />
      </G>
    </Svg>
  );
}
