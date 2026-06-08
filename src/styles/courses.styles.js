import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { StyleSheet } from "react-native";

const coursesStyles = StyleSheet.create({
  // ── Layout ──
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Tab Pills ──

  tabPill: {
    backgroundColor: colors.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  // ── Divider ──
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: sizes.lg,
    marginVertical: sizes.sm,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.error,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },

  // ── User Card ──
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.lg,
    paddingVertical: 8,
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.subtext,
  },
  cardBody: {
    flex: 1,
    paddingTop: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  biggerUserName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 8,
  },
  cardButtons: {
    flexDirection: "row",
    gap: 8,
  },
  btnAccept: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnAcceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  btnReject: {
    flex: 1,
    backgroundColor: colors.gray,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnRejectText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Sub-view Nav Bar ──
  navBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: "#fff",
  },
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: colors.text,
  },

  // ── Empty / Error ──
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
  },

  // ── List spacing ──
  listContent: {
    paddingBottom: 24,
  },

  // ── Action Status Text ──
  actionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  actionStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.subtext,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});

export default coursesStyles;
