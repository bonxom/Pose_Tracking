import SearchIcon from "@/components/icons/SearchIcon";
import colors from "@/constants/colors";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export default function SearchButton({
  onPress,
  style,
  iconColor = colors.text,
  iconSize = 32,
}) {
  const handlePress = onPress || (() => router.push("/search"));

  return (
    <Pressable
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
      hitSlop={8}
      onPress={handlePress}
    >
      <SearchIcon color={iconColor} size={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
