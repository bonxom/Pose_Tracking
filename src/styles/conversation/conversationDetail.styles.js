import colors from "@/constants/colors";
import { StyleSheet } from "react-native";

const AVATAR_SIZE = 28;

const conversationDetailStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  partnerName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },

  // Message list
  listContent: {
    paddingHorizontal: 12,
  },

  // Date delimiter
  dateRow: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.inkMuted,
    letterSpacing: 0.2,
  },

  // Message rows
  rowRight: {
    alignItems: "flex-end",
    paddingLeft: AVATAR_SIZE + 6 + 12, // mirror left-side indent
  },
  statusSubText: {
    fontSize: 11,
    color: colors.subtext,
    marginTop: 2,
    marginRight: 4,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // Bubbles
  bubbleRight: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "75%",
  },
  bubbleTextRight: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 20,
  },
  bubbleLeft: {
    backgroundColor: colors.bubbleLeft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "75%",
  },
  bubbleTextLeft: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },

  // Jump FAB
  jumpContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  jumpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    gap: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bubbleLeft,
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 44, // room for emoji button
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
    maxHeight: 100,
  },
  emojiAnchor: {
    position: "absolute",
    right: 8,
    alignSelf: "center",
  },
  emojiBtn: {
    padding: 4,
  },
  likeBtn: {
    padding: 6,
    borderRadius: 20,
  },
});

export default conversationDetailStyles;
