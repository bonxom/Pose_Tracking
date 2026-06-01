import CommentIcon from "@/components/icons/CommentIcon";
import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { Pressable, StyleSheet, Text } from "react-native";

export default function CommentButton({ disabled = false, onPress, style }) {
  const iconColor = disabled ? colors.placeholder : colors.button_unactive;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      className="active:opacity-70"
      hitSlop={8}
    >
      <CommentIcon size={20} color={iconColor} />
      <Text
        style={[
          postStyles.secondaryButtonText,
          styles.labelText,
          !disabled && styles.textInactive,
          disabled && styles.textDisabled,
        ]}
      >
        Bình luận
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
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: colors.placeholder,
  },
  textInactive: {
    color: colors.button_unactive,
  },
  labelText: {
    fontWeight: "500",
  },
});
