import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const globalStyles = StyleSheet.create({
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.sm,
    paddingBottom: sizes.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
});
export default globalStyles;
