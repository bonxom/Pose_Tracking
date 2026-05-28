import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileIcon({ name, size = 24, color = colors.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

