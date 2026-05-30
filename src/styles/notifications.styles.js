import { StyleSheet } from "react-native";

const colors = {
  white: "#FFFFFF",
  background: "#F0F2F5",
  text: "#1C1E21",
  muted: "#65676B",
  border: "#E4E6EB",
  primary: "#0866FF",
  primaryLight: "#E7F3FF",
  unread: "#EAF3FF",
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F2F5",
    marginBottom: 12,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F0F2F5",
  },

  filterChipActive: {
    backgroundColor: "#E7F3FF",
  },

  filterText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.muted,
  },

  filterTextActive: {
    color: colors.primary,
  },

  listContent: {
    paddingBottom: 24,
  },

  notificationItem: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },

  notificationItemUnread: {
    backgroundColor: colors.unread,
  },

  notificationItemPressed: {
    opacity: 0.75,
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

  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBody: {
    flex: 1,
    paddingRight: 8,
  },

  notificationTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "500",
  },

  notificationTitleUnread: {
    fontWeight: "800",
  },

  notificationTime: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2F6FED",
    marginLeft: 6,
  },

  emptyState: {
    paddingTop: 90,
    paddingHorizontal: 28,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    color: colors.muted,
  },

  footerLoader: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  footerLoaderText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
  },

  endText: {
    paddingVertical: 18,
    textAlign: "center",
    fontSize: 13,
    color: colors.muted,
  },

  errorText: {
    fontSize: 15,
    color: "#E41E3F",
    marginBottom: 12,
  },

  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
