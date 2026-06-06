import colors from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export default function IconWithBadge({ icon, badge }) {
  const formatBadge = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return null;
    if (num > 99) return "99+";
    return String(num);
  };

  const badgeText = formatBadge(badge);

  return (
    <View style={styles.container}>
      {icon}
      {badgeText ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 18,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.badgeIcon,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
  },
});
