import { ThumbUpIcon } from "@/components/icons/ThumbUpIcon";
import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { Pressable, StyleSheet, Text } from "react-native";

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
        color={isLiked ? colors.primary : colors.button_unactive}
        filled={isLiked}
      />
      <Text
        style={[
          postStyles.secondaryButtonText,
          styles.labelText,
          !isLiked && styles.inactiveText,
          isLiked && styles.activeText,
        ]}
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
    paddingVertical: 0,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  activeText: {
    color: colors.primary,
  },
  inactiveText: {
    color: colors.button_unactive,
  },
  labelText: {
    fontWeight: "500",
  },
});
