import colors from "@/constants/colors";
import { Entypo } from "@expo/vector-icons";
import { View } from "react-native";

export default function CircleWithCrossIcon({
  size = 24,
  color = colors.overlay,
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceOverlay,
      }}
    >
      <Entypo name="cross" size={size * 0.72} color={color} />
    </View>
  );
}
