import { ThumbUpIcon } from "@/components/icons/ThumbUpIcon";
import colors from "@/constants/colors";
import { StyleSheet, View } from "react-native";

export default function ThumbUpWithCircleIcon({
  size = 20,
  circleColor = "#1877F2",
  iconSize = 14,
  iconColor = colors.white,
  filled = true,
  iconScale = 0.9,
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: circleColor,
        },
      ]}
    >
      <View style={{ transform: [{ scale: iconScale }] }}>
        <ThumbUpIcon size={iconSize} color={iconColor} filled={filled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
