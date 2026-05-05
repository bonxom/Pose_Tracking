import { StyleSheet } from "react-native";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";

const demoStyles = StyleSheet.create({
  screen: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: sizes.md,
  },
  scrollContent: {
    paddingVertical: sizes.md,
    gap: sizes.md,
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: sizes.radiusMd,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.lg,
    gap: sizes.xs,
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
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.radiusMd,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.lg,
    gap: sizes.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: sizes.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
    padding: sizes.md,
    gap: sizes.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.subtext,
  },
  resultRow: {
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
    padding: sizes.md,
    gap: sizes.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  input: {
    minHeight: 44,
    borderRadius: sizes.radiusMd,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: sizes.md,
    color: colors.text,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
    padding: sizes.md,
  },
});

export default demoStyles;
