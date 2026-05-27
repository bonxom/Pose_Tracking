import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function EarthIcon({ size = 14, color = colors.subtext }) {
  return <Ionicons name="earth" size={size} color={color} />;
}
