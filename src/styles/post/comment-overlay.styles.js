import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const commentOverlayStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.36)",
  },
  sheet: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.white,
    paddingHorizontal: sizes.lg,
    gap: sizes.md,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  commentListContainer: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  dragZone: {
    paddingTop: sizes.xs,
    gap: sizes.xs,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  likeSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  likeSummaryCount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: sizes.xs,
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: 8,
    gap: 12,
  },
  loadMoreButton: {
    paddingVertical: sizes.sm,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  commentErrorText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
    paddingBottom: sizes.xs,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
  },
  commentList: {
    flex: 1,
  },
  commentListContent: {
    paddingBottom: sizes.md,
  },
  reactionDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  composer: {
    gap: sizes.sm,
    paddingTop: sizes.xs,
    paddingBottom: sizes.xs,
    position: "relative",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: sizes.xs,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginBottom: 6,
  },
  composerAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  commentInputWrap: {
    flex: 1,
    marginBottom: 0,
  },
  commentInput: {
    minHeight: 48,
    maxHeight: 132,
    textAlignVertical: "top",
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconButtonActive: {
    opacity: 0.85,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  sendButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIconRotate: {
    transform: [{ rotate: "-45deg" }],
  },
  scoreCommentCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scoreCommentText: {
    fontWeight: "700",
    marginVertical: 4,
  },
});

export default commentOverlayStyles;
