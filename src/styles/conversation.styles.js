import colors from "@/constants/colors";
import { StyleSheet } from "react-native";

const conversationStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    backgroundColor: "#ffffff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: -0.5,
    color: "#000000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#ffffff",
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarNormal: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarUnread: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
    paddingBottom: 12,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  messageTextRead: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "normal",
  },
  messageTextUnread: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "bold",
  },
  timeText: {
    color: "#6b7280",
    fontWeight: "normal",
  },
  statusContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue || "#0865fe",
  },
  readStatusAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  errorText: {
    marginHorizontal: 16,
    marginVertical: 8,
    fontSize: 14,
    color: colors.error || "#ef4444",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
  },
});

export default conversationStyles;
