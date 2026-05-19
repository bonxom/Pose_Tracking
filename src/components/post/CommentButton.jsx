import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function CommentButton({ disabled = false, onPress, style }) {
  const iconColor = disabled ? colors.placeholder : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      hitSlop={8}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name="chatbubble-outline"
          size={20}
          color={iconColor}
          style={styles.icon}
        />
      </View>
      <Text
        style={[
          postStyles.secondaryButtonText,
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
    paddingVertical: 6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    transform: [{ scaleX: -1 }],
  },
  icon: {
    textAlignVertical: "center",
  },
  textDisabled: {
    color: colors.placeholder,
  },
});
