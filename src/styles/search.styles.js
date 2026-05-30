import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const searchStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerShell: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
    gap: 10,
    paddingBottom: 12,
  },
  headerBar: {
    paddingHorizontal: sizes.md,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    backgroundColor: "#EFF2F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingRight: 26,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 13,
  },
  errorText: {
    paddingHorizontal: sizes.md,
    color: colors.error,
    fontSize: 13,
  },
  panel: {
    marginHorizontal: sizes.md,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: colors.white,
    borderWidth: 0,
    gap: sizes.sm,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.sm,
    paddingHorizontal: 0,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  headerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
  },
  suggestionLoadingRow: {
    minHeight: 26,
    justifyContent: "center",
  },
  suggestionRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  suggestionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E9EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  historyMain: {
    flex: 1,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  historyBody: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  historyMenuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F7",
  },
  historyMenuButtonActive: {
    backgroundColor: "#E7F0FF",
  },
  emptyInlineText: {
    fontSize: 14,
    color: colors.subtext,
  },
  tabRow: {
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    gap: 8,
    paddingTop: 2,
  },
  tabButton: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF2F5",
  },
  tabButtonActive: {
    backgroundColor: "#DCEBFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
  },
  tabTextActive: {
    color: colors.brand,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    minHeight: 72,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userAvatarFallback: {
    backgroundColor: "#E7F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  userMeta: {
    fontSize: 13,
    color: colors.subtext,
  },
  userDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  postsHeader: {
    paddingHorizontal: sizes.md,
    paddingTop: 4,
  },
  postsHeaderTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: sizes.md,
    paddingTop: 10,
    paddingBottom: sizes.xl,
    gap: sizes.md,
  },
  idleSpacer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    paddingTop: 12,
    gap: 12,
  },
  loadingPosts: {
    paddingHorizontal: sizes.md,
    gap: sizes.md,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  peopleListContent: {
    flexGrow: 1,
    paddingHorizontal: sizes.md,
    paddingTop: 10,
    paddingBottom: sizes.xl,
  },
  peopleListRow: {
    marginBottom: sizes.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: sizes.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonGroup: {
    gap: 10,
  },
  skeletonRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  skeletonRowCompact: {
    minHeight: 48,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9EEF5",
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
  },
  skeletonLinePrimary: {
    width: "68%",
    height: 14,
  },
  skeletonLineSecondary: {
    width: "42%",
    height: 12,
  },
  postSkeletonCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: sizes.md,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  postSkeletonBlock: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#E9EEF5",
  },
  postSkeletonBlockShort: {
    height: 18,
    width: "55%",
  },
});

export default searchStyles;
