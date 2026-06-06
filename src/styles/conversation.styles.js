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
    paddingVertical: 8,
    gap: 12,
    backgroundColor: "#ffffff",
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: colors.blue,
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
