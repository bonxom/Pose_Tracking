import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

export function ThumbUpIcon({
  size = 20,
  color = colors.grey,
  filled = false,
}) {
  if (filled) {
    return <MaterialIcons name="thumb-up" size={size} color={color} />;
  }

  return (
    <MaterialCommunityIcons name="thumb-up-outline" size={size} color={color} />
  );
}

export default function LikeButton({ isLiked, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
      hitSlop={8}
    >
      <ThumbUpIcon
        size={20}
        color={isLiked ? colors.primary : colors.grey}
        filled={isLiked}
      />
      <Text
        style={[postStyles.secondaryButtonText, isLiked && styles.activeText]}
      >
        Thích
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  activeText: {
    color: colors.primary,
  },
});
