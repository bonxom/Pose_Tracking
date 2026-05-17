import colors from "@/constants/colors";
import { StyleSheet } from "react-native";

const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },

  badge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
  },

  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },

  filterChipActive: {
    backgroundColor: colors.primaryLight,
  },

  filterText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
  },

  filterTextActive: {
    color: colors.primary,
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    backgroundColor: colors.white,
  },

  cardUnread: {
    backgroundColor: "#F0F6FF",
  },

  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarFallback: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },

  body: {
    flex: 1,
    minHeight: 58,
    justifyContent: "center",
  },

  message: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },

  messageUnread: {
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  meta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  metaRead: {
    color: colors.subtext,
    fontWeight: "500",
  },

  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
    backgroundColor: colors.primary,
  },

  empty: {
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },

  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  retryText: {
    color: colors.white,
    fontWeight: "800",
  },

  footerLoading: {
    paddingVertical: 20,
  },
});

export default notificationStyles;
