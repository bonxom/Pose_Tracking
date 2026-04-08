import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const postStyles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  screenInner: {
    flex: 1,
  },
  scrollContent: {
    padding: sizes.lg,
    gap: sizes.lg,
  },
  listContent: {
    padding: sizes.lg,
    gap: sizes.lg,
  },
  sectionHeader: {
    gap: sizes.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.subtext,
  },
  row: {
    flexDirection: "row",
    gap: sizes.md,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.radiusLg,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.lg,
    gap: sizes.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  metaText: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
  freshMetaText: {
    color: colors.primary,
    fontWeight: "700",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  expandText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  mediaList: {
    gap: sizes.sm,
  },
  mediaCard: {
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
    padding: sizes.md,
    gap: sizes.xs,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  mediaSubtitle: {
    fontSize: 13,
    color: colors.subtext,
  },
  statsRow: {
    flexDirection: "row",
    gap: sizes.md,
  },
  statText: {
    fontSize: 13,
    color: colors.subtext,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.sm,
  },
  actionButton: {
    minWidth: 96,
  },
  secondaryButton: {
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  likeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  likeButtonActiveText: {
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radiusLg,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.xl,
    gap: sizes.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.subtext,
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.radiusLg,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.lg,
    gap: sizes.md,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: sizes.radiusLg,
    padding: sizes.md,
    gap: sizes.xs,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  slotRow: {
    gap: sizes.sm,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  slotHint: {
    fontSize: 12,
    color: colors.subtext,
  },
  divider: {
    height: sizes.borderWidth,
    backgroundColor: colors.border,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radiusMd,
    padding: sizes.md,
    gap: sizes.xs,
  },
  scoreCommentCard: {
    borderWidth: sizes.borderWidth,
    borderColor: colors.primaryLight,
    backgroundColor: "#EFF6FF",
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  commentMeta: {
    fontSize: 12,
    color: colors.subtext,
  },
  lockedText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: "600",
  },
  topPillButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginBottom: sizes.md,
  },
  topPillText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.radiusLg,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.lg,
    gap: sizes.md,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  draftBanner: {
    borderWidth: sizes.borderWidth,
    borderColor: colors.primaryLight,
    backgroundColor: "#EFF6FF",
    borderRadius: sizes.radiusMd,
    padding: sizes.md,
    gap: sizes.xs,
  },
});
export default postStyles;
