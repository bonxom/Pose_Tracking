import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function UploadIcon({ size = 28, color = colors.white }) {
  return <Ionicons name="cloud-upload-outline" size={size} color={color} />;
}
