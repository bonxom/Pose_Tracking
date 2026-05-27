import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function CommentIcon({ size = 20, color = colors.text }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name="chatbubble-outline"
        size={size}
        color={color}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    transform: [{ scaleX: -1 }],
    padding: 0,
  },
  icon: {
    textAlignVertical: "center",
  },
});
