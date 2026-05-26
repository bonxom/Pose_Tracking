import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function EllipsisHorizontalIcon({
  size = 20,
  color = colors.subtext,
}) {
  return <Ionicons name="ellipsis-horizontal" size={size} color={color} />;
}
