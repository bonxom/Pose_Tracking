import colors from "@/constants/colors";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export function ThumbUpIcon({
  size = 20,
  color = colors.button_unactive,
  filled = false,
}) {
  if (filled) {
    return <MaterialIcons name="thumb-up" size={size} color={color} />;
  }

  return (
    <MaterialCommunityIcons name="thumb-up-outline" size={size} color={color} />
  );
}

export default ThumbUpIcon;
