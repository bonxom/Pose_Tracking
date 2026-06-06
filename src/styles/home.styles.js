import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import sizes from "../constants/sizes";

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: sizes.sm,
    paddingTop: sizes.sm,
    paddingBottom: sizes.md,
    marginBottom: sizes.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
    marginTop: sizes.xs,
  },
  sourceLabel: {
    alignSelf: "flex-start",
    marginTop: sizes.sm,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.xs,
  },
  errorText: {
    marginTop: sizes.sm,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  newItemsButton: {
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.sm,
    marginBottom: sizes.md,
  },
  newItemsText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  buttonSpacing: {
    height: sizes.md,
  },
  postDivider: {
    height: sizes.dividerWidth,
    backgroundColor: colors.border,
  },
  loadingCard: {
    marginHorizontal: sizes.md,
    marginVertical: sizes.md,
    padding: sizes.md,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: sizes.sm,
  },
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  loadingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E9EEF5",
  },
  loadingMeta: {
    flex: 1,
    gap: sizes.xs,
  },
  loadingBlock: {
    height: 180,
    borderRadius: 14,
    backgroundColor: "#E9EEF5",
  },
  loadingLinePrimary: {
    width: "48%",
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
  },
  loadingLineSecondary: {
    width: "36%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
  },
  loadingLineTertiary: {
    width: "72%",
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
  },
});

export default homeStyles;
