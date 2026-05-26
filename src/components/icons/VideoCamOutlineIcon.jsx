import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function VideoCamOutlineIcon({
  size = 24,
  color = colors.white,
}) {
  return <Ionicons name="videocam-outline" size={size} color={color} />;
}
