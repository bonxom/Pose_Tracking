import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function CloseIcon({ size = 28, color = colors.white }) {
  return <Ionicons name="close" size={size} color={color} />;
}
