import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const postStyles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: sizes.lg,
  },

  detailScreen: {
    padding: 0,
    backgroundColor: colors.surface,
  },
  detailBody: {
    flex: 1,
  },
  detailScrollView: {
    flex: 1,
  },
  detailHeader: {
    minHeight: 56,
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.sm,
    backgroundColor: colors.white,
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  detailScrollContent: {
    paddingTop: sizes.sm,
    paddingBottom: sizes.xl,
    gap: 0,
  },
  detailCommentsSection: {
    backgroundColor: colors.white,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.md,
    paddingBottom: sizes.md,
    gap: sizes.sm,
  },
  detailCommentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.md,
  },
  detailCommentsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  detailCommentsCount: {
    fontSize: 13,
    color: colors.subtext,
  },
  detailCommentList: {
    gap: sizes.sm,
  },
  detailCommentSkeletons: {
    gap: sizes.sm,
  },
  detailCommentsState: {
    paddingVertical: sizes.xs,
  },
  detailCommentsEmpty: {
    fontSize: 14,
    color: colors.subtext,
    paddingVertical: sizes.xs,
  },
  detailLoadMoreComments: {
    alignSelf: "flex-start",
    paddingVertical: sizes.xs,
  },
  detailLoadMoreCommentsPressed: {
    opacity: 0.7,
  },
  detailLoadMoreCommentsText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  detailCommentComposerLink: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: sizes.md,
    marginTop: sizes.xs,
  },
  detailCommentComposerLinkPressed: {
    opacity: 0.75,
  },
  detailCommentComposerText: {
    fontSize: 14,
    color: colors.subtext,
  },
  detailInlineComposer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  detailInlineComposerInput: {
    marginBottom: 0,
  },
  detailBottomComposerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
    paddingHorizontal: sizes.md,
    paddingTop: sizes.md,
  },
  detailCommentsLocked: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.subtext,
    paddingTop: sizes.xs,
  },
  detailStatus: {
    marginHorizontal: sizes.md,
    marginTop: sizes.sm,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.white,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    padding: sizes.md,
  },
  detailState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: sizes.xl,
    gap: sizes.md,
  },
  detailStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  detailStateText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.subtext,
    textAlign: "center",
  },
  detailStateButton: {
    marginTop: sizes.xs,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.sm,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  detailStateButtonPressed: {
    opacity: 0.8,
  },
  detailStateButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
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
    gap: sizes.ssm,
    paddingBottom: sizes.md,
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
    backgroundColor: colors.gray,
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
  authorMetaGroup: {
    flex: 1,
    gap: 1,
  },
  metaText: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 0,
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
  exerciseBanner: {
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.primaryLight,
    padding: sizes.md,
    gap: sizes.xs,
  },
  exerciseBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
  },
  exerciseBannerText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  exerciseBannerMeta: {
    fontSize: 12,
    color: colors.subtext,
  },
  expandText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  mediaList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.sm,
  },
  mediaCard: {
    flexGrow: 1,
    flexBasis: 150,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
    padding: sizes.md,
    gap: sizes.xs,
  },
  selectedMediaCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
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
  statTextRight: {
    marginLeft: "auto",
    textAlign: "right",
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.sm,
  },
  hashtagText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
  scoreSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    borderWidth: sizes.borderWidth,
    borderColor: colors.primaryLight,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.primaryLight,
    padding: sizes.md,
  },
  scoreSummaryNumber: {
    width: 68,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  scoreSummaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  scoreSummaryText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.subtext,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: sizes.lg,
    alignItems: "center",
    marginVertical: -2,
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
    padding: sizes.xs,
    gap: sizes.xxs,
  },
  scoreCommentCard: {
    borderWidth: sizes.borderWidth,
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryLight,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    paddingLeft: sizes.xs,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    padding: sizes.xs,
  },
  commentMeta: {
    fontSize: 12,
    color: colors.subtext,
    paddingLeft: 40,
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
    backgroundColor: colors.primaryLight,
    borderRadius: sizes.radiusMd,
    padding: sizes.md,
    gap: sizes.xs,
  },
});
export default postStyles;
